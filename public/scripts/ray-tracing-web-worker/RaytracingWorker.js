/**
 * DOM-less version of Raytracing Renderer
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author zz95 / http://github.com/zz85
 */
var RaytracingRendererWorker = function(onCellRendered, index) 
{
	console.log('[RaytracingRendererWorker] Initializing worker');

	// basically how many tmes it spawns ray (how many times ray hits object)
	this.maxRecursionDepth = 2;

	this.canvasWidth;
	this.canvasHeight;
	this.canvasWidthHalf;
	this.canvasHeightHalf;

	this.workerIndex = index;

	this.renderingStartedDate;	

	/**
	 * Cell that is currently rendering.
	 */
	this.cell = null;

	this.camera;
	this.cameraPosition = new THREE.Vector3();
	this.cameraNormalMatrix = new THREE.Matrix3();
	this.origin = new THREE.Vector3();
	this.direction = new THREE.Vector3();

	this.raycaster = new THREE.Raycaster(this.origin, this.direction);
	this.ray = this.raycaster.ray;
	this.raycasterLight = new THREE.Raycaster(undefined, undefined);
	this.rayLight = this.raycasterLight.ray;

	this.perspective;
	
	this.scene;
	this.objects;
	this.lights = new Array();
	this.cache = new Object();

	this.loader = new THREE.ObjectLoader();
	this.onCellRendered = onCellRendered;		
};

Object.assign(RaytracingRendererWorker.prototype, THREE.EventDispatcher.prototype);


/**
 * Sets cell that needs to be rendered.
 */
RaytracingRendererWorker.prototype.setCell = function(cell)
{
	let _this = this;
	_this.cell = cell;
};


/**
 * Initializes object.
 */
RaytracingRendererWorker.prototype.init = function(width, height)
{
	let _this = this;
	_this.setSize(width, height);

	// TODO fix passing maxRecursionDepth as parameter.
	// if (data.maxRecursionDepth) maxRecursionDepth = data.maxRecursionDepth;
};


/**
 * Initializes scene.
 */
RaytracingRendererWorker.prototype.initScene = function(sceneData, cameraData)
{
	let _this = this;

	let images = new Object();
	_this.scene = _this.loader.parse(sceneData, images);
	_this.camera = _this.loader.parse(cameraData, images);

	// update scene graph

	if (_this.scene.autoUpdate === true)
	{
		_this.scene.updateMatrixWorld();
	} 

	// update camera matrices

	if (_this.camera.parent === null)
	{
		_this.camera.updateMatrixWorld();
	}

	_this.cameraPosition.setFromMatrixPosition(_this.camera.matrixWorld);
	_this.cameraNormalMatrix.getNormalMatrix(_this.camera.matrixWorld);

	_this.perspective = 0.5 / Math.tan(THREE.Math.degToRad(_this.camera.fov * 0.5)) * _this.canvasHeight;
	_this.objects = _this.scene.children;

	// collect lights and set up object matrices

	_this.lights = new Array();

	_this.scene.traverse(function(object) 
	{
		if (object instanceof THREE.PointLight || object instanceof THREE.SpotLight || object instanceof THREE.DirectionalLight)
		{
			_this.lights.push(object);
		}

		if (_this.cache[object.id] === undefined) 
		{
			_this.cache[object.id] = {
				normalMatrix: new THREE.Matrix3(),
				inverseMatrix: new THREE.Matrix4()
			};
		}

		var _object = _this.cache[object.id];

		_object.normalMatrix.getNormalMatrix(object.matrixWorld);
		_object.inverseMatrix.getInverse(object.matrixWorld);
	});
};



/**
 * Sets canvas size.
 */
RaytracingRendererWorker.prototype.setSize = function (width, height) 
{
	let _this = this;

	_this.canvasWidth = width;
	_this.canvasHeight = height;

	_this.canvasWidthHalf = Math.floor(_this.canvasWidth / 2);
	_this.canvasHeightHalf = Math.floor(_this.canvasHeight / 2);
};


/**
 * Sets canvas size.
 */
