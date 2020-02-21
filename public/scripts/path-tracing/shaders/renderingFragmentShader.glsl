#version 300 es


precision highp float;
precision highp int;
precision highp sampler2D;


// -----------------------------
// DEFINES
// -----------------------------

// this line is dynamically replaced when compiling shader program
@import-defines

#define PI               3.14159265358979323
#define TWO_PI           6.28318530717958648
#define FOUR_PI          12.5663706143591729
#define ONE_OVER_PI      0.31830988618379067
#define ONE_OVER_TWO_PI  0.15915494309
#define ONE_OVER_FOUR_PI 0.07957747154594767
#define PI_OVER_TWO      1.57079632679489662
#define ONE_OVER_THREE   0.33333333333333333
#define E                2.71828182845904524
#define INFINITY         1000000.0

#define NONE         	 -1000000
#define SPOT_LIGHT -2
#define POINT_LIGHT -1
#define LIGHT 0
#define DIFF 1
#define REFR 2
#define SPEC 3
#define COAT 4
#define CARCOAT 5
#define TRANSLUCENT 6
#define SPECSUB 7
#define CHECK 8
#define WATER 9
#define PBR_MATERIAL 10
#define WOOD 11
#define SEAFLOOR 12
#define TERRAIN 13
#define CLOTH 14
#define LIGHTWOOD 15
#define DARKWOOD 16
#define PAINTING 17
#define METALCOAT 18

// (1 / 2048 texture width)
#define INV_TEXTURE_WIDTH 1.0 / 2048.0

#define N_POINTS 32.0


// -----------------------------
// OUT COLORS
// -----------------------------
layout(location = 0) out vec4 outColor0;   // vec4(texture-ID, U, V, <non-reserved>)
layout(location = 1) out vec4 outColor1;   // vec4(ray-origin-X, ray-origin-Y, ray-origin-Z, <non-reserved>)
layout(location = 2) out vec4 outColor2;   // vec4(ray-direction-X, ray-direction-Y, ray-direction-Z, <non-reserved>)


// -----------------------------
// IN COLORS
// -----------------------------

uniform sampler2D inColor0;
uniform sampler2D inColor1;
uniform sampler2D inColor2;

// -----------------------------
// UNIFORMS
// -----------------------------

uniform bool uCameraIsMoving;
uniform bool uCameraJustStartedMoving;

uniform float uEPS_intersect;
uniform float uTime;
uniform float uSampleCounter;
uniform float uFrameCounter;
uniform float uULen;
uniform float uVLen;
uniform float uApertureSize;
uniform float uFocusDistance;

uniform float CANVAS_WIDTH;
uniform float CANVAS_HEIGHT;

uniform mat4 uCameraMatrix;
uniform vec3 cameraPosition;


// previously rendered texture
uniform sampler2D tPreviousTexture;

// actual model triangles with info about position and texture
uniform sampler2D tTriangleTexture;

// AABB tree for checking if ray hit model
uniform sampler2D tAABBTexture;

uniform float uAmbientLightIntensity;
uniform vec3 uAmbientLightColor;

uniform int uBounces;


// -----------------------------
// GLOBAL VARIABLES
// -----------------------------

uvec2 seed;



// -----------------------------
// Structs
// -----------------------------

struct Ray 
{
	vec3 origin; 
	vec3 direction; 
};

struct Intersection 
{	 
	vec3 normal; 
	vec3 emission; 
	vec3 color; 
	vec2 uv; 
	int type; 
	int albedoTextureID; 
	float opacity;
};

struct StackLevelData
{
	float id;
	float rayT;
} stackLevels[24];

struct BoxNode
{
	float branch_A_Index;
	vec3 minCorner;
	float branch_B_Index;
	vec3 maxCorner;
};



