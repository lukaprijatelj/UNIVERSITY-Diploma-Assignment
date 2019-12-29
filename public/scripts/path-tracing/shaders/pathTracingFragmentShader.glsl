#version 300 es

precision highp float;
precision highp int;
precision highp sampler2D;

// include defines
#include <pathtracing_uniforms_and_defines>


// actual model triangles with info about position and texture
uniform sampler2D tTriangleTexture;

// AABB tree for checking if ray hit model
uniform sampler2D tAABBTexture;

// textures
uniform sampler2D tSkyCubeTextures[NUM_OF_SKYCUBE_TEXTURES]; 
uniform sampler2D tAlbedoTextures[MAX_TEXTURES_IN_ARRAY]; 


uniform float uSkyLightIntensity;
uniform float uSunLightIntensity;
uniform vec3 uSunColor;
uniform vec3 uSunDirection;


// (1 / 2048 texture width)
#define INV_TEXTURE_WIDTH 1.0 / 2048.0

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


#include <pathtracing_random_functions>
#include <pathtracing_calc_fresnel_reflectance>
#include <pathtracing_sphere_intersect>
#include <pathtracing_plane_intersect>
#include <pathtracing_triangle_intersect>
#include <pathtracing_boundingbox_intersect>
#include <pathtracing_bvhTriangle_intersect>

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
// Because array indexing cannot be done via for loop it will be done via function and static indexing.
// sampler2d also cannot be return type of the function. Any of the opaque types cannot be.
vec3 GetTexturePixelsFromArray(int index, sampler2D array[MAX_TEXTURES_IN_ARRAY], vec2 uv)
//-----------------------------------------------------------------------
{
	switch(index)
	{
		case 0:
			return texture(array[0], uv).rgb;
			break;

		case 1:
			return texture(array[1], uv).rgb;
			break;

		case 2:
			return texture(array[2], uv).rgb;
			break;

		case 3:
			return texture(array[3], uv).rgb;
			break;

		case 4:
			return texture(array[4], uv).rgb;
			break;

		case 5:
			return texture(array[5], uv).rgb;
			break;
/*
		case 6:
			return texture(array[6], uv).rgb;
			break;

		case 7:
			return texture(array[7], uv).rgb;
			break;

		case 8:
			return texture(array[8], uv).rgb;
			break;

		case 9:
			return texture(array[9], uv).rgb;
			break;*/
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

	vec2 uv = vec2(posU, posV);
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

	return pixelColor;
}


//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
float SceneIntersect( Ray r, inout Intersection intersec )
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
{
	float d = INFINITY;
	float t = INFINITY;

	// AABB BVH Intersection variables
	vec4 aabbNodeData0, aabbNodeData1, aabbNodeData2;
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
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////
	// glTF
	///////////////////////////////////////////////////////////////////////////////////////////////////////

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

		intersec.color = vd6.yzw;
		intersec.opacity = vd7.y;
		intersec.uv = triangleW * vec2(vd4.zw) + triangleU * vec2(vd5.xy) + triangleV * vec2(vd5.zw);
		intersec.type = int(vd6.x);

		intersec.albedoTextureID = int(vd7.x);

		if (intersec.albedoTextureID >= 0)
		{
			intersec.color = GetTexturePixelsFromArray(intersec.albedoTextureID, tAlbedoTextures, intersec.uv);	
		}
	}

	return t;
}