RaytracingRendererWorker.prototype.getTexturePixel = function (texture, uvX, uvY) 
{
	let posX = Math.floor(texture.width * uvX);
	let posY = Math.floor(texture.height * uvY);

	// r, g, b, a bits
	let NUM_OF_COLOR_BITS = 4;
	let above = posY * (texture.width * NUM_OF_COLOR_BITS);
	let start = above + (posX * NUM_OF_COLOR_BITS);
	
	let red = texture.pixels[start++];
	let green = texture.pixels[start++];
	let blue = texture.pixels[start++];

	return new THREE.Color(red/255, green/255, blue/255);
};


/**
 * Spawns ray for calculating colour.
 */
RaytracingRendererWorker.prototype.spawnRay = function(rayOrigin, rayDirection, outputColor, recursionDepth) 
{
	let _this = this;

	_this.ray.origin = rayOrigin;
	_this.ray.direction = rayDirection;

	// weird function. somettimes needs a lot of time even though there is not even that much objects in the scene
	let intersections = _this.raycaster.intersectObjects(_this.objects, true);

	if (intersections.length === 0) 
	{
		// -----------------------------
		// ray didn't hit any object
		// -----------------------------

		let background = _this.scene.background;

		if (!background || !background.rawImage || !background.rawImage.length)
		{
			outputColor.setRGB( 0, 0, 0 );
			return;
		}

		let pixelColor = _this.texCUBE(background.rawImage, rayDirection);
		outputColor.set(pixelColor);

		return;
	}

	// -----------------------------
	// Ray hit one of the objects
	// -----------------------------

	outputColor.setRGB(0, 0, 0);

	let diffuseColor = new THREE.Color();
	let specularColor = new THREE.Color();
	let lightColor = new THREE.Color();
	let schlick = new THREE.Color();

	let lightContribution = new THREE.Color();

	let eyeVector = new THREE.Vector3();
	let lightVector = new THREE.Vector3();
	let normalVector = new THREE.Vector3();
	let halfVector = new THREE.Vector3();

	let localPoint = new THREE.Vector3();
	let reflectionVector = new THREE.Vector3();

	let tmpVec = new THREE.Vector3();

	let intersection = intersections[0];
	let point = intersection.point;
	let object = intersection.object;
	let material = object.material;
	let face = intersection.face;
	let geometry = object.geometry;
	let _object = _this.cache[object.id];

	eyeVector.subVectors(_this.ray.origin, point).normalize();

	/**
	 * ------------------------------------------
	 * PHONG MODEL:
	 * - diffuse color (base color)
	 * - specular color
	 * - reflectivenes 
	 * 
	 * 
	 * 
	 * ------------------------------------------
	 * PBR MODEL:
	 * - albedo color (base color)
	 * - metallic factor
	 * - roughness factor
	 * 
	 * FO - Fresnel Reflectance at 0 degrees
	 * BRDF - Bidirectional Reflectance Distribution Function
	 * 
	 */

	let alphaMap = null;
	let aoMap = null;
	let emissiveMap = null;
	let envMap = null;
	let lightMap = null;
	let albedo = null;
	let metalnessMap = null;
	let normalMap = null;
	let roughnessMap = null; 

	if (intersection.uv)
	{
		let vectorUV;

		if (material.alphaMap)
		{
			vectorUV = intersection.uv.clone();
			material.alphaMap.transformUv(vectorUV);
			alphaMap = _this.getTexturePixel(material.alphaMap.image, vectorUV.x, vectorUV.y);
		}

		if (material.aoMap)
		{
			// ambient occulsion map
			vectorUV = intersection.uv.clone();
			material.aoMap.transformUv(vectorUV);
			aoMap = _this.getTexturePixel(material.aoMap.image, vectorUV.x, vectorUV.y);
		}

		if (material.emissiveMap)
		{
			vectorUV = intersection.uv.clone();
			material.emissiveMap.transformUv(vectorUV);
			emissiveMap = _this.getTexturePixel(material.emissiveMap.image, vectorUV.x, vectorUV.y);
		}

		if (material.envMap)
		{
			vectorUV = intersection.uv.clone();
			material.envMap.transformUv(vectorUV);
			envMap = _this.getTexturePixel(material.envMap.image, vectorUV.x, vectorUV.y);
		}

		if (material.lightMap)
		{
			vectorUV = intersection.uv.clone();
			material.lightMap.transformUv(vectorUV);
			lightMap = _this.getTexturePixel(material.lightMap.image, vectorUV.x, vectorUV.y);
		}

		if (material.map)
		{
			// diffuseColor or albedo color
			vectorUV = intersection.uv.clone();
			material.map.transformUv(vectorUV);
			albedo = _this.getTexturePixel(material.map.image, vectorUV.x, vectorUV.y);
		}

		if (material.metalnessMap)
		{
			vectorUV = intersection.uv.clone();
			material.metalnessMap.transformUv(vectorUV);
			metalnessMap = _this.getTexturePixel(material.metalnessMap.image, vectorUV.x, vectorUV.y);
		}

		if (material.normalMap)
		{
			vectorUV = intersection.uv.clone();
			material.normalMap.transformUv(vectorUV);
			normalMap = _this.getTexturePixel(material.normalMap.image, vectorUV.x, vectorUV.y);
		}

		if (material.roughnessMap)
		{
			vectorUV = intersection.uv.clone();
			material.roughnessMap.transformUv(vectorUV);
			roughnessMap = _this.getTexturePixel(material.roughnessMap.image, vectorUV.x, vectorUV.y);
		}
	}


	// -----------------------------
	// diffuse color (also called albedo color)
	// -----------------------------

	let diffuse;

	if (albedo)
	{	
		diffuse = albedo;
	}
	else
	{
		diffuse = material.color;
	} 

	diffuseColor.copyGammaToLinear(diffuse);

	if ( material.vertexColors === THREE.FaceColors) 
	{
		diffuseColor.multiply(face.color);
	}


	// -----------------------------
	// compute light shading
	// -----------------------------

	_this.rayLight.origin.copy(point);	

	let normalComputed = false;

	for (let i=0; i<_this.lights.length; i++) 
	{
		let light = _this.lights[i];

		lightVector.setFromMatrixPosition(light.matrixWorld);
		lightVector.sub(point);

		_this.rayLight.direction.copy(lightVector).normalize();

		let lightIntersections = _this.raycasterLight.intersectObjects(_this.objects, true);
		
		if (lightIntersections.length > 0) 
		{
			// point in shadow

			continue;
		}

		// point lit

		if (normalComputed === false) 
		{
			// the same normal can be reused for all lights
			// (should be possible to cache even more)

			localPoint.copy( point ).applyMatrix4( _object.inverseMatrix );
			_this.computePixelNormal( normalVector, localPoint, material.flatShading, face, geometry );
			normalVector.applyMatrix3( _object.normalMatrix ).normalize();

			normalComputed = true;
		}

		lightColor.copyGammaToLinear(light.color);

		// compute attenuation

		lightVector.normalize();

		// compute diffuse

		var dot = Math.max( normalVector.dot( lightVector ), 0 );
		var diffuseIntensity = dot * light.intensity;

		lightContribution.copy( diffuseColor );
		lightContribution.multiply( lightColor );
		lightContribution.multiplyScalar(diffuseIntensity);
		outputColor.add( lightContribution );

		// compute specular

		if (material.specular || material.shininess) 
		{
			let specular;
			let shininess;

			if (material.specular)
			{
				specular = material.specular;
			}

			if (material.shininess)
			{
				shininess = material.shininess;
			}

			halfVector.addVectors( lightVector, eyeVector ).normalize();

			let dotNormalHalf = Math.max(normalVector.dot(halfVector), 0.0);
			let specularIntensity = Math.max(Math.pow(dotNormalHalf, shininess), 0.0) * diffuseIntensity;

			let specularNormalization = (shininess + 2.0) / 8.0;

			specularColor.copyGammaToLinear(specular);

			let alpha = Math.pow(Math.max( 1.0 - lightVector.dot( halfVector ), 0.0 ), 5.0);

			schlick.r = specularColor.r + ( 1.0 - specularColor.r ) * alpha;
			schlick.g = specularColor.g + ( 1.0 - specularColor.g ) * alpha;
			schlick.b = specularColor.b + ( 1.0 - specularColor.b ) * alpha;

			lightContribution.copy( schlick );
			lightContribution.multiply( lightColor );
			lightContribution.multiplyScalar( specularNormalization * specularIntensity);

			outputColor.add( lightContribution );
		}
	}


	// -----------------------------
	// reflection / refraction
	// -----------------------------

	if (recursionDepth >= _this.maxRecursionDepth)
	{
		// no need to spawn new ray cast, because we have reached max recursion depth
		return;
	}


	let tmpColor = new Array();

	for ( let i = 0; i < _this.maxRecursionDepth; i ++ ) 
	{
		tmpColor[i] = new THREE.Color();
	}	

	/*let reflectivity = 0;

	if (metalnessMap)
	{
		reflectivity = metalnessMap.b;
	}

	if (reflectivity > 0) 
	{
		if ( material.mirror ) 
		{
			reflectionVector.copy( rayDirection );
			reflectionVector.reflect( normalVector );
		}
		else if ( material.glass ) 
		{
			let eta = material.refractionRatio;

			let dotNI = rayDirection.dot( normalVector );
			let k = 1.0 - eta * eta * ( 1.0 - dotNI * dotNI );

			if ( k < 0.0 ) 
			{
				reflectionVector.set( 0, 0, 0 );
			}
			else 
			{
				reflectionVector.copy( rayDirection );
				reflectionVector.multiplyScalar( eta );

				let alpha = eta * dotNI + Math.sqrt( k );
				tmpVec.copy( normalVector );
				tmpVec.multiplyScalar( alpha );
				reflectionVector.sub( tmpVec );
			}
		}

		reflectionVector.copy( rayDirection );
		reflectionVector.reflect( normalVector );

		// 0 (theta) - Theta is the angle between the viewing direction and the half vector;
		let cosinusTheta = Math.max( eyeVector.dot( normalVector ), 0.0 );

		// F0 - Fresnel Reflectance at 0 degrees
		let F0 = reflectivity;

		// fresnel
		let fresnel = _this.Fresnel_Schlick(cosinusTheta, F0);
		//let fresnel = _this.PixelShaderFunction(diffuse, metalnessMap, rayDirection, normalVector);
		let weight = fresnel;

		let zColor = tmpColor[ recursionDepth ];

		// recursive call
		_this.spawnRay( point, reflectionVector, zColor, recursionDepth + 1 );

		if (material.specular !== undefined) 
		{
			zColor.multiply( material.specular );
		}

		zColor.multiplyScalar( weight );
		outputColor.multiplyScalar( 1 - weight );
		outputColor.add( zColor );
	}
*/

	var reflectivity = material.reflectivity;

	if (( material.mirror || material.glass ) && reflectivity > 0) 
	{
		if ( material.mirror ) 
		{
			reflectionVector.copy( rayDirection );
			reflectionVector.reflect( normalVector );
		}
		else if ( material.glass ) 
		{
			var eta = material.refractionRatio;

			var dotNI = rayDirection.dot( normalVector );
			var k = 1.0 - eta * eta * ( 1.0 - dotNI * dotNI );

			if ( k < 0.0 ) 
			{
				reflectionVector.set( 0, 0, 0 );
			}
			else 
			{
				reflectionVector.copy( rayDirection );
				reflectionVector.multiplyScalar( eta );

				var alpha = eta * dotNI + Math.sqrt( k );
				tmpVec.copy( normalVector );
				tmpVec.multiplyScalar( alpha );
				reflectionVector.sub( tmpVec );
			}
		}

		var theta = Math.max( eyeVector.dot( normalVector ), 0.0 );
		var rf0 = reflectivity;
		var fresnel = rf0 + ( 1.0 - rf0 ) * Math.pow( ( 1.0 - theta ), 5.0 );
		var weight = fresnel;
		

		if ( material.specular !== undefined ) 
		{
			zColor.multiply( material.specular );
		}

		zColor.multiplyScalar( weight );
		outputColor.multiplyScalar( 1 - weight );
		outputColor.add( zColor );
	}

	var zColor = tmpColor[ recursionDepth ];

	_this.spawnRay( point, reflectionVector, zColor, recursionDepth + 1 );

	if (material.specular !== undefined) 
	{
		zColor.multiply( material.specular );
	}
	outputColor.add( zColor );


	/*reflectionVector.copy( rayDirection );
	reflectionVector.reflect( normalVector );

	let DistributionGGX = function(N, H, a)
	{
		let a2 = a*a;
		let NdotH  = Math.max(N.dot(H), 0.0);
		let NdotH2 = NdotH*NdotH;
		
		let nom = a2;
		let denom  = (NdotH2 * (a2 - 1.0) + 1.0);
		denom = Math.PI * denom * denom;
		
		return nom / denom;
	};

	let GeometrySchlickGGX = function(NdotV, k)
	{
		let nom   = NdotV;
		let denom = NdotV * (1.0 - k) + k;
		
		return nom / denom;
	};
	
	let GeometrySmith = function(N, V, L, k)
	{
		let NdotV = Math.max(N.dot(V), 0.0);
		let NdotL = Math.max(N.dot(L), 0.0);
		let ggx1 = GeometrySchlickGGX(NdotV, k);
		let ggx2 = GeometrySchlickGGX(NdotL, k);
		
		return ggx1 * ggx2;
	};

	let F0 = new THREE.Vector3(0.04, 0.04, 0.04);
	F0 = lerp(F0, surfaceColor.rgb, metalnessMap.b);
	let cosinusTheta = Math.max( eyeVector.dot( normalVector ), 0.0 );

	let fresnelSchlick = function(cosTheta, F0)
	{
		return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
	};

	halfVector.addVectors( lightVector, eyeVector ).normalize();

	let D = DistributionGGX(normalVector, halfVector);
	let F = fresnelSchlick(cosinusTheta, F0);
	let G = GeometrySmith(normalVector, eyeVector, lightVector, roughnessMap.g);

	let zColor = tmpColor[ recursionDepth ];

	// recursive call
	_this.spawnRay( point, reflectionVector, zColor, recursionDepth + 1 );


	zColor.multiplyScalar( weight );
	outputColor.multiplyScalar( 1 - weight );
	outputColor.add( zColor );*/
};