//-----------------------------------------------------------------------
// Taken from iq https://www.shadertoy.com/view/4tXyWN
// float rand( inout uvec2 seed )
// //-----------------------------------------------------------------------
// {
// 	seed += uvec2(1);
// 
//     uvec2 q = 1103515245 * ( (seed>>1) ^ (seed.yx) );
//     uint  n = 1103515245 * ( (q.x) ^ (q.y>>3) );
// 
// 	return float(n) * (1.0 / float(0xffffffffU));
// }
float rand( inout uvec2 seed )
{
	seed += uvec2(1);

    	uvec2 q = 1103515245U * ( (seed >> 1U) ^ (seed.yx) );
    	uint  n = 1103515245U * ( (q.x) ^ (q.y >> 3U) );
	return float(n) * (1.0 / float(0xffffffffU));
}



//-----------------------------------------------------------------------
vec3 randomCosWeightedDirectionInHemisphere( vec3 nl, inout uvec2 seed )
//-----------------------------------------------------------------------
{
	float i = floor(N_POINTS * rand(seed)) + (rand(seed) * 0.5);
			// the Golden angle in radians
	float theta = i * 2.39996322972865332 + mod(uSampleCounter, TWO_PI);
	theta = mod(theta, TWO_PI);
	float r = sqrt(i / N_POINTS); // sqrt pushes points outward to prevent clumping in center of disk
	float x = r * cos(theta);
	float y = r * sin(theta);
	vec3 p = vec3(x, y, sqrt(1.0 - x * x - y * y)); // project XY disk points outward along Z axis
	
	vec3 u = normalize( cross( abs(nl.x) > 0.1 ? vec3(0, 1, 0) : vec3(1, 0, 0), nl ) );
	vec3 v = cross(nl, u);

	return (u * p.x + v * p.y + nl * p.z);
}



//-----------------------------------------------------------------------
float calcFresnelReflectance(vec3 rayDirection, vec3 n, float etai, float etat, out float ratioIoR)
//-----------------------------------------------------------------------
{
	float temp;
	float cosi = clamp(dot(rayDirection, n), -1.0, 1.0);
	if (cosi > 0.0)
	{
		temp = etai;
		etai = etat;
		etat = temp;
	}
	
	ratioIoR = etai / etat;
	float sint = ratioIoR * sqrt(max(0.0, 1.0 - (cosi * cosi)));
	if (sint >= 1.0) 
		return 1.0; // total internal reflection

	float cost = sqrt(max(0.0, 1.0 - (sint * sint)));
	cosi = abs(cosi);
	float Rs = ((etat * cosi) - (etai * cost)) / ((etat * cosi) + (etai * cost));
	float Rp = ((etai * cosi) - (etat * cost)) / ((etai * cosi) + (etat * cost));

	return ((Rs * Rs) + (Rp * Rp)) * 0.5;
}



//--------------------------------------------------------------------------------------
float BoundingBoxIntersect( vec3 minCorner, vec3 maxCorner, vec3 rayOrigin, vec3 invDir )
//--------------------------------------------------------------------------------------
{
	vec3 near = (minCorner - rayOrigin) * invDir;
	vec3 far  = (maxCorner - rayOrigin) * invDir;
	
	vec3 tmin = min(near, far);
	vec3 tmax = max(near, far);
	
	float t0 = max( max(tmin.x, tmin.y), tmin.z);
	float t1 = min( min(tmax.x, tmax.y), tmax.z);
	
	if (t0 > t1 || t1 < 0.0) return INFINITY;
	
	return t0;	
}



