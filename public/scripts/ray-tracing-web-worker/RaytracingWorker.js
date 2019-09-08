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
	this.maxRecursionDepth = 3;

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

	this.isRendering = false;
	
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
	this.images;
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
	this.cell = cell;
};


/**
 * Initializes object.
 */
RaytracingRendererWorker.prototype.init = function(width, height)
{
	this.setSize(width, height);

	// TODO fix passing maxRecursionDepth as parameter.
	// if (data.maxRecursionDepth) maxRecursionDepth = data.maxRecursionDepth;
};


/**
 * Initializes scene.
 */
RaytracingRendererWorker.prototype.initScene = function(sceneData, cameraData, images, annexData)
{
	var _this = this;

	_this.scene = _this.loader.parse(sceneData, images);
	_this.camera = _this.loader.parse(cameraData, images);
	_this.images = images;

	var meta = annexData;
	_this.scene.traverse(function(o) 
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

	_this.lights.length = 0;

	_this.scene.traverse(function(object) 
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

	}.bind(_this));
};


/**
 * Starts rendering.
 */
RaytracingRendererWorker.prototype.startRendering = function()
{
	this.render();
};


/**
 * Sets canvas size.
 */
RaytracingRendererWorker.prototype.setSize = function (width, height) 
{
	this.canvasWidth = width;
	this.canvasHeight = height;

	this.canvasWidthHalf = Math.floor(this.canvasWidth / 2);
	this.canvasHeightHalf = Math.floor(this.canvasHeight / 2);
};


/**
 * Sets canvas size.
 */
