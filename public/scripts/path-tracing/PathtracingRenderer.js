'use strict';

var isPaused = true;
const PI_2 = Math.PI / 2; // used in animation method

/**
 * Pathtracing renderer
 *
 * @author erichlof / https://github.com/erichlof
 * @author lukaprijatelj / http://github.com/lukaprijatelj 
 */
var PathtracingRenderer = function()
{	
	// Three.js related variables
	this.canvas;
	
	this.controls;
	this.renderer;
	this.clock;

	// PathTracing scene variables
	this.pathTracingScene;
	this.screenTextureScene;
	this.screenOutputScene;
	this.pathTracingUniforms;
	this.pathTracingDefines;
	this.screenOutputMaterial;
	this.pathTracingRenderTarget;
	this.screenTextureRenderTarget;

	// Camera variables
	this.quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
	this.worldCamera = null;

	// Environment variables
	this.skyLightIntensity = 1;
	this.sunLightIntensity = 1;
	this.sunColor = [255, 250, 235];
	this.cameraControlsObject; //for positioning and moving the camera itself
	this.cameraControlsYawObject; //allows access to control camera's left/right movements through mobile input
	this.cameraControlsPitchObject; //allows access to control camera's up/down movements through mobile input

	// Camera setting variables
	this.apertureSize = 0.0;
	this.focusDistance = 100.0;
	this.speed = 60;

	// Rendering variables
	this.sunAngle = Math.PI / 2.5;
	this.sampleCounter = 1.0;
	this.frameCounter = 1.0;
	this.forceUpdate = false;
	this.cameraIsMoving = false;
	this.cameraJustStartedMoving = false;
	this.cameraRecentlyMoving = false;

	// Input variables
	this.oldYawRotation = 0;
	this.oldPitchRotation = 0;

	this.keyboard = new THREEx.KeyboardState();

	// Geometry variables
	this.triangleMaterialMarkers = [];
	this.pathTracingMaterialList = [];
	this.uniqueMaterialTextures = [];

	// Menu variables
	this.minFov = 1;
	this.maxFov = 150;
	this.minFocusDistance = 1;
	this.minApertureSize = 0;
	this.maxApertureSize = 20;
	this.fovChanged = false;
	this.focusDistanceChanged = false;
	this.apertureSizeChanged = false;

	this.triangleDataTexture;
	this.aabbDataTexture;
		
	this.stateStartTime = 0;

	this.meshList = [];
	this.modelMesh;
	
	this.animationFrameID = -1;
	
	/**
	 * Checks if rendering state is running or paused.
	 */
	this.resolve = null;
	this.reject = null;
	
	// rebind event handlers
	this.onRenderFrame = this.onRenderFrame.bind(this);
	this.onMouseWheel = this.onMouseWheel.bind(this);

	this._init();
};

/**
 * Initializes renderer.
 */
PathtracingRenderer.prototype._init = function()
{
	let _this = this;

	console.log('[PathtracingRenderer] Initializing renderer');

	_this.initThree();
};

/**
 * Initializes camera.
 */
PathtracingRenderer.prototype.initCamera = function()
{
	let _this = this;

	_this.worldCamera = globals.camera;

	_this.worldCamera.aspect = options.CANVAS_WIDTH / options.CANVAS_HEIGHT;
	_this.worldCamera.updateProjectionMatrix();

	// the following scales all scene objects by the worldCamera's field of view,
	// taking into account the screen aspect ratio and multiplying the uniform uULen,
	// the x-coordinate, by this ratio
	let fovScale = _this.worldCamera.fov * 0.5 * (Math.PI / 180.0);
	_this.pathTracingUniforms.uVLen.value = Math.tan(fovScale);
	_this.pathTracingUniforms.uULen.value = _this.pathTracingUniforms.uVLen.value * _this.worldCamera.aspect;

	// worldCamera is the dynamic camera 3d object that will be positioned, oriented and
	// constantly updated inside the 3d scene.  Its view will ultimately get passed back to the
	// stationary quadCamera, which renders the scene to a fullscreen quad (made up of 2 large triangles).
	//_this.worldCamera = new THREE.PerspectiveCamera(50, canvas.width / canvas.height, 1, 1000);
	//_this.pathTracingScene.add(_this.worldCamera);

	_this.controls = new FirstPersonCameraControls(_this.worldCamera);
	_this.cameraControlsObject = _this.controls.getObject();
	_this.cameraControlsYawObject = _this.controls.getYawObject();
	_this.cameraControlsPitchObject = _this.controls.getPitchObject();

	_this.oldYawRotation = _this.cameraControlsYawObject.rotation.y;
	_this.oldPitchRotation = _this.cameraControlsPitchObject.rotation.x;

	// now that we moved and rotated the camera, the following line force-updates the camera's matrix,
	// and prevents rendering the very first frame in the old default camera position/orientation
	_this.cameraControlsObject.updateMatrixWorld(true);

	// TODO: why is this
	_this.pathTracingScene.add(_this.cameraControlsObject);	
};