//---------------------------------------------------------------------------------------
float BVH_TriangleIntersect( vec3 v0, vec3 v1, vec3 v2, Ray r, out float u, out float v )
//---------------------------------------------------------------------------------------
{
	vec3 edge1 = v1 - v0;
	vec3 edge2 = v2 - v0;
	vec3 pvec = cross(r.direction, edge2);
	float det = 1.0 / dot(edge1, pvec);

	// comment out the following line if double-sided triangles are wanted, or ...
	// uncomment the following line if back-face culling is desired (front-facing triangles only)
	if (det < 0.0) return INFINITY;

	vec3 tvec = r.origin - v0;
	u = dot(tvec, pvec) * det;

	if (u < 0.0 || u > 1.0) return INFINITY;

	vec3 qvec = cross(tvec, edge1);
	v = dot(r.direction, qvec) * det;

	if (v < 0.0 || u + v > 1.0) return INFINITY;

	return dot(edge2, qvec) * det;
}



// //-----------------------------------------------------------------------
// // Gets element on specified index from array.
// vec4 Array_getByIndex(int index, vec4 array[])
// //-----------------------------------------------------------------------
// {
// 	ivec2 uv = ivec2(index, 0);
// 	int depth = 0;
// 
// 	return texelFetch(array, uv, depth);
// }



//-----------------------------------------------------------------------
// Because array indexing cannot be done via for loop it will be done via function and static indexing.
// sampler2d also cannot be return type of the function. Any of the opaque types cannot be.
vec3 GetTexturePixelsFromArray(int index, sampler2D array[MAX_TEXTURES_IN_ARRAY], vec2 uv)
//-----------------------------------------------------------------------
{
	switch(index)
	{
		case 0:
			return texture(array[0], uv).rgb;

		case 1:
			return texture(array[1], uv).rgb;

/*		case 2:
			return texture(array[2], uv).rgb;

		case 3:
			return texture(array[3], uv).rgb;

		case 4:
			return texture(array[4], uv).rgb;

		case 5:
			return texture(array[5], uv).rgb;

		case 6:
			return texture(array[6], uv).rgb;

		case 7:
			return texture(array[7], uv).rgb;

		case 8:
			return texture(array[8], uv).rgb;

		case 9:
			return texture(array[9], uv).rgb;
			*/
	}

	return vec3(-1, -1, -1);
}


//-----------------------------------------------------------------------
BoxNode GetBoxNode(const in float i)
//-----------------------------------------------------------------------
{
	// each bounding box's data is encoded in 2 rgba(or xyzw) texture slots 
	float iX2 = (i * 2.0);
	// (iX2 + 0.0) corresponds to .x: idLeftChild, .y: aabbMin.x, .z: aabbMin.y, .w: aabbMin.z 
	// (iX2 + 1.0) corresponds to .x: idRightChild .y: aabbMax.x, .z: aabbMax.y, .w: aabbMax.z 

	ivec2 uv0 = ivec2( mod(iX2 + 0.0, 2048.0), floor((iX2 + 0.0) * INV_TEXTURE_WIDTH) );
	ivec2 uv1 = ivec2( mod(iX2 + 1.0, 2048.0), floor((iX2 + 1.0) * INV_TEXTURE_WIDTH) );
	
	vec4 aabbNodeData0 = texelFetch(tAABBTexture, uv0, 0);
	vec4 aabbNodeData1 = texelFetch(tAABBTexture, uv1, 0);
	
	BoxNode BN = BoxNode( aabbNodeData0.x, aabbNodeData0.yzw, aabbNodeData1.x, aabbNodeData1.yzw );

	return BN;
}


