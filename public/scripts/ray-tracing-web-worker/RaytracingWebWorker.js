importScripts('../constants.js');
importScripts('../../scripts/namespace-core/namespace-core.js');
importScripts('../threejs/three.js');

// only accesible in web worker thread
var worker = null;

var options = null;
var mainThread = namespace.core.MainThread;


/**
 * Initializes WebWorker thread.
 * @public
 * @param {namespace.core.Thread} thread - instance of this web worker thread
 * @param {Object} data - data that was sent from main thread
 */
function init(thread, data)
{
	options = data.options;

	worker = new RaytracingWebWorker(data.threadIndex, options.MAX_RECURSION_DEPTH);
	worker.initCanvas(data.canvasWidth, data.canvasHeight, options.MULTISAMPLING_FACTOR);
}


/**
 * DOM-less version of Raytracing Renderer.
 * @constructor
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
	 * @type {number}
	 */
	this.maxRecursionDepth = -1;

	/**
	 * Width of canvas element.
	 * @type {number}
	 */
	this.canvasWidth = -1;

	/**
	 * Height of canvas element.
	 * @type {number}
	 */
	this.canvasHeight = -1;

	/**
	 * Half width of canvas element.
	 * @type {number}
	 */
	this.canvasWidthHalf = -1;

	/**
	 * Half height of canvas element.
	 * @type {number}
	 */
	this.canvasHeightHalf = -1;

	/**
	 * Antialiasing must be odd number (1, 3, 5, 7, 9, etc.)
	 * @type {number}
	 */
	this.multisamplingFactor = -1;

	/**
	 * Index of the thread that this web worker is on.
	 * @type {number}
	 */
	this.threadIndex = -1;

	/**
	 * Cell that is currently rendering.
	 * @type {namespace.database.BasicCell}
	 */
	this.cell = null;

	/**
	 * 3D scene.
	 * @type {THREE.Scene}
	 */
	this.scene = null;

	/**
	 * Camera in the scene.
	 * @type {THREE.Camera}
	 */
	this.camera = null;

	/**
	 * Position of the camera.
	 * @type {THREE.Vector3}
	 */
	this.cameraPosition = null;

	/**
	 * Matrix of camera normal.
	 * @type {THREE.Matrix3}
	 */
	this.cameraNormalMatrix = null;

	/**
	 * Camera's perspective.
	 * @type {number}
	 */
	this.perspective;

	/**
	 * Camera origin.
	 * @type {THREE.Vector3}
	 */
	this.origin = null;

	/**
	 * Camera direction.
	 * @type {THREE.Vector3}
	 */
	this.direction = null;

	/**
	 * Ambient light is here in order to render shadowed area more beautifully.
	 * @type {THREE.AmbientLight}
	 */
	this.ambientLight = null;

	/**
	 * Array of light in scene.
	 * @type {Array<THREE.Light>}
	 */
	this.lights = null;

	/**
	 * Ray caster object.
	 * @type {THREE.Raycaster}
	 */
	this.raycaster = null;

	/**
	 * Ray object.
	 * @type {THREE.Ray}
	 */
	this.ray = null;

	/**
	 * Ray caster object for light.
	 * @type {THREE.Raycaster}
	 */
	this.raycasterLight = null;

	/**
	 * Ray object for light.
	 * @type {THREE.Ray}
	 */
	this.rayLight = null;
		
	/***
	 * List of objects in scene.
	 * @type {Array<THREE.Object3D>}
	 */
	this.objects = null;

	/**
	 * Hashed object properties.
	 * @type {Array<Object>}
	 */
	this.cache = null;	


	/** Rebinded event handlers */
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
 * @public
 * @param {namespace.core.Thread} thread - instance of this web worker thread
 * @param {Object} cell - data that was sent from main thread
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
 * @public
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
 * @public
 * @param {namespace.core.Thread} thread - instance of this web worker thread
 * @param {Object} sceneData - data that was sent from main thread
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
 * @public
 * @param {namespace.core.Thread} thread - instance of this web worker thread
 * @param {Object} cameraData - data that was sent from main thread
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
 * @public
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
 * @public
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
 * @public
 */
RaytracingWebWorker.prototype.spawnRay = function(rayOrigin, rayDirection, outputColor, recursionDepth) 
{
	let _this = this;

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
	}


	// -----------------------------
	// reflection / refraction
	// -----------------------------

	if (recursionDepth >= _this.maxRecursionDepth)
	{
		// no need to spawn new ray cast, because we have reached max recursion depth
		return;
	}

	var reflectivity;

	if (material.reflectivity)
	{
		reflectivity = material.reflectivity;
	}
	else
	{
		reflectivity = 0;
	}

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

		let zColor = new THREE.Color();

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


	if (reflectivity <= 0)
	{
		// not reflection means we don't need to spawn ray
		return;
	}

	reflectionVector.copy( rayDirection );
	reflectionVector.reflect( normalVector );

	let theta = Math.max( eyeVector.dot( normalVector ), 0.0 );
	let rf0 = reflectivity;
	let fresnel = rf0 + ( 1.0 - rf0 ) * Math.pow( ( 1.0 - theta ), 5.0 );
	let weight = fresnel;

	let zColor = new THREE.Color();

	_this.spawnRay( point, reflectionVector, zColor, recursionDepth + 1 );
	
	if ( material.specular !== undefined ) 
	{
		zColor.multiply( material.specular );
	}

	zColor.multiplyScalar( weight );
	outputColor.multiplyScalar( 1 - weight );
	outputColor.add( zColor );
};

/**
 * Gets pixel color of the skybox environment.
 * @public
 * @param {Array<namespace.core.RawImage>} images - list of images 
 * @param {THREE.Vector3} rayDirection - direction of the ray
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
 * @public
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
 * @public
 */
RaytracingWebWorker.prototype.renderCell = async function() 
{
	let _this = this;

	let cell = _this.cell;

	let width = cell.width;
	let height = cell.height;
	cell.rawImage = new namespace.core.RawImage('', width, height);

	let startRenderingTime = Date.nowInMiliseconds();
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

					_this.spawnRay(_this.origin, _this.direction, pixelColor, 0);

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

	let endRenderingTime = Date.nowInMiliseconds();
	_this.cell.timeRendering = endRenderingTime - startRenderingTime;

	await mainThread.invokeRequest('globals.renderer.checkRenderingState', cell);
	
	_this._onCellRendered();
};

/**
 * Clears data connected with current cell.
 * @private
 */
RaytracingWebWorker.prototype._onCellRendered = function()
{
	console.log('[RaytracingWebWorker] Finished rendering cell');

	let _this = this;

	mainThread.invoke('globals.renderer.onCellRendered', _this.cell);

	_this.cell = null;
};

/**
 * Starts rendering.
 * @public
 */
RaytracingWebWorker.prototype.startRendering = function() 
{
	let _this = this;	

	console.log('[RaytracingWebWorker] Started rendering cell');

	_this.renderCell();
};