//-----------------------------------------------------------------------
vec3 CalculateRadiance( Ray r, vec3 sunDirection, inout uvec2 seed )
//-----------------------------------------------------------------------
{
	vec3 randVec = vec3(rand(seed) * 2.0 - 1.0, rand(seed) * 2.0 - 1.0, rand(seed) * 2.0 - 1.0);

	Intersection intersec;
	vec3 accumCol = vec3(0.0);
	vec3 mask = vec3(1.0);
	vec3 n, nl, x;
	vec3 firstX = vec3(0);
	vec3 tdir;

	float hitDistance;
	float nc, nt, ratioIoR, Re, Tr;
	float weight;
	float t = INFINITY;
	float epsIntersect = 0.01;
	
	int previousIntersecType = -100;
	int diffuseCount = 0;

	bool bounceIsSpecular = true;
	bool sampleSunLight = false;

	for (int bounces = 0; bounces < MAX_BOUNCES; bounces++)
	{
		float t = SceneIntersect(r, intersec);
		
		if (t == INFINITY && bounces == 0)
		{
			// ray hits sky first

			accumCol = GetSkycubeColor(r);
			break;	
		}

		if (t == INFINITY && previousIntersecType == DIFF)
		{
			// if ray bounced off of diffuse material and hits sky

			if (sampleSunLight)
			{
				accumCol = mask * uSunColor * uSunLightIntensity;
			}
			else
			{
				accumCol = mask * GetSkycubeColor(r) * uSkyLightIntensity;
			}				

			break;
		}
        
		if (t == INFINITY && previousIntersecType == REFR)
		{
			// if ray bounced off of glass and hits sky

            if (diffuseCount == 0)
			{
				// camera looking through glass, hitting the sky
				mask *= GetSkycubeColor(r);
			}
			else if (sampleSunLight)
			{
				// sun rays going through glass, hitting another surface
				mask *= uSunColor * uSunLightIntensity;
			}				
			else 
			{
				// sky rays going through glass, hitting another surface
				mask *= GetSkycubeColor(r) * uSkyLightIntensity;
			} 
               
			if (bounceIsSpecular)
			{
				// prevents sun 'fireflies' on diffuse surfaces
				accumCol = mask;
			}
               
			break;
		}
        
		if (intersec.type == LIGHT)
		{
			// other lights, like houselights, could be added to the scene
			// if we reached light material, don't spawn any more rays

            accumCol = mask * intersec.emission;

			break;
		}

		// useful data
		vec3 n = intersec.normal;
        vec3 nl = dot(n,r.direction) <= 0.0 ? normalize(n) : normalize(n * -1.0);
		vec3 x = r.origin + r.direction * t;

		if (intersec.type == DIFF) 
		{
			// Ideal DIFFUSE reflection

			diffuseCount++;
			previousIntersecType = DIFF;
			
            bounceIsSpecular = false;

			// convert from gamma to linear color space
			vec3 intersecColor = pow(intersec.color, vec3(2.2));

			mask *= intersecColor;
				
			// Russian Roulette
			float p = max(mask.r, max(mask.g, mask.b));

			if (bounces > 0)
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
			else
			{
				// this branch acts like a traditional shadowRay, checking for direct light from the Sun..
				// if it has a clear path and hits the Sun on the next bounce, sunlight is gathered, otherwise returns black (shadow)
				r = Ray( x, normalize(sunDirection + (randVec * 0.01)) );
				r.origin += nl * epsIntersect;
				weight = dot(r.direction, nl);

				if (weight < 0.01)
				{
					break;
				}

				mask *= weight;
				sampleSunLight = true;
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

	} 

	return accumCol;
}


//-----------------------------------------------------------------------
void main( void )
//-----------------------------------------------------------------------
{
  	vec3 camRight   = vec3( uCameraMatrix[0][0],  uCameraMatrix[0][1],  uCameraMatrix[0][2]);
    vec3 camUp      = vec3( uCameraMatrix[1][0],  uCameraMatrix[1][1],  uCameraMatrix[1][2]);
	vec3 camForward = vec3(-uCameraMatrix[2][0], -uCameraMatrix[2][1], -uCameraMatrix[2][2]);

	// seed for rand(seed) function
	uvec2 seed = uvec2(uFrameCounter, uFrameCounter + 1.0) * uvec2(gl_FragCoord);

	vec2 pixelPos = (gl_FragCoord.xy / uResolution) * 2.0 - 1.0;
	vec2 pixelOffset = vec2(0);
	vec3 pixelColor = vec3(0);

	float multisamplingFactor = float(MULTISAMPLING_FACTOR);

	// pick random point on aperture
	float randomAngle = rand(seed) * TWO_PI; 

	float randomRadius = rand(seed) * uApertureSize;
	vec3  randomAperturePos = ( cos(randomAngle) * camRight + sin(randomAngle) * camUp ) * randomRadius;

	for (int j=0; j<MULTISAMPLING_FACTOR; j++)
	{
		pixelOffset.y = float(j) / multisamplingFactor;
		pixelOffset.y /= (uResolution.y * 0.5);

		for (int i=0; i<MULTISAMPLING_FACTOR; i++)
		{
			pixelOffset.x = float(i) / multisamplingFactor;
			pixelOffset.x /= (uResolution.x * 0.5);

			vec3 rayDir = normalize( (pixelPos.x + pixelOffset.x) * camRight * uULen + (pixelPos.y + pixelOffset.y) * camUp * uVLen + camForward );
			
			// depth of field
			vec3 focalPoint = uFocusDistance * rayDir;
			
			// point on aperture to focal point
			vec3 finalRayDir = normalize(focalPoint - randomAperturePos);
			
			Ray ray = Ray( cameraPosition + randomAperturePos, finalRayDir );

			// perform path tracing and get resulting pixel color
			vec3 currPixelColor = CalculateRadiance( ray, uSunDirection, seed );

			pixelColor += currPixelColor; 
		}
	}

	pixelColor /= pow(multisamplingFactor, 2.0);

	vec3 previousColor = texelFetch(tPreviousTexture, ivec2(gl_FragCoord.xy), 0).rgb;
	
	if (uCameraJustStartedMoving)
	{
		previousColor = vec3(0.0); // clear rendering accumulation buffer
	}
	else if (uCameraIsMoving)
	{
		previousColor *= 0.5; // motion-blur trail amount (old image)
		pixelColor *= 0.5; // brightness of new image (noisy)
	}
	
	out_FragColor = vec4( pixelColor + previousColor, 1.0 );	
}