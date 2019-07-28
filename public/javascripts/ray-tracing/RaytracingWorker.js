/**
 * DOM-less version of Raytracing Renderer
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author zz95 / http://github.com/zz85
 */
THREE.RaytracingRendererWorker = function (drawOnCanvas) 
{
	console.log('[THREE.RaytracingRendererWorker] Initializing worker');

	// basically how many tmes it spawns ray (how many times ray hits object)
	this.maxRecursionDepth = 3;

	this.canvasWidth;
	this.canvasHeight;
	this.canvasWidthHalf;
	this.canvasHeightHalf;

	this.startX;
	this.startY;
	this.blockWidth = 0;
	this.blockHeight = 0;
	this.renderingStartedDate;	
	
	this.camera;
	this.cameraPosition = new THREE.Vector3();
	this.cameraNormalMatrix = new THREE.Matrix3();
	this.origin = new THREE.Vector3();
	this.direction = new THREE.Vector3();

	this.raycaster = new THREE.Raycaster(this.origin, this.direction);
	this.ray = this.raycaster.ray;
	this.raycasterLight = new THREE.Raycaster();
	this.rayLight = this.raycasterLight.ray;

	this.perspective;
	
	this.scene;
	this.objects;
	this.lights = [];
	this.cache = {};

	this.loader = new THREE.ObjectLoader();
	this.drawOnCanvas = drawOnCanvas;		
};

Object.assign(THREE.RaytracingRendererWorker.prototype, THREE.EventDispatcher.prototype);


/**
 * Initializes object.
 */
THREE.RaytracingRendererWorker.prototype.init = function(width, height)
{
	this.setSize(width, height);

	// TODO fix passing maxRecursionDepth as parameter.
	// if (data.maxRecursionDepth) maxRecursionDepth = data.maxRecursionDepth;
};


/**
 * Sets block size.
 */
THREE.RaytracingRendererWorker.prototype.setBlockSize = function(blockWidth, blockHeight)
{
	this.blockWidth = blockWidth;
	this.blockHeight = blockHeight;
};


/**
 * Initializes scene.
 */
THREE.RaytracingRendererWorker.prototype.initScene = function(sceneData, cameraData, annexData)
{
	this.scene = this.loader.parse(sceneData);
	this.camera = this.loader.parse(cameraData);

	var meta = annexData;
	this.scene.traverse(function(o) 
	{
		if ( o.isPointLight ) 
		{
			o.physicalAttenuation = true;
		}

		var mat = o.material;

		if (!mat) return;

		var material = meta[ mat.uuid ];

		for ( var m in material ) 
		{
			mat[ m ] = material[ m ];
		}
	});
};


/**
 * Starts rendering.
 */
THREE.RaytracingRendererWorker.prototype.startRendering = function(x, y)
{
	this.startX = x;
	this.startY = y;
	this.render(this.scene, this.camera);
};


/**
 * Sets canvas size.
 */
THREE.RaytracingRendererWorker.prototype.setSize = function (width, height) 
{
	this.canvasWidth = width;
	this.canvasHeight = height;

	this.canvasWidthHalf = Math.floor(this.canvasWidth / 2);
	this.canvasHeightHalf = Math.floor(this.canvasHeight / 2);
};


/**
 * Spawns ray for calculating colour.
 */