//-----------------------------------------------------------------------
vec3 GetSkycubeColor(Ray r)
//-----------------------------------------------------------------------
{
	float posU;
	float posV;
	int skyMap;
	
	if(abs(r.direction.x) > abs(r.direction.y))
	{
		if(abs(r.direction.x) > abs(r.direction.z))
		{
			// x is dominant axis.

			// X direction is probably flipped, so positiveX image is actually negativeX image

			if (r.direction.x < 0.0)
			{
				// -X is dominant axis -> left face
				skyMap = 0;

				posU = r.direction.z / r.direction.x;
				posV = -r.direction.y / (-r.direction.x);
			}
			else
			{
				// +X is dominant axis -> right face
				skyMap = 1;

				posU = r.direction.z / r.direction.x;
				posV = -r.direction.y / r.direction.x;
			}				
		}
		else
		{
			// z is dominant axis.
			if (r.direction.z < 0.0)
			{
				// -Z is dominant axis -> front face
				skyMap = 5;

				posU = r.direction.x / (-r.direction.z);
				posV = -r.direction.y / (-r.direction.z);
			}
			else
			{
				// +Z is dominant axis -> back face
				skyMap = 4;

				posU = -r.direction.x / r.direction.z;
				posV = -r.direction.y / r.direction.z;
			}
		}
	}
	else if(abs(r.direction.y) > abs(r.direction.z))
	{
		// y is dominant axis.
		if (r.direction.y < 0.0)
		{
			// -Y is dominant axis -> bottom face
			skyMap = 3;

			posU = r.direction.x / r.direction.y;
			posV = -r.direction.z / (-r.direction.y);
		}
		else
		{
			// +Y is dominant axis -> top face
			skyMap = 2;

			posU = -r.direction.x / r.direction.y;
			posV = r.direction.z / r.direction.y;
		}
	}
	else
	{
		// z is dominant axis.
		if (r.direction.z < 0.0)
		{
			// -Z is dominant axis -> front face
			skyMap = 5;

			posU = r.direction.x / (-r.direction.z);
			posV = -r.direction.y / (-r.direction.z);
		}
		else
		{
			// +Z is dominant axis -> back face
			skyMap = 4;

			// compute the orthogonal normalized texture coordinates. Start with a normalized [-1..1] space
			posU = -r.direction.x / r.direction.z;
			posV = -r.direction.y / r.direction.z;
		}
	}

	// need to transform this to [0..1] space
	posU = (1.0 + posU) / 2.0;
	posV = (1.0 + posV) / 2.0;

	outColor0 = vec4(skyMap, posU, posV, 0.0);

	return vec3(0.0);

	/*vec2 uv = vec2(posU, posV);
	vec3 pixelColor;
	
	switch(skyMap)
	{
		case 0:
			pixelColor = texture(tSkyCubeTextures[0], uv).rgb;
			break;
	
		case 1:
			pixelColor = texture(tSkyCubeTextures[1], uv).rgb;
			break;
	
		case 2:
			pixelColor = texture(tSkyCubeTextures[2], uv).rgb;
			break;
	
		case 3:
			pixelColor = texture(tSkyCubeTextures[3], uv).rgb;
			break;
	
		case 4:
			pixelColor = texture(tSkyCubeTextures[4], uv).rgb;
			break;
	
		case 5:
			pixelColor = texture(tSkyCubeTextures[5], uv).rgb;
			break;
	}
	
	// gama to linear color space	
	pixelColor = pow(pixelColor, vec3(2.2));
	
	return pixelColor;*/
}