function saturate(value)
{
	if (value < 0)
	{
		return 0;
	}

	if (value > 1)
	{
		return 1;
	}

	return value;
};

function lerp(a,b,w)
{
	return a.add((b.sub(a)).multiplyScalar(w));
};

























RaytracingRendererWorker.prototype.chiGGX = function(viewVector)
{
    return viewVector > 0 ? 1 : 0;
};

RaytracingRendererWorker.prototype.GGX_PartialGeometryTerm = function(viewVector, normal, halfVector, alpha)
{
    let VoH2 = saturate(viewVector.dot(halfVector));
	let chi = this.chiGGX( VoH2 / saturate( viewVector.dot(normal)) );
	
	VoH2 = VoH2 * VoH2;
	
	let tan2 = ( 1 - VoH2 ) / VoH2;
	
    return (chi * 2) / ( 1 + Math.sqrt( 1 + alpha * alpha * tan2 ) );
};

RaytracingRendererWorker.prototype.GGX_Specular = function(SpecularEnvmap, normal, viewVector, roughness, F0, kS)
{
   // let reflectionVector = viewVector.negate().reflect(normal);
	let worldFrame = new THREE.Matrix3(); // GenerateFrame(reflectionVector);
    let radiance = 0;
	//let NoV = saturate(dot(normal, viewVector));
	
	// dunno
	let SamplesCount = 64;

    for(let i = 0; i < SamplesCount; ++i)
    {
        // Generate a sample vector in some local space
        let sampleVector = new THREE.Vector3();
        // Convert the vector in world space
        //sampleVector = sampleVector.multiply(worldFrame).normalize();

        // Calculate the half vector
        let halfVector = sampleVector.add(viewVector).normalize();
		//let cosT = saturate(dot(sampleVector, normal));
      //  let sinT = Math.sqrt( 1 - cosT * cosT);

        // Calculate fresnel
		let fresnel = this.Fresnel_Schlick( saturate(halfVector.dot(viewVector )), F0 );
		
        // Geometry term
		//let geometry = this.GGX_PartialGeometryTerm(viewVector, normal, halfVector, roughness) * this.GGX_PartialGeometryTerm(sampleVector, normal, halfVector, roughness);
		
        // Calculate the Cook-Torrance denominator
       // let denominator = saturate( 4 * (NoV * saturate(dot(halfVector, normal)) + 0.05) );
		kS.value += fresnel;
		
        // Accumulate the radiance
        radiance += 0.0;// SpecularEnvmap.SampleLevel( trilinearSampler, sampleVector, ( roughness * mipsCount ) ).rgb * geometry * fresnel * sinT / denominator;
    }

    // Scale back for the samples count
	kS.value = saturate( kS.value / SamplesCount );
	
    return radiance / SamplesCount;        
};


