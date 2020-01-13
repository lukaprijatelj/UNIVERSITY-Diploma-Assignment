importScripts('../constants.js');
importScripts('../../scripts/namespace-core/namespace-core.js');
importScripts('../threejs/three.js');

// only accesible in web worker thread
var worker = null;
var canvasWidth = -1;
var canvasHeight = -1;
var cell = null;

var options = null;
var mainThread = namespace.core.MainThread;

function init(thread, data)
{
	options = data.options;

	worker = new RaytracingWebWorker(data.threadIndex, options.MAX_RECURSION_DEPTH);
	worker.initCanvas(data.canvasWidth, data.canvasHeight, options.MULTISAMPLING_FACTOR);
}


/**
 * DOM-less version of Raytracing Renderer.
 * @author erichlof / https://github.com/erichlof
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author zz95 / http://github.com/zz85
 * @author lukaprijatelj / http://github.com/lukaprijatelj 
 */
var RaytracingWebWorker = function(threadIndex, maxRecursionDepth) 
{
	console.log('[RaytracingWebWorker] Initializing worker');

	/**
	 * Number of times ray bounces from objects. Each time bounce is detected new ray is cast.
	 */
	this.maxRecursionDepth = -1;

	this.canvasWidth = -1;
	this.canvasHeight = -1;
	this.canvasWidthHalf = -1;
	this.canvasHeightHalf = -1;

	/**
	 * Antialiasing must be odd number (1, 3, 5, 7, 9, etc.)
	 */
	this.multisamplingFactor = -1;

	/**
	 * Index of the thread that this web worker is on.
	 */
	this.threadIndex = -1;

	/**
	 * Cell that is currently rendering.
	 */
	this.cell = null;

	this.scene = null;

	this.camera = null;
	this.cameraPosition = null;
	this.cameraNormalMatrix = null;
	this.perspective;

	this.origin = null;
	this.direction = null;


	/**
	 * Ambient light is here in order to render shadowed area more beautifully.
	 */
	this.ambientLight = null;
	this.lights = null;

	this.raycaster = null;
	this.ray = null;
	this.raycasterLight = null;
	this.rayLight = null;
		
	this.objects = null;
	this.cache = null;	

	this.cachedX = -1;
	this.cachedY = -1;
	this.cachedImage = null;
	this.cachedIndex = -1;

	this.initScene = this.initScene.bind(this);
	this.initCamera = this.initCamera.bind(this);
	this.initLights = this.initLights.bind(this);
	this.setCell = this.setCell.bind(this);
	this.startRendering = this.startRendering.bind(this);


	this._init(threadIndex, maxRecursionDepth);
};

Object.assign(RaytracingWebWorker.prototype, THREE.EventDispatcher.prototype);


/**
 * Sets cell that needs to be rendered.
 */
RaytracingWebWorker.prototype.setCell = function(thread, cell)
{
	let _this = this;
	_this.cell = cell;
};

/**
 * Initializes object.
 * @private
 */
RaytracingWebWorker.prototype._init = function(threadIndex, maxRecursionDepth)
{
	let _this = this;

	if (typeof threadIndex != 'undefined')
	{
		_this.threadIndex = threadIndex;
	}
	
	if (typeof maxRecursionDepth != 'undefined')
	{
		_this.maxRecursionDepth = maxRecursionDepth;
	}

	_this.cameraPosition = new THREE.Vector3();
	_this.cameraNormalMatrix = new THREE.Matrix3();

	_this.origin = new THREE.Vector3();
	_this.direction = new THREE.Vector3();

	_this.lights = new Array();

	_this.raycaster = new THREE.Raycaster(_this.origin, _this.direction);
	_this.ray = _this.raycaster.ray;
	_this.raycasterLight = new THREE.Raycaster(undefined, undefined);
	_this.rayLight = _this.raycasterLight.ray;
	
	_this.cache = new Object();	
};

/**
 * Initializes canvas.
 */
RaytracingWebWorker.prototype.initCanvas = function(width, height, multisamplingFactor)
{
	let _this = this;

	_this.multisamplingFactor = multisamplingFactor;

	_this.canvasWidth = width;
	_this.canvasHeight = height;

	_this.canvasWidthHalf = Math.floor(_this.canvasWidth / 2);
	_this.canvasHeightHalf = Math.floor(_this.canvasHeight / 2);

	// TODO fix passing maxRecursionDepth as parameter.
	// if (data.maxRecursionDepth) maxRecursionDepth = data.maxRecursionDepth;
};