//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
// With the help of AABB graph we can find out if ray intersects any of the 3D objects.
float SceneIntersect( Ray r, inout Intersection intersec )
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
{
	float d = INFINITY;
	float t = INFINITY;

	// AABB BVH Intersection variables
	vec4 vd0, vd1, vd2, vd3, vd4, vd5, vd6, vd7;
	vec3 inverseDir = 1.0 / r.direction;
	vec3 n = vec3(0);
	ivec2 uv0, uv1, uv2, uv3, uv4, uv5, uv6, uv7;

	float stackptr = 0.0;
	float id = 0.0;
	float tu, tv;
	float triangleID = 0.0;
	float triangleU = 0.0;
	float triangleV = 0.0;
	float triangleW = 0.0;

	bool skip = false;
	bool triangleLookupNeeded = false;

	BoxNode currentBoxNode, nodeA, nodeB, tnp;
	StackLevelData currentStackData, slDataA, slDataB, tmp;

	currentBoxNode = GetBoxNode(stackptr);
	currentStackData = StackLevelData(stackptr, BoundingBoxIntersect(currentBoxNode.minCorner, currentBoxNode.maxCorner, r.origin, inverseDir));
	stackLevels[0] = currentStackData;

	while(true)
	{
		if (currentStackData.rayT < t)
		{
			if (currentBoxNode.branch_A_Index >= 0.0) // signifies this is a branch
			{
				nodeA = GetBoxNode(currentBoxNode.branch_A_Index);
				nodeB = GetBoxNode(currentBoxNode.branch_B_Index);
				slDataA = StackLevelData(currentBoxNode.branch_A_Index, BoundingBoxIntersect(nodeA.minCorner, nodeA.maxCorner, r.origin, inverseDir));
				slDataB = StackLevelData(currentBoxNode.branch_B_Index, BoundingBoxIntersect(nodeB.minCorner, nodeB.maxCorner, r.origin, inverseDir));
				
				if (slDataB.rayT < slDataA.rayT)
				{
					// first sort the branch node data so that 'a' is the smallest

					tmp = slDataB;
					slDataB = slDataA;
					slDataA = tmp;

					tnp = nodeB;
					nodeB = nodeA;
					nodeA = tnp;

					// branch 'b' now has the larger rayT value of 'a' and 'b'
				} 

				if (slDataB.rayT < t) 
				{
					// see if branch 'b' (the larger rayT) needs to be processed

					currentStackData = slDataB;
					currentBoxNode = nodeB;

					// this will prevent the stackptr from decreasing by 1
					skip = true; 
				}

				if (slDataA.rayT < t) 
				{
					// see if branch 'a' (the smaller rayT) needs to be processed

					if (skip == true) 
					{
						// if larger branch 'b' needed to be processed also,

						stackLevels[int(stackptr++)] = slDataB; // cue larger branch 'b' for future round
												// also, increase pointer by 1
					}
						
					currentStackData = slDataA;
					currentBoxNode = nodeA;

					// this will prevent the stackptr from decreasing by 1
					skip = true; 
				}
			}
			else 
			{
				//if (currentBoxNode.branch_A_Index < 0.0) //  < 0.0 signifies a leaf node

				// each triangle's data is encoded in 8 rgba(or xyzw) texture slots
				id = 8.0 * (-currentBoxNode.branch_A_Index - 1.0);

				uv0 = ivec2( mod(id + 0.0, 2048.0), floor((id + 0.0) * INV_TEXTURE_WIDTH) );
				uv1 = ivec2( mod(id + 1.0, 2048.0), floor((id + 1.0) * INV_TEXTURE_WIDTH) );
				uv2 = ivec2( mod(id + 2.0, 2048.0), floor((id + 2.0) * INV_TEXTURE_WIDTH) );
				
				vd0 = texelFetch(tTriangleTexture, uv0, 0);
				vd1 = texelFetch(tTriangleTexture, uv1, 0);
				vd2 = texelFetch(tTriangleTexture, uv2, 0);

				d = BVH_TriangleIntersect( vec3(vd0.xyz), vec3(vd0.w, vd1.xy), vec3(vd1.zw, vd2.x), r, tu, tv );

				if (d < t && d > 0.0)
				{
					t = d;
					triangleID = id;
					triangleU = tu;
					triangleV = tv;
					triangleLookupNeeded = true;
				}
			}
		}

		if (skip == false)
		{
			// decrease pointer by 1 (0.0 is root level, 24.0 is maximum depth)

			if (--stackptr < 0.0) 
			{
				// went past the root level, terminate loop

				break;
			}
				
			currentStackData = stackLevels[int(stackptr)];
			currentBoxNode = GetBoxNode(currentStackData.id);
		}

		// reset skip
		skip = false; 
	} 

	if (triangleLookupNeeded == true)
	{
		uv0 = ivec2( mod(triangleID + 0.0, 2048.0), floor((triangleID + 0.0) * INV_TEXTURE_WIDTH) );
		uv1 = ivec2( mod(triangleID + 1.0, 2048.0), floor((triangleID + 1.0) * INV_TEXTURE_WIDTH) );
		uv2 = ivec2( mod(triangleID + 2.0, 2048.0), floor((triangleID + 2.0) * INV_TEXTURE_WIDTH) );
		uv3 = ivec2( mod(triangleID + 3.0, 2048.0), floor((triangleID + 3.0) * INV_TEXTURE_WIDTH) );
		uv4 = ivec2( mod(triangleID + 4.0, 2048.0), floor((triangleID + 4.0) * INV_TEXTURE_WIDTH) );
		uv5 = ivec2( mod(triangleID + 5.0, 2048.0), floor((triangleID + 5.0) * INV_TEXTURE_WIDTH) );
		uv6 = ivec2( mod(triangleID + 6.0, 2048.0), floor((triangleID + 6.0) * INV_TEXTURE_WIDTH) );
		uv7 = ivec2( mod(triangleID + 7.0, 2048.0), floor((triangleID + 7.0) * INV_TEXTURE_WIDTH) );
		
		vd0 = texelFetch(tTriangleTexture, uv0, 0);
		vd1 = texelFetch(tTriangleTexture, uv1, 0);
		vd2 = texelFetch(tTriangleTexture, uv2, 0);
		vd3 = texelFetch(tTriangleTexture, uv3, 0);
		vd4 = texelFetch(tTriangleTexture, uv4, 0);
		vd5 = texelFetch(tTriangleTexture, uv5, 0);
		vd6 = texelFetch(tTriangleTexture, uv6, 0);
		vd7 = texelFetch(tTriangleTexture, uv7, 0);

		// face normal for flat-shaded polygon look
		//intersec.normal = normalize( cross(vec3(vd0.w, vd1.xy) - vec3(vd0.xyz), vec3(vd1.zw, vd2.x) - vec3(vd0.xyz)) );

		// interpolated normal using triangle intersection's uv's
		triangleW = 1.0 - triangleU - triangleV;
		
		intersec.normal = normalize(triangleW * vec3(vd2.yzw) + triangleU * vec3(vd3.xyz) + triangleV * vec3(vd3.w, vd4.xy));

		// use this if intersec.type will be LIGHT
		intersec.emission = vec3(1, 0, 1); 
		
		intersec.opacity = vd7.y;
		intersec.uv = triangleW * vec2(vd4.zw) + triangleU * vec2(vd5.xy) + triangleV * vec2(vd5.zw);
		intersec.type = int(vd6.x);

		intersec.albedoTextureID = int(vd7.x);

		intersec.color = vd6.yzw;
	}

	return t;
}