/**
 * Initializes lights.
 */
PathtracingRenderer.prototype.initLights = function()
{
	let _this = this;
	
	// do nothing
};

/**
 * Sets cells waiting to be rendered.
 */
PathtracingRenderer.prototype.setWaitingCells = function()
{
	let _this = this;
	
	// do nothing
};

/**
 * Starts rendering process.
 */
PathtracingRenderer.prototype.startRendering = function()
{
	let _this = this;

	_this.stateStartTime = 0;
	_this.onRenderFrame();
};

/**
 * Checks for rendering state.
 */
PathtracingRenderer.prototype.checkRenderingState = function()
{
	let _this = this;

	return new Promise((resolve, reject) =>
	{
		if (API.renderingServiceState == namespace.enums.renderingServiceState.PAUSED)
		{
			_this.resolve = resolve;
			_this.reject = reject;
		}
		else if (API.renderingServiceState == namespace.enums.renderingServiceState.IDLE)
		{
			reject();
		}
		else
		{
			resolve();
		}
	});		
};

/**
 * Resumes rendering state.
 */
PathtracingRenderer.prototype.resumeRendering = function()
{
	let _this = this;

	if (_this.resolve)
	{
		_this.resolve();
	}
};

/**
 * Completely stops rendering state.
 */
PathtracingRenderer.prototype.stopRendering = function()
{
	let _this = this;

	if (_this.animationFrameID >= 0)
	{
		cancelAnimationFrame(_this.animationFrameID);
		_this.animationFrameID = -1;
	}
};

/**
 * Starts loading models.
 */
PathtracingRenderer.prototype.prepareJsonData = async function() 
{
	let _this = this;

	let MaterialObject = function(material) 
	{
		// a list of material types and their corresponding numbers are found in the 'pathTracingCommon.js' file
		this.type = material.opacity < 1 ? 2 : 1; // default is 1 = diffuse opaque, 2 = glossy transparent, 4 = glossy opaque;
		this.albedoTextureID = -1; // which diffuse map to use for model's color, '-1' = no textures are used
		this.color = material.color ? material.color.copy(material.color) : new THREE.Color(1.0, 1.0, 1.0); // takes on different meanings, depending on 'type' above
		this.roughness = material.roughness || 0.0; // 0.0 to 1.0 range, perfectly smooth to extremely rough
		this.metalness = material.metalness || 0.0; // 0.0 to 1.0 range, usually either 0 or 1, either non-metal or metal
		this.opacity = material.opacity || 1.0; // 0.0 to 1.0 range, fully transparent to fully opaque

		// this seems to be unused
		// this.refractiveIndex = this.type === 4 ? 1.0 : 1.5; // 1.0=air, 1.33=water, 1.4=clearCoat, 1.5=glass, etc.
	};
							
	let parent;

	let matrixStack = [];
	matrixStack.push(new THREE.Matrix4());
	
	globals.scene.traverse(function(child) 
	{
		if (child.isMesh) 
		{
			if (parent !== undefined && parent.name !== child.parent.name) 
			{
				matrixStack.pop();
				parent = undefined;
			}

			child.geometry.applyMatrix(child.matrix.multiply(matrixStack[matrixStack.length - 1]));

			if (child.material.length > 0) 
			{
				for (let i = 0; i < child.material.length; i++)
				{
					_this.pathTracingMaterialList.push(new MaterialObject(child.material[i]));
				}
			} 
			else 
			{
				_this.pathTracingMaterialList.push(new MaterialObject(child.material));
			}

			if (child.geometry.groups.length > 0) 
			{
				for (let i = 0; i < child.geometry.groups.length; i++) 
				{
					_this.triangleMaterialMarkers.push((_this.triangleMaterialMarkers.length > 0 ? _this.triangleMaterialMarkers[_this.triangleMaterialMarkers.length - 1] : 0) + child.geometry.groups[i].count / 3);
				}
			} 
			else 
			{
				_this.triangleMaterialMarkers.push((_this.triangleMaterialMarkers.length > 0 ? _this.triangleMaterialMarkers[_this.triangleMaterialMarkers.length - 1] : 0) + child.geometry.index.count / 3);
			}

			_this.meshList.push(child);
		} 
		else if (child.isObject3D) 
		{
			if (parent !== undefined)
				matrixStack.pop();

			let matrixPeek = new THREE.Matrix4().copy(matrixStack[matrixStack.length - 1]).multiply(child.matrix);
			matrixStack.push(matrixPeek);
			parent = child;
		}
	});

	if (Array.isEmpty(_this.meshList))
	{
		new Exception.ArrayEmpty('Model does not have any geometry?');
	}

	/*
	// albedo map
	if (meshList[0].material.map != undefined)
			albedoMap = meshList[0].material.map;

	// emissive map
	if (meshList[0].material.emissiveMap != undefined)
			emissiveMap = meshList[0].material.emissiveMap;

	// metallicRoughness map
	if (meshList[0].material.roughnessMap != undefined)
			metallicRoughnessMap = meshList[0].material.roughnessMap;
	
	// normal map
	if (meshList[0].material.normalMap != undefined)
			normalMap = meshList[0].material.normalMap;
	*/
};

