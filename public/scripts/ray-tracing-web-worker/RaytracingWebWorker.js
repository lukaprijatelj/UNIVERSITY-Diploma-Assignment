importScripts('../constants.js');
importScripts('../../externals/namespace-core/namespace-core.js');
importScripts('../../externals/namespace-enums/namespace-enums.js');
importScripts('../threejs/three.js');

// only accesible in web worker thread
var worker = null;
var canvasWidth = -1;
var canvasHeight = -1;
var cell = null;

var options = null;
var mainThread = new namespace.core.MainThread();

function init(data)
{
	options = data.options;

	worker = new RaytracingWebWorker();
	worker.workerIndex = data.workerIndex;
	worker.init(data.canvasWidth, data.canvasHeight, options.ANTIALIASING_FACTOR);
}

function initScene(data)
{
	worker.initScene(data.sceneJSON, data.cameraJSON);
}

function setCell(data)
{
	cell = data.cell;
	worker.setCell(cell);
}

function startRendering(data)
{
	worker.render();
}


/**
 * DOM-less version of Raytracing Renderer
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author zz95 / http://github.com/zz85
 */
var RaytracingWebWorker = function() 
{
	console.log('[RaytracingWebWorker] Initializing worker');

	/**
	 * Number of times ray bounces from objects. Each time bounce is detected new ray is cast.
	 */
	this.maxRecursionDepth = 2;

	this.canvasWidth;
	this.canvasHeight;
	this.canvasWidthHalf;
	this.canvasHeightHalf;

	/**
	 * Antialiasing must be odd number (1, 3, 5, 7, 9, etc.)
	 */
	this.antialiasingFactor = 1;
	this.workerIndex = -1;

	/**
	 * Cell that is currently rendering.
	 */
	this.cell = null;

	this.scene;

	this.camera;
	this.cameraPosition = new THREE.Vector3();
	this.cameraNormalMatrix = new THREE.Matrix3();
	this.perspective;
	this.origin = new THREE.Vector3();
	this.direction = new THREE.Vector3();

	/**
	 * Ambient light is here in order to render shadowed area more beautifully.
	 */
	this.ambientLight = null;
	this.lights = new Array();

	this.raycaster = new THREE.Raycaster(this.origin, this.direction);
	this.ray = this.raycaster.ray;
	this.raycasterLight = new THREE.Raycaster(undefined, undefined);
	this.rayLight = this.raycasterLight.ray;
		
	this.objects;
	this.cache = new Object();	
};

Object.assign(RaytracingWebWorker.prototype, THREE.EventDispatcher.prototype);


/**
 * Sets cell that needs to be rendered.
 */
RaytracingWebWorker.prototype.setCell = function(cell)
{
	let _this = this;
	_this.cell = cell;
};

/**
 * Initializes object.
 */
RaytracingWebWorker.prototype.init = function(width, height, antialiasingFactor)
{
	let _this = this;

	_this.antialiasingFactor = antialiasingFactor;

	_this.canvasWidth = width * _this.antialiasingFactor;
	_this.canvasHeight = height * _this.antialiasingFactor;

	_this.canvasWidthHalf = Math.floor(_this.canvasWidth / 2);
	_this.canvasHeightHalf = Math.floor(_this.canvasHeight / 2);

	// TODO fix passing maxRecursionDepth as parameter.
	// if (data.maxRecursionDepth) maxRecursionDepth = data.maxRecursionDepth;
};

/**
 * Initializes scene.
 */
RaytracingWebWorker.prototype.initScene = function(sceneData, cameraData)
{
	let _this = this;

	let images = new Object();

	let loader = new THREE.ObjectLoader();
	_this.scene = loader.parse(sceneData, images);
	_this.camera = loader.parse(cameraData, images);


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

		if (object instanceof THREE.AmbientLight)
		{
			_this.ambientLight = object;
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
 * Cell is done rendering.
 * @private
 */
RaytracingWebWorker.prototype._onCellRendered = function(workerIndex, buffer, cell, timeMs)
{
	
};

/**
 * Sets canvas size.
 */
RaytracingWebWorker.prototype.getTexturePixel = function(texture, uvX, uvY) 
{
	let posX = Math.floor(texture.width * uvX);
	let posY = Math.floor(texture.height * uvY);

	// r, g, b, a bits
	let NUM_OF_COLOR_BITS = 4;
	let above = posY * (texture.width * NUM_OF_COLOR_BITS);
	let start = above + (posX * NUM_OF_COLOR_BITS);
	
	let MAX_VALUE = 255;
	let red = texture.data[start + 0];
	let green = texture.data[start + 1];
	let blue = texture.data[start + 2];

	// THREE.Color does not support alpha channel
	let alpha = texture.data[start + 3];

	return new THREE.Color(red / MAX_VALUE, green / MAX_VALUE, blue / MAX_VALUE);
};

/**
 * Spawns ray for calculating colour.
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
	}
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
RaytracingWebWorker.prototype.renderCell = function() 
{
	console.log('[RaytracingWebWorker] Rendering cell');

	let _this = this;
	let cell = _this.cell;

	let startTime = new Date();
	
	let width = cell.width * _this.antialiasingFactor;
	let height = cell.height * _this.antialiasingFactor;
	
	let NUM_OF_COLOR_BITS = 4;
	let image = new namespace.core.RawImage('', width, height);

	let pixelColor = new THREE.Color();
	let index = 0;

	for (let y = 0; y < height; y++)
	{
		for (let x = 0; x < width; x++) 
		{
			let xPos = x + cell.startX * _this.antialiasingFactor - _this.canvasWidthHalf;
			let yPos = -(y + cell.startY * _this.antialiasingFactor - _this.canvasHeightHalf);

			// spawn primary ray at pixel position

			_this.origin.copy(_this.cameraPosition);

			_this.direction.set(xPos, yPos, - _this.perspective);
			_this.direction.applyMatrix3(_this.cameraNormalMatrix).normalize();
			
			_this.spawnRay(_this.origin, _this.direction, pixelColor, 0);

			// convert from linear to gamma

			image.data[index + 0] = Math.sqrt(pixelColor.r) * 255;
			image.data[index + 1] = Math.sqrt(pixelColor.g) * 255;
			image.data[index + 2] = Math.sqrt(pixelColor.b) * 255;
			image.data[index + 3] = 255;

			index += NUM_OF_COLOR_BITS;
		}
	}

	if (_this.antialiasingFactor > 1)
	{
		image.scale(namespace.enums.Direction.DOWN, _this.antialiasingFactor);
	}

	let endTime = new Date();
	let timeElapsed = endTime - startTime;

	let data = 
	{
		workerIndex: _this.workerIndex,
		buffer: image.data.buffer,
		cell: _this.cell,
		timeMs: timeElapsed
	};
	mainThread.mainFunction('globals.renderer.renderCell', data);
};

/**
 * Starts rendering.
 */
RaytracingWebWorker.prototype.render = function() 
{
	let _this = this;	

	_this.renderCell();
};