//-----------------------------------------------------------------------
// Convert from gamma to linear color space
vec3 gammaToLinearColorSpace(vec3 color)
//-----------------------------------------------------------------------
{
	return pow(color, vec3(2.2));
}


//-----------------------------------------------------------------------
vec3 SpawnRay( Ray r, inout uvec2 seed )
//-----------------------------------------------------------------------
{
	vec3 randVec = vec3(rand(seed) * 2.0 - 1.0, rand(seed) * 2.0 - 1.0, rand(seed) * 2.0 - 1.0);

	Intersection intersec;

	vec3 outputColor = uAmbientLightColor / 255.0;
	outputColor *= uAmbientLightIntensity / 255.0;

	//uvec2 seed = uvec2(1.0, 1.0 + 1.0) * uvec2(gl_FragCoord);

	vec3 mask = vec3(1.0);
	vec3 n, nl, x;
	vec3 tdir;

	float hitDistance;
	float nc, nt, ratioIoR, Re, Tr;
	float weight;
	float t = INFINITY;
	float epsIntersect = 0.01;
	
	int previousIntersecType = NONE;
	int diffuseCount = 0;

	bool bounceIsSpecular = true;

	//for (int bounces = 0; bounces < MAX_BOUNCES; bounces++)
	for (int i=0; i<1; i++)
	{
		float t = SceneIntersect(r, intersec);
		
		if (t == INFINITY)
		{
			if (uBounces == 0)
			{
				// ray hits sky first

				outputColor += GetSkycubeColor(r);
				break;
			}
				
			if (previousIntersecType == DIFF)
			{
				// if ray bounced off of diffuse material and hits sky

				outputColor += mask * GetSkycubeColor(r);			

				break;
			}
			
			if (previousIntersecType == REFR)
			{
				// if ray bounced off of glass and hits sky

				// sky rays going through glass, hitting another surface
				mask *= GetSkycubeColor(r);

				if (bounceIsSpecular)
				{
					// prevents sun 'fireflies' on diffuse surfaces
					outputColor += mask;
				}
				
				break;
			}
		}		
        
		if (intersec.type == LIGHT)
		{
			// other lights, like houselights, could be added to the scene
			// if we reached light material, don't spawn any more rays

            outputColor += mask * intersec.emission;

			break;
		}

		// useful data
		vec3 n = intersec.normal;
        vec3 nl = dot(n, r.direction) <= 0.0 ? normalize(n) : normalize(n * -1.0);
		vec3 x = r.origin + r.direction * t;

		if (intersec.type == DIFF) 
		{
			// Ideal DIFFUSE reflection

			diffuseCount++;
			previousIntersecType = DIFF;
			
            bounceIsSpecular = false;

			mask *= gammaToLinearColorSpace(intersec.color);
				
			// Russian Roulette
			float p = max(mask.r, max(mask.g, mask.b));

			if (uBounces > 0)
			{
				if (rand(seed) < p)
				{
					mask *= 1.0 / p;
				}					
				else
				{
					break;
				}					
			}

			if (diffuseCount == 1 && rand(seed) < 0.5)
			{
				// this branch gathers color bleeding / caustics from other surfaces hit in the future
				// choose random Diffuse sample vector
				r = Ray( x, randomCosWeightedDirectionInHemisphere(nl, seed) );
				r.origin += r.direction * epsIntersect;

				continue;
			}
		}

		if (intersec.type == SPEC)  
		{
			// Ideal SPECULAR reflection

			previousIntersecType = SPEC;

			mask *= intersec.color;

			r = Ray( x, reflect(r.direction, nl) );
			r.origin += r.direction * epsIntersect;

			//bounceIsSpecular = true; // turn on mirror caustics
			continue;
		}

        if (intersec.type == REFR)  
		{
			// Ideal dielectric REFRACTION

			previousIntersecType = REFR;

			nc = 1.0; // IOR of Air
			nt = 1.5; // IOR of common Glass
			Re = calcFresnelReflectance(r.direction, n, nc, nt, ratioIoR);
			Tr = 1.0 - Re;

			if (Re > 0.99)
			{
				// reflect ray from surface
				r = Ray( x, reflect(r.direction, nl) ); 

				r.origin += nl * epsIntersect;
				continue;
			}

			if (rand(seed) < Re)
			{
				// reflect ray from surface
				r = Ray( x, reflect(r.direction, nl) );
				r.origin += r.direction * epsIntersect;
				continue;
			}
			else 
			{
				// transmit ray through surface

				mask *= 1.0 - (intersec.color * intersec.opacity);
				tdir = refract(r.direction, nl, ratioIoR);

				// TODO using r.direction instead of tdir, because going through common Glass makes everything spherical from up close...
				r = Ray(x, r.direction); 

				r.origin += r.direction * epsIntersect;
				
				if (diffuseCount < 2)
				{
					bounceIsSpecular = true;
				}
										
				continue;
			}
		}

		if (uBounces == MAX_BOUNCES - 1)
		{
			outputColor += mask;
		}
	} 

	return outputColor;
}