/**
 * Initializes scene data.
 */
PathtracingRenderer.prototype.initScene = function () 
{
	let _this = this;

	let meshList = _this.meshList;
	let geoList = [];

	for (let i = 0; i < meshList.length; i++)
	{
		geoList.push(meshList[i].geometry);
	}	
		
	// Merge geometry from all models into one new mesh
	let bufferGeometryUtils = THREE.BufferGeometryUtils.mergeBufferGeometries(geoList);
	_this.modelMesh = new THREE.Mesh(bufferGeometryUtils);

	if (_this.modelMesh.geometry.index)
	{
		_this.modelMesh.geometry = _this.modelMesh.geometry.toNonIndexed(); // why do we need NonIndexed geometry?
	}
		
	let total_number_of_triangles = _this.modelMesh.geometry.attributes.position.array.length / 9;

	if (total_number_of_triangles <= 0)
	{
		new Exception.Other('No geometry triangles found!');
	}

	// Gather all textures from materials
	for (let i = 0; i < meshList.length; i++) 
	{
		if (meshList[i].material.length > 0) 
		{
			for (let j = 0; j < meshList[i].material.length; j++) 
			{
				if (meshList[i].material[j].map)
					_this.uniqueMaterialTextures.push(meshList[i].material[j].map);
			}
		} 
		else if (meshList[i].material.map) 
		{
			_this.uniqueMaterialTextures.push(meshList[i].material.map);
		}
	}

	// Remove duplicate entries
	_this.uniqueMaterialTextures = Array.from(new Set(_this.uniqueMaterialTextures));

	// Assign textures to the path tracing material with the correct id
	for (let i = 0; i < meshList.length; i++) 
	{
		if (meshList[i].material.length > 0) 
		{
			for (let j = 0; j < meshList[i].material.length; j++) 
			{
				if (meshList[i].material[j].map) 
				{
					for (let k = 0; k < _this.uniqueMaterialTextures.length; k++) 
					{
						if (meshList[i].material[j].map.image.src === _this.uniqueMaterialTextures[k].image.src) 
						{
							// albedo map
							_this.pathTracingMaterialList[i].albedoTextureID = k;
						}
					}
				}
			}
		} 
		else if (meshList[i].material.map) 
		{
			for (let j = 0; j < _this.uniqueMaterialTextures.length; j++) 
			{
				if (meshList[i].material.map.image.src === _this.uniqueMaterialTextures[j].image.src) 
				{
					// albedo map
					_this.pathTracingMaterialList[i].albedoTextureID = j;
				}
			}
		}
	}

	console.log("Triangle count:" + total_number_of_triangles);

	let totalWork = new Uint32Array(total_number_of_triangles);

	// Initialize triangle and aabb arrays where 2048 = width and height of texture and 4 are the r, g, b and a components
	let textureWidth = 2048;
	let textureHeight = 2048;

	let triangle_array = new Float32Array(textureWidth * textureHeight * 4);
	let aabb_array = new Float32Array(textureWidth * textureHeight * 4);

	let triangle_b_box_min = new THREE.Vector3();
	let triangle_b_box_max = new THREE.Vector3();
	let triangle_b_box_centroid = new THREE.Vector3();

	let vpa = new Float32Array(_this.modelMesh.geometry.attributes.position.array);

	if (_this.modelMesh.geometry.attributes.normal === undefined)
	{
		_this.modelMesh.geometry.computeVertexNormals();
	}		

	let vta = null;

	if (_this.modelMesh.geometry.attributes.uv !== undefined) 
	{
		vta = new Float32Array(_this.modelMesh.geometry.attributes.uv.array);
	}

	let vna = new Float32Array(_this.modelMesh.geometry.attributes.normal.array);
	let materialNumber = 0;

	for (let i = 0; i < total_number_of_triangles; i++) 
	{
		triangle_b_box_min.set(Infinity, Infinity, Infinity);
		triangle_b_box_max.set(-Infinity, -Infinity, -Infinity);

		let vt0 = new THREE.Vector3();
		let vt1 = new THREE.Vector3();
		let vt2 = new THREE.Vector3();
		// record vertex texture coordinates (UVs)

		if (vta) 
		{
			vt0.set(vta[6 * i + 0], vta[6 * i + 1]);
			vt1.set(vta[6 * i + 2], vta[6 * i + 3]);
			vt2.set(vta[6 * i + 4], vta[6 * i + 5]);
		} 
		else 
		{
			vt0.set(-1, -1);
			vt1.set(-1, -1);
			vt2.set(-1, -1);
		}

		// record vertex normals
		let vn0 = new THREE.Vector3(vna[9 * i + 0], vna[9 * i + 1], vna[9 * i + 2]).normalize();
		let vn1 = new THREE.Vector3(vna[9 * i + 3], vna[9 * i + 4], vna[9 * i + 5]).normalize();
		let vn2 = new THREE.Vector3(vna[9 * i + 6], vna[9 * i + 7], vna[9 * i + 8]).normalize();

		// record vertex positions
		let vp0 = new THREE.Vector3(vpa[9 * i + 0], vpa[9 * i + 1], vpa[9 * i + 2]);
		let vp1 = new THREE.Vector3(vpa[9 * i + 3], vpa[9 * i + 4], vpa[9 * i + 5]);
		let vp2 = new THREE.Vector3(vpa[9 * i + 6], vpa[9 * i + 7], vpa[9 * i + 8]);

		//slot 0
		triangle_array[32 * i + 0] = vp0.x; // r or x
		triangle_array[32 * i + 1] = vp0.y; // g or y
		triangle_array[32 * i + 2] = vp0.z; // b or z
		triangle_array[32 * i + 3] = vp1.x; // a or w

		//slot 1
		triangle_array[32 * i + 4] = vp1.y; // r or x
		triangle_array[32 * i + 5] = vp1.z; // g or y
		triangle_array[32 * i + 6] = vp2.x; // b or z
		triangle_array[32 * i + 7] = vp2.y; // a or w

		//slot 2
		triangle_array[32 * i + 8] = vp2.z; // r or x
		triangle_array[32 * i + 9] = vn0.x; // g or y
		triangle_array[32 * i + 10] = vn0.y; // b or z
		triangle_array[32 * i + 11] = vn0.z; // a or w

		//slot 3
		triangle_array[32 * i + 12] = vn1.x; // r or x
		triangle_array[32 * i + 13] = vn1.y; // g or y
		triangle_array[32 * i + 14] = vn1.z; // b or z
		triangle_array[32 * i + 15] = vn2.x; // a or w

		//slot 4
		triangle_array[32 * i + 16] = vn2.y; // r or x
		triangle_array[32 * i + 17] = vn2.z; // g or y
		triangle_array[32 * i + 18] = vt0.x; // b or z
		triangle_array[32 * i + 19] = vt0.y; // a or w

		//slot 5
		triangle_array[32 * i + 20] = vt1.x; // r or x
		triangle_array[32 * i + 21] = vt1.y; // g or y
		triangle_array[32 * i + 22] = vt2.x; // b or z
		triangle_array[32 * i + 23] = vt2.y; // a or w

		// the remaining slots are used for PBR material properties

		if (i >= _this.triangleMaterialMarkers[materialNumber])
		{
			materialNumber++;
		}
			
		//slot 6
		triangle_array[32 * i + 24] = _this.pathTracingMaterialList[materialNumber].type; // r or x
		triangle_array[32 * i + 25] = _this.pathTracingMaterialList[materialNumber].color.r; // g or y
		triangle_array[32 * i + 26] = _this.pathTracingMaterialList[materialNumber].color.g; // b or z
		triangle_array[32 * i + 27] = _this.pathTracingMaterialList[materialNumber].color.b; // a or w

		//slot 7
		triangle_array[32 * i + 28] = _this.pathTracingMaterialList[materialNumber].albedoTextureID; // r or x
		triangle_array[32 * i + 29] = _this.pathTracingMaterialList[materialNumber].opacity; // g or y
		triangle_array[32 * i + 30] = 0; // b or z
		triangle_array[32 * i + 31] = 0; // a or w

		triangle_b_box_min.copy(triangle_b_box_min.min(vp0));
		triangle_b_box_max.copy(triangle_b_box_max.max(vp0));
		triangle_b_box_min.copy(triangle_b_box_min.min(vp1));
		triangle_b_box_max.copy(triangle_b_box_max.max(vp1));
		triangle_b_box_min.copy(triangle_b_box_min.min(vp2));
		triangle_b_box_max.copy(triangle_b_box_max.max(vp2));

		triangle_b_box_centroid.set((triangle_b_box_min.x + triangle_b_box_max.x) * 0.5,
			(triangle_b_box_min.y + triangle_b_box_max.y) * 0.5,
			(triangle_b_box_min.z + triangle_b_box_max.z) * 0.5);

		aabb_array[9 * i + 0] = triangle_b_box_min.x;
		aabb_array[9 * i + 1] = triangle_b_box_min.y;
		aabb_array[9 * i + 2] = triangle_b_box_min.z;
		aabb_array[9 * i + 3] = triangle_b_box_max.x;
		aabb_array[9 * i + 4] = triangle_b_box_max.y;
		aabb_array[9 * i + 5] = triangle_b_box_max.z;
		aabb_array[9 * i + 6] = triangle_b_box_centroid.x;
		aabb_array[9 * i + 7] = triangle_b_box_centroid.y;
		aabb_array[9 * i + 8] = triangle_b_box_centroid.z;

		totalWork[i] = i;
	} 

	// Build the BVH acceleration structure, which places a bounding box ('root' of the tree) around all of the
	// triangles of the entire mesh, then subdivides each box into 2 smaller boxes.  It continues until it reaches 1 triangle,
	// which it then designates as a 'leaf'
	BVH_Build_Iterative(totalWork, aabb_array);

	// Copy the buildnodes array into the aabb_array
	for (let n = 0; n < buildnodes.length; n++) 
	{
		// slot 0
		aabb_array[8 * n + 0] = buildnodes[n].idLeftChild;  // r or x component
		aabb_array[8 * n + 1] = buildnodes[n].minCorner.x;  // g or y component
		aabb_array[8 * n + 2] = buildnodes[n].minCorner.y;  // b or z component
		aabb_array[8 * n + 3] = buildnodes[n].minCorner.z;  // a or w component

		// slot 1
		aabb_array[8 * n + 4] = buildnodes[n].idRightChild; // r or x component
		aabb_array[8 * n + 5] = buildnodes[n].maxCorner.x;  // g or y component
		aabb_array[8 * n + 6] = buildnodes[n].maxCorner.y;  // b or z component
		aabb_array[8 * n + 7] = buildnodes[n].maxCorner.z;  // a or w component
	}

	_this.triangleDataTexture = new THREE.DataTexture(triangle_array,
		textureWidth,
		textureHeight,
		THREE.RGBAFormat,
		THREE.FloatType,
		THREE.Texture.DEFAULT_MAPPING,
		THREE.ClampToEdgeWrapping,
		THREE.ClampToEdgeWrapping,
		THREE.NearestFilter,
		THREE.NearestFilter,
		1,
		THREE.LinearEncoding
	);
	_this.triangleDataTexture.flipY = false;
	_this.triangleDataTexture.generateMipmaps = false;
	_this.triangleDataTexture.needsUpdate = true;

	_this.aabbDataTexture = new THREE.DataTexture(aabb_array,
		textureWidth,
		textureHeight,
		THREE.RGBAFormat,
		THREE.FloatType,
		THREE.Texture.DEFAULT_MAPPING,
		THREE.ClampToEdgeWrapping,
		THREE.ClampToEdgeWrapping,
		THREE.NearestFilter,
		THREE.NearestFilter,
		1,
		THREE.LinearEncoding
	);
	_this.aabbDataTexture.flipY = false;
	_this.aabbDataTexture.generateMipmaps = false;
	_this.aabbDataTexture.needsUpdate = true;

	_this.prepareGeometryForPT();
};