RaytracingRendererWorker.prototype.PixelShaderFunction = function(diffuseColor, metalnessColor, viewVector, normal)
{
	if (!diffuseColor || !metalnessColor)
	{
		return new Vector4();
	}

	let EPSILON = 8;
    let ior = 1 + metalnessColor.r;
    let roughness = saturate(metalnessColor.g - EPSILON) + EPSILON;
    let metallic = metalnessColor.b;

    // Calculate colour at normal incidence
    let F0 = Math.abs((1.0 - ior) / (1.0 + ior));
    F0 = F0 * F0;
    F0 = lerp(F0, diffuseColor.r, metallic);
        
    // Calculate the specular contribution
    let ks = { value: 0 };
    let specular = this.GGX_Specular(undefined, normal, viewVector, roughness, F0, ks );
	let kd = (1 - ks.value) * (1 - metallic);
	
    // Calculate the diffuse contribution
   // let irradiance = this.texCUBE(diffuseCubemap_Sampler, normal);
   // let diffuse = materialColour * irradiance;
   let diffuse = 1;

    return kd * diffuse + specular;     
};


/**
 * Gets F0 (Fresnel Reflectance at 0 degrees).
 */
RaytracingRendererWorker.prototype.Fresnel_Schlick = function(cosT, F0)
{
	return F0 + (1.0 - F0) * Math.pow((1.0 - cosT), 5.0);
};