//-----------------------------------------------------------------------
vec4 getPixel(sampler2D image, int column, int row)
//-----------------------------------------------------------------------
{
	return texelFetch(image, ivec2(column, row), 0);
}

//-----------------------------------------------------------------------
vec4 getPixel(sampler2D image, vec2 pixelPos)
//-----------------------------------------------------------------------
{
	return texture(image, pixelPos);
}





//-----------------------------------------------------------------------
void main( void )
//-----------------------------------------------------------------------
{
  	vec3 camRight   = vec3( uCameraMatrix[0][0],  uCameraMatrix[0][1],  uCameraMatrix[0][2]);
    vec3 camUp      = vec3( uCameraMatrix[1][0],  uCameraMatrix[1][1],  uCameraMatrix[1][2]);
	vec3 camForward = vec3(-uCameraMatrix[2][0], -uCameraMatrix[2][1], -uCameraMatrix[2][2]);

	// seed for rand(seed) function
	seed = uvec2(uFrameCounter, uFrameCounter + 1.0) * uvec2(gl_FragCoord);

	ivec2 pixelPosInt = ivec2(gl_FragCoord.xy);
	vec2 pixelPosFloat = (gl_FragCoord.xy / vec2(CANVAS_WIDTH, CANVAS_HEIGHT));

	

/*	if (uStage == 1.0)
	{
		outColor0 = texelFetch(inColor0, ivec2(gl_FragCoord.xy), 0);// texture(inColor0, vec2(gl_FragCoord.xy));
	}
	else*/
	
	Ray ray;

	if (uBounces == 0)
	{
		vec2 uResolution = vec2(CANVAS_WIDTH, CANVAS_HEIGHT);
		vec2 pixelPos = (gl_FragCoord.xy / uResolution) * 2.0 - 1.0;

		// pick random point on aperture
		float randomAngle = rand(seed) * TWO_PI; 

		float randomRadius = rand(seed) * uApertureSize;
		vec3  randomAperturePos = ( cos(randomAngle) * camRight + sin(randomAngle) * camUp ) * randomRadius;


		vec3 rayDir = normalize(pixelPos.x * camRight * uULen + pixelPos.y* camUp * uVLen + camForward );
		
		// depth of field
		vec3 focalPoint = uFocusDistance * rayDir;
		
		// point on aperture to focal point
		vec3 finalRayDir = normalize(focalPoint - randomAperturePos);
		
		ray = Ray( cameraPosition + randomAperturePos, finalRayDir );

		// perform path tracing and get resulting pixel color
		//vec3 currPixelColor = SpawnRay( ray, seed );
		vec3 pixelColor = GetSkycubeColor(ray);

		outColor1 = vec4(0.0);
		outColor2 = vec4(0.0);
	}
	/*else
	{
		/*vec4 tmpRayOrigin = getPixel(inColor1, pixelPosInt.x, pixelPosInt.y);
		vec4 tmpRayDirection = getPixel(inColor2, pixelPosInt.x, pixelPosInt.y);

		ray = Ray(tmpRayOrigin.xyz, tmpRayDirection.xyz);

		outColor0 = getPixel(inColor0, pixelPosInt.x, pixelPosInt.y);
	}*/

	//outColor1 = vec4(ray, 0.0);

	



	/*vec3 previousColor = texelFetch(tPreviousTexture, ivec2(gl_FragCoord.xy), 0).rgb;
	
	if (uCameraJustStartedMoving)
	{
		previousColor = vec3(0.0); // clear rendering accumulation buffer
	}
	else if (uCameraIsMoving)
	{
		previousColor *= 0.5; // motion-blur trail amount (old image)
		pixelColor *= 0.5; // brightness of new image (noisy)
	}

	outColor0 = vec4( pixelColor + previousColor, 1.0 );*/
	

	//outColor0 = vec4( pixelColor, 1.0);
	

	//outColor0 = vec4(0.0);
	
}