/**
 * Initializes threejs variables.
 */
PathtracingRenderer.prototype.initThree = function() 
{
	let _this = this;

	_this.canvas = document.getElementById('rendering-canvas');

	let context = _this.canvas.getContext('webgl2');

	window.addEventListener('wheel', _this.onMouseWheel, false);

	_this.canvas.addEventListener("click", function () {
		this.requestPointerLock = this.requestPointerLock || this.mozRequestPointerLock;
		this.requestPointerLock();
	}, false);

	let pointerlockChange = () => 
	{
		isPaused = !(document.pointerLockElement === _this.canvas || document.mozPointerLockElement === _this.canvas || document.webkitPointerLockElement === _this.canvas);
	};

	// Hook pointer lock state change events
	document.addEventListener('pointerlockchange', pointerlockChange, false);
	document.addEventListener('mozpointerlockchange', pointerlockChange, false);
	document.addEventListener('webkitpointerlockchange', pointerlockChange, false);

	window.addEventListener("click", function (event) {
		event.preventDefault();
	}, false);
	window.addEventListener("dblclick", function (event) {
		event.preventDefault();
	}, false);

	_this.renderer = new THREE.WebGLRenderer({canvas: _this.canvas, context: context});
	_this.renderer.autoClear = false;
	_this.renderer.setSize(_this.canvas.width, _this.canvas.height);

	//required by WebGL 2.0 for rendering to FLOAT textures
	_this.renderer.getContext().getExtension('EXT_color_buffer_float');

	_this.clock = new THREE.Clock();

	_this.pathTracingScene = new THREE.Scene();
	_this.screenTextureScene = new THREE.Scene();
	_this.screenOutputScene = new THREE.Scene();

	// quadCamera is simply the camera to help render the full screen quad (2 triangles),
	// hence the name.  It is an Orthographic camera that sits facing the view plane, which serves as
	// the window into our 3d world. This camera will not move or rotate for the duration of the app.
	_this.screenTextureScene.add(_this.quadCamera);
	_this.screenOutputScene.add(_this.quadCamera);

	

	_this.pathTracingRenderTarget = new THREE.WebGLRenderTarget(_this.canvas.width, _this.canvas.height, {
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		format: THREE.RGBAFormat,
		type: THREE.FloatType,
		depthBuffer: false,
		stencilBuffer: false
	});

	_this.screenTextureRenderTarget = new THREE.WebGLRenderTarget(_this.canvas.width, _this.canvas.height, {
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		format: THREE.RGBAFormat,
		type: THREE.FloatType,
		depthBuffer: false,
		stencilBuffer: false
	});
};