/**
 * Gets pixel color of the skybox environment.
 */
RaytracingRendererWorker.prototype.texCUBE = function(images, rayDirection)
{
	let _this = this;

	let skyMap;
	let posU;
	let posV;

	if(Math.abs(rayDirection.x) > Math.abs(rayDirection.y))
	{
		if(Math.abs(rayDirection.x) > Math.abs(rayDirection.z))
		{
			// x is dominant axis.

			// X direction is probably flipped, so positiveX image is actually negativeX image

			if(rayDirection.x < 0)
			{
				// -X is dominant axis -> left face
				skyMap = images[0];

				posU = rayDirection.z / rayDirection.x;
				posV = -rayDirection.y / (-rayDirection.x);
			}
			else
			{
				// +X is dominant axis -> right face
				skyMap = images[1];

				posU = rayDirection.z / rayDirection.x;
				posV = -rayDirection.y / rayDirection.x;
			}				
		}
		else
		{
			// z is dominant axis.
			if(rayDirection.z<0)
			{
				// -Z is dominant axis -> front face
				skyMap = images[5];

				posU = rayDirection.x / (-rayDirection.z);
				posV = -rayDirection.y / (-rayDirection.z);
			}
			else
			{
				// +Z is dominant axis -> back face
				skyMap = images[4];

				posU = -rayDirection.x / rayDirection.z;
				posV = -rayDirection.y / rayDirection.z;
			}
		}
	}
	else if(Math.abs(rayDirection.y) > Math.abs(rayDirection.z))
	{
		// y is dominant axis.
		if(rayDirection.y < 0)
		{
			// -Y is dominant axis -> bottom face
			skyMap = images[3];

			posU = rayDirection.x / rayDirection.y;
			posV = -rayDirection.z / (-rayDirection.y);
		}
		else
		{
			// +Y is dominant axis -> top face
			skyMap = images[2];

			posU = -rayDirection.x / rayDirection.y;
			posV = rayDirection.z / rayDirection.y;
		}
	}
	else
	{
		// z is dominant axis.
		if(rayDirection.z < 0)
		{
			// -Z is dominant axis -> front face
			skyMap = images[5];

			posU = rayDirection.x / (-rayDirection.z);
			posV = -rayDirection.y / (-rayDirection.z);
		}
		else
		{
			// +Z is dominant axis -> back face
			skyMap = images[4];

			// compute the orthogonal normalized texture coordinates. Start with a normalized [-1..1] space
			posU = -rayDirection.x / rayDirection.z;
			posV = -rayDirection.y / rayDirection.z;
		}
	}

	// need to transform this to [0..1] space
	posU = (posU + 1) / 2;
	posV = (posV + 1) / 2;

	return _this.getTexturePixel(skyMap, posU, posV);
};