THREE.RaytracingRendererWorker.prototype.spawnRay = function(rayOrigin, rayDirection, outputColor, recursionDepth) 
{
	var diffuseColor = new THREE.Color();
	var specularColor = new THREE.Color();
	var lightColor = new THREE.Color();
	var schlick = new THREE.Color();

	var lightContribution = new THREE.Color();

	var eyeVector = new THREE.Vector3();
	var lightVector = new THREE.Vector3();
	var normalVector = new THREE.Vector3();
	var halfVector = new THREE.Vector3();

	var localPoint = new THREE.Vector3();
	var reflectionVector = new THREE.Vector3();

	var tmpVec = new THREE.Vector3();

	var tmpColor = [];

	for ( var i = 0; i < this.maxRecursionDepth; i ++ ) 
	{
		tmpColor[i] = new THREE.Color();
	}
	
	// change colour for when no object is hit
	outputColor.setRGB( 0, 0, 0 );

	this.ray.origin = rayOrigin;
	this.ray.direction = rayDirection;

	var intersections = this.raycaster.intersectObjects(this.objects, true);

	if ( intersections.length === 0 ) 
	{
		// ray didn't find anything
		// (here should come setting of background color?)
		return;
	}

	// ray hit

	var intersection = intersections[0];
	var point = intersection.point;
	var object = intersection.object;
	var material = object.material;
	var face = intersection.face;
	var geometry = object.geometry;
	var _object = this.cache[object.id];

	eyeVector.subVectors(this.ray.origin, point).normalize();

	// resolve pixel diffuse color

	if ( material.isMeshLambertMaterial ||
			material.isMeshPhongMaterial ||
			material.isMeshStandardMaterial) 
	{
		diffuseColor.copyGammaToLinear(material.color);
	} 
	else if (material.isMeshBasicMaterial)
	{
		diffuseColor.copyGammaToLinear(material.color);
	}
	else 
	{
		diffuseColor.setRGB(1, 1, 1);
	}

	if ( material.vertexColors === THREE.FaceColors) 
	{
		diffuseColor.multiply( face.color );
	}

	// compute light shading

	this.rayLight.origin.copy( point );

	var textureImg;
	var canvas;
	var context;

	if (material.map && material.map.image)
	{
		textureImg = material.map.image;
		canvas = document.createElement('canvas');

		canvas.width = textureImg.width;
		canvas.height = textureImg.height;
		
		context = canvas.getContext('2d');
		context.drawImage(textureImg, 0, 0, textureImg.width, textureImg.height);
	}	

	if (material.isMeshBasicMaterial) 
	{
		for ( var i = 0, l = this.lights.length; i < l; i ++ ) 
		{
			var light = this.lights[i];

			lightVector.setFromMatrixPosition(light.matrixWorld);
			lightVector.sub(point);

			this.rayLight.direction.copy(lightVector).normalize();

			var intersections = this.raycasterLight.intersectObjects(this.objects, true);

			// point in shadow

			if ( intersections.length > 0 ) continue;

			// point visible

			outputColor.add(diffuseColor);

			// add texture colour

			if (textureImg && context && intersection.uv)
			{	
				// read texture pixels
				var uv = intersection.uv;
				material.map.transformUv(uv);

				var pixelData = context.getImageData(textureImg.width * uv.x, textureImg.height * uv.y, 1, 1).data;
				var pixelTextureColor = new THREE.Color("rgb(" + pixelData[0] + ", " + pixelData[1] + ", " + pixelData[2] + ")");

				outputColor.multiply(pixelTextureColor); 
			}
		}
	} 
	else if (material.isMeshLambertMaterial || material.isMeshPhongMaterial || material.isMeshStandardMaterial) 
	{
		var normalComputed = false;

		for (var i = 0, l = this.lights.length; i < l; i++) 
		{
			var light = this.lights[ i ];

			lightVector.setFromMatrixPosition( light.matrixWorld );
			lightVector.sub( point );

			this.rayLight.direction.copy( lightVector ).normalize();

			var intersections = this.raycasterLight.intersectObjects(this.objects, true);
			
			if ( intersections.length > 0 ) 
			{
				// point in shadow

				continue;
			}

			// point lit

			if ( normalComputed === false ) 
			{
				// the same normal can be reused for all lights
				// (should be possible to cache even more)

				localPoint.copy( point ).applyMatrix4( _object.inverseMatrix );
				this.computePixelNormal( normalVector, localPoint, material.flatShading, face, geometry );
				normalVector.applyMatrix3( _object.normalMatrix ).normalize();

				normalComputed = true;
			}

			lightColor.copyGammaToLinear( light.color );

			// compute attenuation

			var attenuation = 1.0;

			if ( light.physicalAttenuation === true ) 
			{
				attenuation = lightVector.length();
				attenuation = 1.0 / (attenuation * attenuation);
			}

			lightVector.normalize();

			// compute diffuse

			var dot = Math.max( normalVector.dot( lightVector ), 0 );
			var diffuseIntensity = dot * light.intensity;

			lightContribution.copy( diffuseColor );
			lightContribution.multiply( lightColor );
			lightContribution.multiplyScalar( diffuseIntensity * attenuation );

			outputColor.add( lightContribution );

			// add texture colour

			if (textureImg && context && intersection.uv)
			{	
				// read texture pixels
				var uv = intersection.uv;
				material.map.transformUv(uv);

				var pixelData = context.getImageData(textureImg.width * uv.x, textureImg.height * uv.y, 1, 1).data;
				var pixelTextureColor = new THREE.Color("rgb(" + pixelData[0] + ", " + pixelData[1] + ", " + pixelData[2] + ")");

				outputColor.multiply(pixelTextureColor); 
			}

			// compute specular

			if (material.isMeshPhongMaterial) 
			{
				halfVector.addVectors( lightVector, eyeVector ).normalize();

				var dotNormalHalf = Math.max( normalVector.dot( halfVector ), 0.0 );
				var specularIntensity = Math.max( Math.pow( dotNormalHalf, material.shininess ), 0.0 ) * diffuseIntensity;

				var specularNormalization = ( material.shininess + 2.0 ) / 8.0;

				specularColor.copyGammaToLinear( material.specular );

				var alpha = Math.pow( Math.max( 1.0 - lightVector.dot( halfVector ), 0.0 ), 5.0 );

				schlick.r = specularColor.r + ( 1.0 - specularColor.r ) * alpha;
				schlick.g = specularColor.g + ( 1.0 - specularColor.g ) * alpha;
				schlick.b = specularColor.b + ( 1.0 - specularColor.b ) * alpha;

				lightContribution.copy( schlick );
				lightContribution.multiply( lightColor );
				lightContribution.multiplyScalar( specularNormalization * specularIntensity * attenuation );

				outputColor.add( lightContribution );
			}
		}
	}

	// reflection / refraction

	var reflectivity = material.reflectivity;

	if ( ( material.mirror || material.glass ) && reflectivity > 0 && recursionDepth < this.maxRecursionDepth ) 
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
		var zColor = tmpColor[ recursionDepth ];

		this.spawnRay( point, reflectionVector, zColor, recursionDepth + 1 );

		if ( material.specular !== undefined ) 
		{
			zColor.multiply( material.specular );
		}

		zColor.multiplyScalar( weight );
		outputColor.multiplyScalar( 1 - weight );
		outputColor.add( zColor );
	}
};