/**
 * Prepares model triangles to be sent to shader.
 */
PathtracingRenderer.prototype.prepareGeometryForPT = function() 
{
	let _this = this;	        

	let screenTextureGeometry = new THREE.PlaneBufferGeometry(2, 2);
	let screenTextureMaterial = new THREE.ShaderMaterial({
		uniforms: screenTextureShader.uniforms,
		vertexShader: screenTextureShader.vertexShader,
		fragmentShader: screenTextureShader.fragmentShader,
		depthWrite: false,
		depthTest: false
	});
	screenTextureMaterial.uniforms.tPathTracedImageTexture.value = _this.pathTracingRenderTarget.texture;

	let screenTextureMesh = new THREE.Mesh(screenTextureGeometry, screenTextureMaterial);
	_this.screenTextureScene.add(screenTextureMesh);

	let screenOutputGeometry = new THREE.PlaneBufferGeometry(2, 2);
	_this.screenOutputMaterial = new THREE.ShaderMaterial({
		uniforms: screenOutputShader.uniforms,
		vertexShader: screenOutputShader.vertexShader,
		fragmentShader: screenOutputShader.fragmentShader,
		depthWrite: false,
		depthTest: false
	});
	_this.screenOutputMaterial.uniforms.tPathTracedImageTexture.value = _this.pathTracingRenderTarget.texture;

	let screenOutputMesh = new THREE.Mesh(screenOutputGeometry, _this.screenOutputMaterial);
	_this.screenOutputScene.add(screenOutputMesh);

	let skycubeTextures = [];

	for (let i=0; i<options.SKY_CUBE_IMAGES.length; i++)
	{
		let text = new THREE.Texture(globals.scene.background.image[i]);
		text.needsUpdate = true;
		text.minFilter = THREE.NearestFilter;
		text.magFilter = THREE.NearestFilter;
		text.generateMipmaps = false;
		text.flipY = false;
		
		skycubeTextures.push(text);
	}
	
	_this.pathTracingDefines = 
	{
		// don't know why, but current glsl setting only allows max 16 textures per shader unit (tSkyCubeTextures + tAlbedoTextures = 10 already) 
		MAX_TEXTURES_IN_ARRAY: 6,
		MAX_BOUNCES: options.MAX_RECURSION_DEPTH,
		NUM_OF_SKYCUBE_TEXTURES: options.SKY_CUBE_IMAGES.length,
		MULTISAMPLING_FACTOR: options.MULTISAMPLING_FACTOR
	};
	_this.pathTracingUniforms = 
	{
		tSkyCubeTextures: { type: "t", value: skycubeTextures },			

		tPreviousTexture: { type: "t", value: _this.screenTextureRenderTarget.texture },
		tTriangleTexture: { type: "t", value: _this.triangleDataTexture },
		tAABBTexture: { type: "t", value: _this.aabbDataTexture },
		tAlbedoTextures: { type: "t", value: _this.uniqueMaterialTextures },		

		uTime: {type: "f", value: 0.0},
		uFrameCounter: {type: "f", value: 1.0},
		uULen: {type: "f", value: 1.0},
		uVLen: {type: "f", value: 1.0},
		uApertureSize: {type: "f", value: _this.apertureSize},
		uFocusDistance: {type: "f", value: _this.focusDistance},

		uSkyLightIntensity: {type: "f", value: _this.skyLightIntensity},
		uSunLightIntensity: {type: "f", value: _this.sunLightIntensity},
		uSunColor: {type: "v3", value: new THREE.Color().fromArray(_this.sunColor.map(x => x / 255))},
		uSunDirection: {type: "v3", value: new THREE.Vector3()},

		uResolution: {type: "v2", value: new THREE.Vector2()},
			
		uCameraMatrix: {type: "m4", value: new THREE.Matrix4()},
		uCameraIsMoving: { type: "b1", value: false },
		uCameraJustStartedMoving: {type: "b1", value: false}
	};
	
	let pathTracingMaterial = new THREE.ShaderMaterial({
		uniforms: _this.pathTracingUniforms,
		defines: _this.pathTracingDefines,
		vertexShader: globals.vertexShader,
		fragmentShader: globals.fragmentShader,
		depthTest: false,
		depthWrite: false
	});

	let pathTracingGeometry = new THREE.PlaneBufferGeometry(2, 2);
	let pathTracingMesh = new THREE.Mesh(pathTracingGeometry, pathTracingMaterial);
	_this.pathTracingScene.add(pathTracingMesh);

	// the following keeps the large scene ShaderMaterial quad right in front
	//   of the camera at all times. This is necessary because without it, the scene
	//   quad will fall out of view and get clipped when the camera rotates past 180 degrees.
	//_this.worldCamera.add(pathTracingMesh);

	let drawingBufferWidth = _this.renderer.getContext().drawingBufferWidth;
	let drawingBufferHeight = _this.renderer.getContext().drawingBufferHeight;

	_this.pathTracingUniforms.uResolution.value.x = drawingBufferWidth;
	_this.pathTracingUniforms.uResolution.value.y = drawingBufferHeight;

	_this.pathTracingRenderTarget.setSize(drawingBufferWidth, drawingBufferHeight);
	_this.screenTextureRenderTarget.setSize(drawingBufferWidth, drawingBufferHeight);

	_this.forceUpdate = true;
};