/**
 * Computes normal.
 */
RaytracingRendererWorker.prototype.computePixelNormal = function(outputVector, point, flatShading, face, geometry) 
{
	var vA = new THREE.Vector3();
	var vB = new THREE.Vector3();
	var vC = new THREE.Vector3();

	var tmpVec1 = new THREE.Vector3();
	var tmpVec2 = new THREE.Vector3();
	var tmpVec3 = new THREE.Vector3();
	var faceNormal = face.normal;

	if (flatShading === true) 
	{
		outputVector.copy( faceNormal );
		return;
	}

	var positions = geometry.attributes.position;
	var normals = geometry.attributes.normal;

	vA.fromBufferAttribute( positions, face.a );
	vB.fromBufferAttribute( positions, face.b );
	vC.fromBufferAttribute( positions, face.c );

	// compute barycentric coordinates

	tmpVec3.crossVectors( tmpVec1.subVectors( vB, vA ), tmpVec2.subVectors( vC, vA ) );
	var areaABC = faceNormal.dot( tmpVec3 );

	tmpVec3.crossVectors( tmpVec1.subVectors( vB, point ), tmpVec2.subVectors( vC, point ) );
	var areaPBC = faceNormal.dot( tmpVec3 );
	var a = areaPBC / areaABC;

	tmpVec3.crossVectors( tmpVec1.subVectors( vC, point ), tmpVec2.subVectors( vA, point ) );
	var areaPCA = faceNormal.dot( tmpVec3 );
	var b = areaPCA / areaABC;

	var c = 1.0 - a - b;

	// compute interpolated vertex normal

	tmpVec1.fromBufferAttribute(normals, face.a);
	tmpVec2.fromBufferAttribute(normals, face.b);
	tmpVec3.fromBufferAttribute(normals, face.c);

	tmpVec1.multiplyScalar(a);
	tmpVec2.multiplyScalar(b);
	tmpVec3.multiplyScalar(c);

	outputVector.addVectors(tmpVec1, tmpVec2);
	outputVector.add(tmpVec3);
};