RaytracingRendererWorker.prototype.getTexturePixel = function (texture, uvX, uvY) 
{
	// r, g, b, a bits
	var NUM_OF_COLOR_BITS = 4;

	let posX = Math.floor(texture.width * uvX);
	let posY = Math.floor(texture.height * uvY);

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

	var tmpColor = new Array();

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

		let skyMap;
		let pixelColor;
		let posU;
		let posV;

		if(Math.abs(rayDirection.x)>Math.abs(rayDirection.y))
		{
			if(Math.abs(rayDirection.x)>Math.abs(rayDirection.z))
			{
				// x is dominant axis.
				if(rayDirection.x<0)
				{
					// -X is dominant axis -> left face
					skyMap = this.scene.background.rawImage[0];

					posU = rayDirection.z/(rayDirection.x);
 					posV = -rayDirection.y/(-rayDirection.x);
				}
				else
				{
					// +X is dominant axis -> right face
					skyMap = this.scene.background.rawImage[1];

					posU = rayDirection.z/(rayDirection.x);
 					posV = -rayDirection.y/(rayDirection.x);
				}				
			}
			else
			{
				// z is dominant axis.
				if(rayDirection.z<0)
				{
					// -Z is dominant axis -> left face
					skyMap = this.scene.background.rawImage[5];

					posU = rayDirection.x/(-rayDirection.z);
 					posV = -rayDirection.y/(-rayDirection.z);
				}
				else
				{
					// +Z is dominant axis -> right face
					skyMap = this.scene.background.rawImage[4];

					posU = -rayDirection.x/(rayDirection.z);
 					posV = -rayDirection.y/(rayDirection.z);
				}
			}
		}
		else if(Math.abs(rayDirection.y)>Math.abs(rayDirection.z))
		{
			// y is dominant axis.
			if(rayDirection.y<0)
			{
				// -Y is dominant axis -> left face
				skyMap = this.scene.background.rawImage[3];

				posU = rayDirection.x/(rayDirection.y);
				posV = -rayDirection.z/(-rayDirection.y);
			}
			else
			{
				// +Y is dominant axis -> right face
				skyMap = this.scene.background.rawImage[2];

				posU = -rayDirection.x/(rayDirection.y);
				posV = rayDirection.z/(rayDirection.y);
			}
		}
		else
		{
			// z is dominant axis.
			if(rayDirection.z<0)
			{
				// -Z is dominant axis -> left face
				skyMap = this.scene.background.rawImage[5];

				posU = rayDirection.x/(-rayDirection.z);
 				posV = -rayDirection.y/(-rayDirection.z);
			}
			else
			{
				// +Z is dominant axis -> right face
				skyMap = this.scene.background.rawImage[4];

				posU = -rayDirection.x/(rayDirection.z);
				posV = -rayDirection.y/(rayDirection.z);
			}
		}

		posU=(posU+1)/2;
		posV=(posV+1)/2;
		pixelColor = this.getTexturePixel(skyMap, posU, posV);

		outputColor.set(pixelColor);

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

	// add texture colour
	// resolve pixel diffuse color

	// -----------------------------
	// 
	// 
	// -----------------------------

	/**
	 * PHONG MODEL:
	 * - diffuse color (base color)
	 * - specular color
	 * - reflectivenes 
	 * 
	 * 
	 * PBR MODEL:
	 * - albedo color (base color)
	 * - metallic factor
	 * - roughness factor
	 * 
	 */

	var alphaMap = null;
	var aoMap = null;
	var emissiveMap = null;
	var envMap = null;
	var lightMap = null;
	var albedo = null;
	var metalnessMap = null;
	var normalMap = null;
	var roughnessMap = null; 

	if (intersection.uv)
	{
		if (material.alphaMap)
		{
			alphaMap = this.getTexturePixel(material.alphaMap.image, intersection.uv.x, intersection.uv.y);
		}

		if (material.aoMap)
		{
			// ambient occulsion map
			aoMap = this.getTexturePixel(material.aoMap.image, intersection.uv.x, intersection.uv.y);
		}

		if (material.emissiveMap)
		{
			emissiveMap = this.getTexturePixel(material.emissiveMap.image, intersection.uv.x, intersection.uv.y);
		}

		if (material.envMap)
		{
			envMap = this.getTexturePixel(material.envMap.image, intersection.uv.x, intersection.uv.y);
		}

		if (material.lightMap)
		{
			lightMap = this.getTexturePixel(material.lightMap.image, intersection.uv.x, intersection.uv.y);
		}

		if (material.map)
		{
			// diffuseColor or albedo color
			albedo = this.getTexturePixel(material.map.image, intersection.uv.x, intersection.uv.y);
		}

		if (material.metalnessMap)
		{
			metalnessMap = this.getTexturePixel(material.metalnessMap.image, intersection.uv.x, intersection.uv.y);
		}

		if (material.normalMap)
		{
			normalMap = this.getTexturePixel(material.normalMap.image, intersection.uv.x, intersection.uv.y);
		}

		if (material.roughnessMap)
		{
			roughnessMap = this.getTexturePixel(material.roughnessMap.image, intersection.uv.x, intersection.uv.y);
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
		diffuseColor.multiply( face.color );
	}


	// -----------------------------
	// compute light shading
	// -----------------------------

	this.rayLight.origin.copy(point);	

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

		if (normalComputed === false) 
		{
			// the same normal can be reused for all lights
			// (should be possible to cache even more)

			localPoint.copy( point ).applyMatrix4( _object.inverseMatrix );
			this.computePixelNormal( normalVector, localPoint, material.flatShading, face, geometry );
			normalVector.applyMatrix3( _object.normalMatrix ).normalize();

			normalComputed = true;
		}

		lightColor.copyGammaToLinear(light.color);

		// compute attenuation

		var attenuation = 1.0;

		if (light.physicalAttenuation === true) 
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

		// compute specular

		if (material.isMeshPhongMaterial) 
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

			var dotNormalHalf = Math.max(normalVector.dot(halfVector), 0.0);
			var specularIntensity = Math.max(Math.pow(dotNormalHalf, shininess), 0.0) * diffuseIntensity;

			var specularNormalization = (shininess + 2.0) / 8.0;

			specularColor.copyGammaToLinear(specular);

			var alpha = Math.pow(Math.max( 1.0 - lightVector.dot( halfVector ), 0.0 ), 5.0);

			schlick.r = specularColor.r + ( 1.0 - specularColor.r ) * alpha;
			schlick.g = specularColor.g + ( 1.0 - specularColor.g ) * alpha;
			schlick.b = specularColor.b + ( 1.0 - specularColor.b ) * alpha;

			lightContribution.copy( schlick );
			lightContribution.multiply( lightColor );
			lightContribution.multiplyScalar( specularNormalization * specularIntensity * attenuation );

			outputColor.add( lightContribution );
		}
	}

	if (aoMap)
	{	
		outputColor.multiply(aoMap);
	}


	// -----------------------------
	// reflection / refraction
	// -----------------------------

	var reflectivity;

	if (material.reflectivity)
	{
		reflectivity = material.reflectivity;
	}

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

		// recursive call
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
RaytracingRendererWorker.prototype.computePixelNormal = function(outputVector, point, flatShading, face, geometry) 
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
RaytracingRendererWorker.prototype.renderBlock = function() 
{
	console.log('[RaytracingRendererWorker] Rendering specified canvas block');

	var data = new Uint8ClampedArray(this.cell.width * this.cell.height * 4);
	var pixelColor = new THREE.Color();
	var index = 0;

	for (var y = 0; y < this.cell.height; y ++)
	{
		for (var x = 0; x < this.cell.width; x ++, index += 4) 
		{
			// spawn primary ray at pixel position

			this.origin.copy(this.cameraPosition);

			this.direction.set( x + this.cell.startX - this.canvasWidthHalf, - ( y + this.cell.startY - this.canvasHeightHalf ), - this.perspective );
			this.direction.applyMatrix3(this.cameraNormalMatrix ).normalize();

			this.spawnRay(this.origin, this.direction, pixelColor, 0);

			// convert from linear to gamma

			data[ index + 0 ] = Math.sqrt( pixelColor.r ) * 255;
			data[ index + 1 ] = Math.sqrt( pixelColor.g ) * 255;
			data[ index + 2 ] = Math.sqrt( pixelColor.b ) * 255;
			data[ index + 3 ] = 255;
		}
	}

	this.isRendering = false;
	this.onCellRendered(this.workerIndex, data.buffer, this.cell, new Date() - this.renderingStartedDate);
};


/**
 * Starts rendering.
 */
RaytracingRendererWorker.prototype.render = function() 
{
	this.isRendering = true;
	this.renderingStartedDate = new Date();

	this.renderBlock();
};