/**
 * Initializes scene.
 */
RaytracingWebWorker.prototype.initScene = function(thread, sceneData)
{
	let _this = this;

	let images = new Object();

	let loader = new THREE.ObjectLoader();
	_this.scene = loader.parse(sceneData, images);

	// update scene graph

	if (_this.scene.autoUpdate === true)
	{
		_this.scene.updateMatrixWorld();
	} 

	_this.objects = _this.scene.children;

	// set up object matrices

	_this.scene.traverse(function(object) 
	{
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
 * Initializes camera.
 */
RaytracingWebWorker.prototype.initCamera = function(thread, cameraData)
{
	let _this = this;

	let images = new Object();

	let loader = new THREE.ObjectLoader();
	_this.camera = loader.parse(cameraData, images);

	// update camera matrices

	if (_this.camera.parent === null)
	{
		_this.camera.updateMatrixWorld();
	}

	_this.cameraPosition.setFromMatrixPosition(_this.camera.matrixWorld);
	_this.cameraNormalMatrix.getNormalMatrix(_this.camera.matrixWorld);

	_this.perspective = 0.5 / Math.tan(THREE.Math.degToRad(_this.camera.fov * 0.5)) * _this.canvasHeight;
};

/**
 * Initializes lights.
 */
RaytracingWebWorker.prototype.initLights = function()
{
	let _this = this;

	// collect lights and set up object matrices

	_this.lights = new Array();

	_this.scene.traverse(function(object) 
	{
		if (object instanceof THREE.PointLight || object instanceof THREE.SpotLight || object instanceof THREE.DirectionalLight)
		{
			_this.lights.push(object);
		}

		if (object instanceof THREE.AmbientLight)
		{
			_this.ambientLight = object;
		}
	});
};

/**
 * Sets canvas size.
 */
RaytracingWebWorker.prototype.getTexturePixel = function(texture, uvX, uvY) 
{
	let posX = Math.floor(texture.imageData.width * uvX);
	let posY = Math.floor(texture.imageData.height * uvY);

	let pixel = texture.imageData.getPixel(posX, posY);

	let MAX_VALUE = 255;
	let red = pixel.red;
	let green = pixel.green;
	let blue = pixel.blue;

	// THREE.Color does not support alpha channel
	let alpha = pixel.alpha;

	return new THREE.Color(red / MAX_VALUE, green / MAX_VALUE, blue / MAX_VALUE);
};





/**
 * Spawns ray for calculating colour.
 */
RaytracingWebWorker.prototype.spawnRay = function(rayOrigin, rayDirection, outputColor, recursionDepth, reference) 
{
	let _this = this;

	/*
	let staticProp = 
	{
		accumCol: new THREE.Vector3(0),
		mask: new THREE.Vector3(1.0),
		firstMask: new THREE.Vector3(1),
		checkCol0: new THREE.Vector3(1),
		checkCol1: new THREE.Vector3(0.5),
		dirToLight: null,
		tdir: null,
		metallicRoughness = new THREE.Vector3(0),
		x: null, 
		n: null, 
		nl: null,
	
		t: INFINITY,
		nc: 0, 
		nt: 0, 
		ratioIoR: 0, 
		Re: 0,
		Tr: 0,
		weight: 0,
		diffuseColorBleeding: 0.3, // range: 0.0 - 0.5, amount of color bleeding between surfaces
	
		diffuseCount: 0,
		previousIntersecType: -100,

		bounceIsSpecular: true,
		sampleLight: false,
		firstTypeWasREFR: false,
		reflectionTime: false,
		firstTypeWasDIFF: false,
		shadowTime: false,
		firstTypeWasCOAT: false,
		specularTime: false,
		sampleSunLight: false,
		intersectionType: ''
	};
	*/

	var intersectionType = '';

	_this.ray.origin = rayOrigin;
	_this.ray.direction = rayDirection;

	// weird function. somettimes needs a lot of time even though there is not even that much objects in the scene
	let intersections = _this.raycaster.intersectObjects(_this.objects, true);

	outputColor.setRGB(0, 0, 0);

	if (intersections.length === 0) 
	{
		// -----------------------------
		// ray didn't hit any object
		// -----------------------------

		let background = _this.scene.background;

		if (!background || !background.rawImage || !background.rawImage.length)
		{
			return;
		}

		let pixelColor = _this.texCUBE(background.rawImage, rayDirection);
		pixelColor.copyGammaToLinear(pixelColor);
		outputColor.add(pixelColor);

		return;
	}


	// -----------------------------
	// Ray hit one of the objects
	// -----------------------------

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

	let albedo = null;

	if (intersection.uv)
	{
		let vectorUV;

		if (material.map)
		{
			// diffuseColor or albedo color
			vectorUV = intersection.uv.clone();
			material.map.transformUv(vectorUV);
			albedo = _this.getTexturePixel(material.map.image, vectorUV.x, vectorUV.y);
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

	if (_this.ambientLight)
	{
		lightContribution.copy(diffuseColor);
		lightContribution.multiply(_this.ambientLight.color);
		lightContribution.multiplyScalar(_this.ambientLight.intensity);
		outputColor.add(lightContribution);
	}


	let alphaMap = null;
	let aoMap = null;
	let emissiveMap = null;
	let envMap = null;
	let lightMap = null;
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

	if (roughnessMap && metalnessMap)
	{
		intersectionType = 'PBR';
	}




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

		/*if (material.specular || material.shininess) 
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

		if (roughnessMap) 
		{
			let specular = roughnessMap;

			halfVector.addVectors( lightVector, eyeVector ).normalize();
			specularColor.copyGammaToLinear(specular);

			let alpha = Math.pow(Math.max( 1.0 - lightVector.dot( halfVector ), 0.0 ), 5.0);

			schlick.r = specularColor.r + ( 1.0 - specularColor.r ) * alpha;
			schlick.g = specularColor.g + ( 1.0 - specularColor.g ) * alpha;
			schlick.b = specularColor.b + ( 1.0 - specularColor.b ) * alpha;

			lightContribution.copy( schlick );
			lightContribution.multiply( lightColor );

			outputColor.add( lightContribution );
		}*/
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

	let x = rayOrigin.multiply(rayDirection);

	if (intersectionType == 'PBR')
	{
		let preCross;

		if (Math.abs(normalVector.y) < 0.9)
		{
			preCross = new THREE.Vector3(0, 1, 0);
		}
		else
		{
			preCross = new THREE.Vector3(0, 0, 1);
		}

		let crossPro = preCross.cross(normalVector);
		let S = crossPro.normalize();
		let T = normalVector.cross(S);
		let N = normalVector.normalize();
		
		// invert S, T when the UV direction is backwards (from mirrored faces),
		// otherwise it will do the normal mapping backwards.
		//vec3 NfromST = cross( S, T );
		//if( dot( NfromST, N ) < 0.0 )
		//{
		//	S *= -1.0;
		//	T *= -1.0;
		//} 

		let tsn = new THREE.Matrix3();   //new THREE.Matrix3( S, T, N );
		tsn.set(S.x, T.x, N.x,
				S.y, T.y, N.y,
				S.z, T.z, N.z);

		if (normalMap)
		{
			normalVector = (new THREE.Vector3(normalMap.r, normalMap.g, normalMap.b)).applyMatrix3(tsn).normalize();
		}
		

		//intersections.color = texture(tAlbedoMap, intersections.uv).rgb;
		//intersections.color = pow(intersections.color,vec3(2.2));
		
		// luka: why is this needed?
		//intersections.emission = pow(intersections.emission,vec3(2.2));
		
		let mask = new THREE.Vector3(1.0, 1.0, 1.0);

		if (emissiveMap)
		{
			let maxEmission = Math.max(emissiveMap.r, Math.max(emissiveMap.g, emissiveMap.b));

			if (maxEmission > 0.01) //if (rand(seed) < maxEmission)
			{
				//outputColor.copy(mask);
				outputColor.multiply(emissiveMap);
				return;
			}
		}
		
		let zColor = tmpColor[ recursionDepth ];

		let randoo = Math.random();

		

		var randomDirectionInHemisphere = function( normalVector, randoo)
		{
			let up = randoo; // uniform distribution in hemisphere
			let over = Math.sqrt(Math.max(0.0, 1.0 - up * up));

			let TWO_PI = 6.28318530717958648;
			let around = randoo * TWO_PI;
			
			let crossVec = Math.abs(normalVector.x) > 0.1 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
			let crossProd = crossVec.cross(normalVector);
			let u = crossProd.normalize();
			let v = normalVector.cross(u);
		
			return (u.multiplyScalar(Math.cos(around) * over).add(v.multiplyScalar(Math.sin(around) * over)).add(normalVector.multiplyScalar(up))).normalize();
		};
		let randomCosWeightedDirectionInHemisphere = function(normalVector, randoo)
		{
			let N_POINTS = 32.0;

			let i = Math.floor(N_POINTS * randoo) + (randoo * 0.5);
			
			// the Golden angle in radians	
			let theta = i * 2.39996322972865332 + 1;
			theta = theta % TWO_PI;

			let r = Math.sqrt(i / N_POINTS); // sqrt pushes points outward to prevent clumping in center of disk
			let x = r * Math.cos(theta);
			let y = r * Math.sin(theta);
			let p = new THREE.Vector3(x, y, Math.sqrt(1.0 - x * x - y * y)); // project XY disk points outward along Z axis
			
			let crossVec = Math.abs(normalVector.x) > 0.1 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
			let crossPro = crossVec.cross(normalVector);
			let u = crossPro.normalize();
			let v = normalVector.cross(u);
		
			return (u * p.x + v * p.y + normalVector * p.z);
		};

		if (metalnessMap && metalnessMap.b > 0.0)
		{
			// Ideal SPECULAR reflection

			mask *= zColor;
	
			let reflectVec = rayDirection.reflect(normalVector);
			let glossyVec = randomDirectionInHemisphere(normalVector, randoo);

			let newReference = {};
			_this.spawnRay( normalVector, rayDirection.normalize(), zColor, recursionDepth + 1, newReference);

			/*r = Ray( x,  lerp(reflectVec, glossyVec, metalnessMap.g));

			rayDirection = rayDirection.normalize();
			r.origin += normalVector;*/

			return;
		}

		var calcFresnelReflectance = function(rayDirection, n, etai, etat)
		{
			let temp;
			let cosi = Math.clamp(rayDirection.dot(n), -1.0, 1.0);

			if (cosi > 0.0)
			{
				temp = etai;
				etai = etat;
				etat = temp;
			}
			
			let ratioIoR = etai / etat;
			let sint = ratioIoR * Math.sqrt(Math.max(0.0, 1.0 - (cosi * cosi)));

			if (sint >= 1.0) 
				return 1.0; // total internal reflection

			let cost = Math.sqrt(Math.max(0.0, 1.0 - (sint * sint)));
			cosi = Math.abs(cosi);

			let Rs = ((etat * cosi) - (etai * cost)) / ((etat * cosi) + (etai * cost));
			let Rp = ((etai * cosi) - (etat * cost)) / ((etai * cosi) + (etat * cost));

			return ((Rs * Rs) + (Rp * Rp)) * 0.5;
		};

		// Diffuse object underneath with ClearCoat on top
		nc = 1.0; // IOR of Air
		nt = 1.4; // IOR of Clear Coat
		Re = calcFresnelReflectance(rayDirection, N, nc, nt);
		Tr = 1.0 - Re;

		if (Re > 0.99)
		{
			// reflect ray from surface
			//r = Ray( x, rayDirection.reflect(normalVector) ); 

			let newReference = {};
			_this.spawnRay( normalVector, rayDirection.reflect(normalVector), zColor, recursionDepth + 1, newReference);

			//r.origin += normalVector;
			return;
		}

		if (recursionDepth < 2 && !reference.firstTypeWasCOAT)
		{	
			// save intersection data for future reflection trace
			reference.firstTypeWasCOAT = true;
			firstMask = mask * Re;

			// create reflection ray from surface
			//firstRay = Ray(x, rayDirection.reflect(normalVector)); 

			let newReference = {};
			_this.spawnRay( x, rayDirection.reflect(normalVector), zColor, recursionDepth + 1, newReference);

			//firstRay.origin += normalVector;

			mask *= Tr;
		}
		else if (randoo < Re)
		{
			let newReference = {};
			_this.spawnRay( x, rayDirection.reflect(normalVector), zColor, recursionDepth + 1, newReference);

			//r = Ray( x, rayDirection.reflect(normalVector) ); // reflect ray from surface
			//r.origin += normalVector;
			return;
		}

		reference.diffuseCount++;

		mask *= zColor;
	
		if (reference.diffuseCount == 1 && reference.firstTypeWasCOAT && randoo < diffuseColorBleeding)
		{
			// choose random Diffuse sample vector
			//r = Ray( x, normalize(randomCosWeightedDirectionInHemisphere(normalVector, randoo)) );

			let newReference = {};
			_this.spawnRay( normalVector, normalize(randomCosWeightedDirectionInHemisphere(normalVector, randoo)), zColor, recursionDepth + 1, newReference);


			//r.origin += normalVector;
			return;
		}
					
		/*dirToLight = sampleSphereLight(x, normalVector, light, dirToLight, weight, seed);
		mask *= weight;
		
		r = Ray( x, normalize(dirToLight) );
		r.origin += normalVector;*/
	}












































	

	
/*
	if (material.glass) 
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

		let theta = Math.max( eyeVector.dot( normalVector ), 0.0 );
		let rf0 = reflectivity;
		let fresnel = rf0 + ( 1.0 - rf0 ) * Math.pow( ( 1.0 - theta ), 5.0 );
		let weight = fresnel;

		let zColor = tmpColor[ recursionDepth ];

		_this.spawnRay( point, reflectionVector, zColor, recursionDepth + 1 );
		
		if ( material.specular !== undefined ) 
		{
			zColor.multiply( material.specular );
		}

		zColor.multiplyScalar( weight );
		outputColor.multiplyScalar( 1 - weight );
		outputColor.add( zColor );

		return;
	}


	var reflectivity;

	if (metalnessMap)
	{
		reflectivity = metalnessMap.b;
	}

	if (material.reflectivity)
	{
		reflectivity = material.reflectivity;
	}

	if (!reflectivity)
	{
		// not reflection means we don't need to spawn ray
		return;
	}
	else
	{
		material.mirror = true;
	}

	if (material.mirror) 
	{
		reflectionVector.copy( rayDirection );
		reflectionVector.reflect( normalVector );

		let theta = Math.max( eyeVector.dot( normalVector ), 0.0 );
		let rf0 = reflectivity;
		let fresnel = rf0 + ( 1.0 - rf0 ) * Math.pow( ( 1.0 - theta ), 5.0 );
		let weight = fresnel;

		let zColor = tmpColor[ recursionDepth ];

		_this.spawnRay( point, reflectionVector, zColor, recursionDepth + 1 );
		
		if ( material.specular !== undefined ) 
		{
			zColor.multiply( material.specular );
		}

		zColor.multiplyScalar( weight );
		outputColor.multiplyScalar( 1 - weight );
		outputColor.add( zColor );

		return;
	}*/
};


function mix(x,y,a)
{
	return x.multiplyScalar(1 - a).add(y.multiplyScalar(a));
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


/**
 * Gets pixel color of the skybox environment.
 */
RaytracingWebWorker.prototype.texCUBE = function(images, rayDirection)
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
RaytracingWebWorker.prototype.computePixelNormal = function(outputVector, point, flatShading, face, geometry) 
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
 * Renders block with specified antialiasing factor.
 */
RaytracingWebWorker.prototype.renderCell = async function() 
{
	let _this = this;

	let cell = _this.cell;

	let width = cell.width;
	let height = cell.height;
	cell.rawImage = new namespace.core.RawImage('', width, height);

	let startRenderingTime = Date.nowInMicroseconds();
	let stateStartTime = 0;

	let multisamplingFactorSquare = _this.multisamplingFactor * _this.multisamplingFactor;

	for (let posY=0; posY < height; posY++)
	{
		let rayPosY = -(posY + cell.startY - _this.canvasHeightHalf);
		let canvasY = cell.startY + posY;

		for (let posX=0; posX < width; posX++) 
		{	
			let elapsedTime = Date.nowInMiliseconds() - stateStartTime;

			if (elapsedTime > options.CHECK_RENDERING_SERVICE_STATE)
			{
				// time check is needed because we don't want to slow down rendering too much with synchronization
				await mainThread.invokeRequest('globals.renderer.checkRenderingState', cell);
				stateStartTime = Date.nowInMiliseconds();
			}
						
			let rayPosX = posX + cell.startX - _this.canvasWidthHalf;
			let canvasX = cell.startX + posX;
						
			let renderedColor = new Color(0, 0, 0, 255);

			for (let j=0; j<_this.multisamplingFactor; j++)
			{
				let antiRayPosY = rayPosY + (j / _this.multisamplingFactor - 0.5);

				for (let i=0; i<_this.multisamplingFactor; i++)
				{
					let antiRayPosX = rayPosX - (i / _this.multisamplingFactor - 0.5);
					
					// spawn ray at pixel position
					let pixelColor = new THREE.Color();
					_this.origin.copy(_this.cameraPosition);
					_this.direction.set(antiRayPosX, antiRayPosY, -_this.perspective);
					_this.direction.applyMatrix3(_this.cameraNormalMatrix).normalize();

					let staticProp = 
					{
						accumCol: new THREE.Vector3(0,0,0),
						mask: new THREE.Vector3(1.0,1,1),
						firstMask: new THREE.Vector3(1,1,1),
						checkCol0: new THREE.Vector3(1,1,1),
						checkCol1: new THREE.Vector3(0.5,0.5,0.5),
						dirToLight: null,
						tdir: null,
						metallicRoughness: new THREE.Vector3(0,0,0),
						x: null, 
						n: null, 
						nl: null,
					
						t: INFINITY,
						nc: 0, 
						nt: 0, 
						ratioIoR: 0, 
						Re: 0,
						Tr: 0,
						weight: 0,
						diffuseColorBleeding: 0.3, // range: 0.0 - 0.5, amount of color bleeding between surfaces
					
						diffuseCount: 0,
						previousIntersecType: -100,

						bounceIsSpecular: true,
						sampleLight: false,
						firstTypeWasREFR: false,
						reflectionTime: false,
						firstTypeWasDIFF: false,
						shadowTime: false,
						firstTypeWasCOAT: false,
						specularTime: false,
						sampleSunLight: false,
						intersectionType: ''
					};
					_this.spawnRay(_this.origin, _this.direction, pixelColor, 0, {}, staticProp);

					// convert from linear to gamma
					renderedColor.red += Math.sqrt(pixelColor.r) * 255; 
					renderedColor.green += Math.sqrt(pixelColor.g) * 255;
					renderedColor.blue += Math.sqrt(pixelColor.b) * 255;
				}
			}

			renderedColor.red /= multisamplingFactorSquare;
			renderedColor.green /= multisamplingFactorSquare;
			renderedColor.blue /= multisamplingFactorSquare;

			cell.rawImage.imageData.setPixel(posX, posY, renderedColor);

			let progress = Math.round(Math.toPercentage((posY + 1) * (posX + 1), height * width));
			progress = Math.min(progress, 100);
			cell.progress = progress; 
		}
	}

	let endRenderingTime = Date.nowInMicroseconds();
	_this.cell.timeRendering = endRenderingTime - startRenderingTime;

	await mainThread.invokeRequest('globals.renderer.checkRenderingState', cell);
	
	_this._onCellRendered();
};

/**
 * Clears data connected with current cell.
 */
RaytracingWebWorker.prototype._onCellRendered = function()
{
	console.log('[RaytracingWebWorker] Finished rendering cell');

	let _this = this;

	/*if (_this.antialiasingFactor > 1)
	{
		_this.cell.rawImage.scale(namespace.enums.Direction.DOWN, _this.antialiasingFactor);
	}*/

	mainThread.invoke('globals.renderer.onCellRendered', _this.cell);

	_this.cell = null;
	_this.cachedIndex = -1;
};

/**
 * Starts rendering.
 */
RaytracingWebWorker.prototype.startRendering = function() 
{
	let _this = this;	

	console.log('[RaytracingWebWorker] Started rendering cell');

	_this.renderCell();
};