/**
 * Main animate logic.
 */
PathtracingRenderer.prototype.onRenderFrame = async function() 
{
	let _this = this;

	let elapsedTime = Date.nowInMiliseconds() - _this.stateStartTime;

	if (elapsedTime > options.CHECK_RENDERING_SERVICE_STATE)
	{
		// time check is needed because we don't want to slow down rendering too much with synchronization
		await _this.checkRenderingState();
		_this.stateStartTime = Date.nowInMiliseconds();
	}

	_this.animationFrameID = requestAnimationFrame(_this.onRenderFrame);

	let frameTime = _this.clock.getDelta();

	// reset flags
	_this.cameraIsMoving = false;

	if (_this.forceUpdate) 
	{
		_this.cameraIsMoving = true;
		_this.forceUpdate = false;
	}

	_this.cameraJustStartedMoving = false;

	// movement detected
	if (_this.oldYawRotation !== _this.cameraControlsYawObject.rotation.y || _this.oldPitchRotation !== _this.cameraControlsPitchObject.rotation.x)
		_this.cameraIsMoving = true;

	// save state for next frame
	_this.oldYawRotation = _this.cameraControlsYawObject.rotation.y;
	_this.oldPitchRotation = _this.cameraControlsPitchObject.rotation.x;


	// the following variables will be used to calculate rotations and directions from the camera
	// this gives us a vector in the direction that the camera is pointing,
	// which will be useful for moving the camera 'forward' and shooting projectiles in that direction
	let cameraDirectionVector = new THREE.Vector3();
	let cameraRightVector = new THREE.Vector3();
	let cameraUpVector = new THREE.Vector3();
	_this.controls.getDirection(cameraDirectionVector); //for moving where the camera is looking
	cameraDirectionVector.normalize();
	_this.controls.getRightVector(cameraRightVector); //for strafing the camera right and left
	_this.controls.getUpVector(cameraUpVector); //for moving camera up and down

	// the following gives us a rotation quaternion (4D vector), which will be useful for
	// rotating scene objects to match the camera's rotation
	let cameraWorldQuaternion = new THREE.Quaternion(); //for rotating scene objects to match camera's current rotation
	_this.worldCamera.getWorldQuaternion(cameraWorldQuaternion);

	let camFlightSpeed;

	if (_this.keyboard.modifiers && _this.keyboard.modifiers.shift)
		camFlightSpeed = _this.speed * 2;
	else
		camFlightSpeed = _this.speed;

	// allow flying camera
	if ((_this.keyboard.pressed('W')) && !(_this.keyboard.pressed('S'))) {

		_this.cameraControlsObject.position.add(cameraDirectionVector.multiplyScalar(camFlightSpeed * frameTime));
		_this.cameraIsMoving = true;
	}
	if ((_this.keyboard.pressed('S')) && !(_this.keyboard.pressed('W'))) {

		_this.cameraControlsObject.position.sub(cameraDirectionVector.multiplyScalar(camFlightSpeed * frameTime));
		_this.cameraIsMoving = true;
	}
	if ((_this.keyboard.pressed('A')) && !(_this.keyboard.pressed('D'))) {

		_this.cameraControlsObject.position.sub(cameraRightVector.multiplyScalar(camFlightSpeed * frameTime));
		_this.cameraIsMoving = true;
	}
	if ((_this.keyboard.pressed('D')) && !(_this.keyboard.pressed('A'))) {

		_this.cameraControlsObject.position.add(cameraRightVector.multiplyScalar(camFlightSpeed * frameTime));
		_this.cameraIsMoving = true;
	}
	if (_this.keyboard.pressed('E') && !_this.keyboard.pressed('Q')) {

		_this.cameraControlsObject.position.add(cameraUpVector.multiplyScalar(camFlightSpeed * frameTime));
		_this.cameraIsMoving = true;
	}
	if (_this.keyboard.pressed('Q') && !_this.keyboard.pressed('E')) {

		_this.cameraControlsObject.position.sub(cameraUpVector.multiplyScalar(camFlightSpeed * frameTime));
		_this.cameraIsMoving = true;
	}
	if ((_this.keyboard.pressed('up')) && !(_this.keyboard.pressed('down'))) {
		_this.focusDistance++;
		_this.focusDistanceChanged = true;
	}
	if ((_this.keyboard.pressed('down')) && !(_this.keyboard.pressed('up'))) {
		if (_this.focusDistance > _this.minFocusDistance) {
			_this.focusDistance--;
			_this.focusDistanceChanged = true;
		}
	}
	if (_this.keyboard.pressed('right') && !_this.keyboard.pressed('left')) {
		_this.increaseApertureSize();
	}
	if (_this.keyboard.pressed('left') && !_this.keyboard.pressed('right')) {
		_this.decreaseApertureSize()
	}

	if (_this.fovChanged || _this.apertureSizeChanged || _this.focusDistanceChanged) {
		_this.cameraIsMoving = true;
	}

	if (_this.fovChanged) {
		let fovScale = _this.worldCamera.fov * 0.5 * (Math.PI / 180.0);
		_this.pathTracingUniforms.uVLen.value = Math.tan(fovScale);
		_this.pathTracingUniforms.uULen.value = _this.pathTracingUniforms.uVLen.value * _this.worldCamera.aspect;
		_this.fovChanged = false;
	}

	if (_this.apertureSizeChanged) {
		_this.pathTracingUniforms.uApertureSize.value = _this.apertureSize;
		_this.apertureSizeChanged = false;
	}

	if (_this.focusDistanceChanged) {
		_this.pathTracingUniforms.uFocusDistance.value = _this.focusDistance;
		_this.focusDistanceChanged = false;
	}

	if (_this.cameraIsMoving) 
	{
		_this.sampleCounter = 1.0;
		_this.frameCounter += 1.0;

		if (!_this.cameraRecentlyMoving) 
		{
			_this.cameraJustStartedMoving = true;
			_this.cameraRecentlyMoving = true;
		}
	}

	if (!_this.cameraIsMoving) 
	{
		//_this.sampleCounter = 1.0; // for continuous updating of image
		_this.sampleCounter += 1.0; // for progressive refinement of image
		_this.frameCounter += 1.0;

		if (_this.cameraRecentlyMoving)
			_this.frameCounter = 1.0;

		_this.cameraRecentlyMoving = false;
	}

	let sunDirection = new THREE.Vector3(Math.cos(_this.sunAngle) * 1.2, Math.sin(_this.sunAngle), -Math.cos(_this.sunAngle) * 3.0);
	sunDirection.normalize();

	_this.pathTracingUniforms.uSunDirection.value.copy(sunDirection);
	_this.pathTracingUniforms.uCameraIsMoving.value = _this.cameraIsMoving;
	_this.pathTracingUniforms.uCameraJustStartedMoving.value = _this.cameraJustStartedMoving;
	_this.pathTracingUniforms.uFrameCounter.value = _this.frameCounter;

	// CAMERA
	_this.cameraControlsObject.updateMatrixWorld(true);
	_this.pathTracingUniforms.uCameraMatrix.value.copy(_this.worldCamera.matrixWorld);
	_this.screenOutputMaterial.uniforms.uOneOverSampleCounter.value = 1.0 / _this.sampleCounter;
	

	// RENDERING in 3 steps

	// STEP 1
	// Perform PathTracing and Render(save) into pathTracingRenderTarget, a full-screen texture.
	// Read previous screenTextureRenderTarget(via texelFetch inside fragment shader) to use as a new starting point to blend with
	_this.renderer.setRenderTarget(_this.pathTracingRenderTarget);
	_this.renderer.render(_this.pathTracingScene, _this.worldCamera);

	// STEP 2
	// Render(copy) the pathTracingScene output(pathTracingRenderTarget above) into screenTextureRenderTarget.
	// This will be used as a new starting point for Step 1 above (essentially creating ping-pong buffers)
	_this.renderer.setRenderTarget(_this.screenTextureRenderTarget);
	_this.renderer.render(_this.screenTextureScene, _this.quadCamera);

	// STEP 3
	// Render full screen quad with generated pathTracingRenderTarget in STEP 1 above.
	// After the image is gamma-corrected, it will be shown on the screen as the final accumulated output
	_this.renderer.setRenderTarget(null);
	_this.renderer.render(_this.screenOutputScene, _this.quadCamera);
};