/**
 * Computes normal.
 */
THREE.RaytracingRendererWorker.prototype.computePixelNormal = function(outputVector, point, flatShading, face, geometry) 
{
	var vA = new THREE.Vector3();
	var vB = new THREE.Vector3();
	var vC = new THREE.Vector3();

	var tmpVec1 = new THREE.Vector3();
	var tmpVec2 = new THREE.Vector3();
	var tmpVec3 = new THREE.Vector3();
	var faceNormal = face.normal;

	if ( flatShading === true ) 
	{
		outputVector.copy( faceNormal );
	}
	else 
	{
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
	}
};


/**
 * Renders block.
 */
THREE.RaytracingRendererWorker.prototype.renderBlock = function(blockX, blockY) 
{
	console.log('[THREE.RaytracingRendererWorker] Rendering specified canvas block');

	var data = new Uint8ClampedArray(this.blockWidth * this.blockHeight * 4);
	var pixelColor = new THREE.Color();
	var index = 0;

	for (var y = 0; y < this.blockHeight; y ++)
	{
		for (var x = 0; x < this.blockWidth; x ++, index += 4) 
		{
			// spawn primary ray at pixel position

			this.origin.copy(this.cameraPosition);

			this.direction.set( x + blockX - this.canvasWidthHalf, - ( y + blockY - this.canvasHeightHalf ), - this.perspective );
			this.direction.applyMatrix3(this.cameraNormalMatrix ).normalize();

			this.spawnRay(this.origin, this.direction, pixelColor, 0);

			// convert from linear to gamma

			data[ index + 0 ] = Math.sqrt( pixelColor.r ) * 255;
			data[ index + 1 ] = Math.sqrt( pixelColor.g ) * 255;
			data[ index + 2 ] = Math.sqrt( pixelColor.b ) * 255;
			data[ index + 3 ] = 255;
		}
	}

	this.drawOnCanvas(data.buffer, blockX, blockY, new Date() - this.renderingStartedDate);
};


/**
 * Starts rendering.
 */
THREE.RaytracingRendererWorker.prototype.render = function(scene, camera) 
{
	this.renderingStartedDate = new Date();

	// update scene graph

	if (scene.autoUpdate === true) scene.updateMatrixWorld();

	// update camera matrices

	if (camera.parent === null) camera.updateMatrixWorld();

	this.cameraPosition.setFromMatrixPosition(camera.matrixWorld);
	this.cameraNormalMatrix.getNormalMatrix(camera.matrixWorld);

	this.perspective = 0.5 / Math.tan(THREE.Math.degToRad(camera.fov * 0.5)) * this.canvasHeight;
	this.objects = scene.children;

	// collect lights and set up object matrices

	this.lights.length = 0;

	scene.traverse(function(object) 
	{
		if (object.isPointLight) 
		{
			this.lights.push(object);
		}

		if (this.cache[object.id] === undefined) 
		{
			this.cache[object.id] = {
				normalMatrix: new THREE.Matrix3(),
				inverseMatrix: new THREE.Matrix4()
			};
		}

		var _object = this.cache[object.id];

		_object.normalMatrix.getNormalMatrix(object.matrixWorld);
		_object.inverseMatrix.getInverse(object.matrixWorld);

	}.bind(this));

	this.renderBlock(this.startX, this.startY);
};