/**
 * Renders block.
 */
RaytracingRendererWorker.prototype.renderBlock = function() 
{
	console.log('[RaytracingRendererWorker] Rendering specified canvas block');

	let _this = this;
	
	let pixelColor = new THREE.Color();
	let index = 0;

	let cell = _this.cell;
	let data = new Uint8ClampedArray(cell.width * cell.height * 4);

	for (let y = 0; y < cell.height; y ++)
	{
		for (let x = 0; x < cell.width; x++) 
		{
			// spawn primary ray at pixel position

			_this.origin.copy(_this.cameraPosition);

			_this.direction.set( x + cell.startX - _this.canvasWidthHalf, - ( y + cell.startY - _this.canvasHeightHalf ), - _this.perspective );
			_this.direction.applyMatrix3(_this.cameraNormalMatrix ).normalize();

			_this.spawnRay(_this.origin, _this.direction, pixelColor, 0);

			// convert from linear to gamma

			data[ index + 0 ] = Math.sqrt( pixelColor.r ) * 255;
			data[ index + 1 ] = Math.sqrt( pixelColor.g ) * 255;
			data[ index + 2 ] = Math.sqrt( pixelColor.b ) * 255;
			data[ index + 3 ] = 255;

			index += 4;
		}
	}

	_this.onCellRendered(_this.workerIndex, data.buffer, _this.cell, new Date() - _this.renderingStartedDate);
};


/**
 * Starts rendering.
 */
RaytracingRendererWorker.prototype.render = function() 
{
	let _this = this;

	_this.renderingStartedDate = new Date();

	_this.renderBlock();
};