/**
 * TODO: remove all these functions because they are no longer needed.
 */
PathtracingRenderer.prototype.onMouseWheel = function(event) 
{
	let _this = this;

	event.preventDefault();
	event.stopPropagation();

	if (event.deltaY > 0)
		_this.increaseFov();
	else if (event.deltaY < 0)
		_this.decreaseFov();
};
PathtracingRenderer.prototype.increaseFov = function() 
{
	let _this = this;

	if (_this.worldCamera.fov < _this.maxFov) 
	{
		_this.worldCamera.fov++;
		_this.fovChanged = true;
	}
};
PathtracingRenderer.prototype.decreaseFov = function() 
{
	let _this = this;

	if (_this.worldCamera.fov > _this.minFov) 
	{
		_this.worldCamera.fov--;
		_this.fovChanged = true;
	}
};
PathtracingRenderer.prototype.increaseApertureSize = function() 
{
	if (_this.apertureSize < _this.maxApertureSize) 
	{
		_this.apertureSize += 0.1;
		_this.apertureSizeChanged = true;
	}
};
PathtracingRenderer.prototype.decreaseApertureSize = function() 
{
	let _this = this;

	if (_this.apertureSize > _this.minApertureSize) 
	{
		_this.apertureSize -= 0.1;
		_this.apertureSizeChanged = true;
	}
};


/**
 * Disposes objects.
 */
PathtracingRenderer.prototype.dispose = function()
{
	let _this = this;

	new Warning.NotImplemented();

	_this.stopRendering();

	_this.pathTracingUniforms = null;
};