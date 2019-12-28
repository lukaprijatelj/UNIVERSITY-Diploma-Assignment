
var isPaused = true;
const PI_2 = Math.PI / 2; // used in animation method

var PathtracingRenderer = function()
{
	console.log('[PathtracingRenderer] Initializing renderer');
	
	// Three.js related variables
	let container;
	let canvas;
	let stats;
	let controls;
	let renderer;
	let clock;

	// PathTracing scene variables
	let pathTracingScene;
	let screenTextureScene;
	let screenOutputScene;
	let pathTracingUniforms;
	let pathTracingDefines;
	let screenOutputMaterial;
	let pathTracingRenderTarget;

	// Camera variables
	let quadCamera;
	let worldCamera = globals.camera;

	// HDR image variables
	var hdrExposure = 1.0;

	// Environment variables
	var skyLightIntensity = 1;
	var sunLightIntensity = 1;
	var sunColor = [255, 250, 235];
	var skyLightIntensityChanged = false;
	var sunLightIntensityChanged = false;
	var sunColorChanged = false;
	var cameraControlsObject; //for positioning and moving the camera itself
	var cameraControlsYawObject; //allows access to control camera's left/right movements through mobile input
	var cameraControlsPitchObject; //allows access to control camera's up/down movements through mobile input

	// Camera setting variables
	var apertureSize = 0.0;
	var focusDistance = 100.0;
	var speed = 60;

	// Rendering variables
	var sunAngle = Math.PI / 2.5;
	var sampleCounter = 1.0;
	var frameCounter = 1.0;
	var forceUpdate = false;
	var cameraIsMoving = false;
	var cameraJustStartedMoving = false;
	var cameraRecentlyMoving = false;

	// Input variables

	var oldYawRotation = 0;
	var oldPitchRotation = 0;
	var oldDeltaX = 0;
	var oldDeltaY = 0;
	var newDeltaX = 0;
	var newDeltaY = 0;
	var mouseControl = true;
	var keyboard = new THREEx.KeyboardState();
	var mobileJoystickControls = null;

	// Mobile Input variables
	var mobileControlsMoveX = 0;
	var mobileControlsMoveY = 0;
	var oldPinchWidthX = 0;
	var oldPinchWidthY = 0;
	var pinchDeltaX = 0;
	var pinchDeltaY = 0;
	var stillFlagX = true;
	var stillFlagY = true;

	// Geometry variables
	let triangleMaterialMarkers = [];
	let pathTracingMaterialList = [];
	let uniqueMaterialTextures = [];
	var aabb_array;

	// Menu variables
	var gui;
	var lightingSettingsFolder;
	var cameraSettingsFolder;
	const minFov = 1;
	const maxFov = 150;
	const minFocusDistance = 1;
	const minApertureSize = 0;
	const maxApertureSize = 20;
	var fovChanged = false;
	var focusDistanceChanged = false;
	var apertureSizeChanged = false;

	var meshList = [];
	var geoList = [];
	var triangleDataTexture;
	var aabb_array;
	var aabbDataTexture;
	var totalWork;
	var vp0 = new THREE.Vector3();
	var vp1 = new THREE.Vector3();
	var vp2 = new THREE.Vector3();
	var vn0 = new THREE.Vector3();
	var vn1 = new THREE.Vector3();
	var vn2 = new THREE.Vector3();
	var vt0 = new THREE.Vector2();
	var vt1 = new THREE.Vector2();
	var vt2 = new THREE.Vector2();

	var flattenedMeshList;

	var EPS_intersect;
	var sceneIsDynamic = true;
	var camFlightSpeed = 60;
	var GLTF_Model_Geometry, GLTF_Model_Material, GLTF_Model_Mesh;
	var albedoMap, emissiveMap, metallicRoughnessMap, normalMap;
	var animationTimer = 0.0;
	var animationAxis = new THREE.Vector3(0, 0, 1);
	var modelMesh;
	//var modelScale = 1.0;
	//var modelPositionOffset = new THREE.Vector3();
	var total_number_of_triangles = 0;
	var triangle_array;

	// Constants

	var fileLoader = new THREE.FileLoader();

	let modelScale = 1.0;
	let modelRotationY = Math.PI; // in radians
	let modelPositionOffset = new THREE.Vector3(0, 0, 0);

	function filePromiseLoader(url, onProgress) {
		return new Promise((resolve, reject) => {
			fileLoader.load(url, resolve, onProgress, reject);
		});
	}

	// init Three.js
	initThree();

	// init models
	loadModels();

	function onMouseWheel(event) {

		event.preventDefault();
		event.stopPropagation();

		if (event.deltaY > 0)
			increaseFov();
		else if (event.deltaY < 0)
			decreaseFov();

	}

	function increaseFov() {
		if (worldCamera.fov < maxFov) {
			worldCamera.fov++;
			fovChanged = true;
		}
	}

	function decreaseFov() {
		if (worldCamera.fov > minFov) {
			worldCamera.fov--;
			fovChanged = true;
		}
	}

	function increaseApertureSize() {
		if (apertureSize < maxApertureSize) {
			apertureSize += 0.1;
			apertureSizeChanged = true;
		}
	}

	function decreaseApertureSize() {
		if (apertureSize > minApertureSize) {
			apertureSize -= 0.1;
			apertureSizeChanged = true;
		}
	}

	function MaterialObject(material) {
		// a list of material types and their corresponding numbers are found in the 'pathTracingCommon.js' file
		this.type = material.opacity < 1 ? 2 : 1; // default is 1 = diffuse opaque, 2 = glossy transparent, 4 = glossy opaque;
		this.albedoTextureID = -1; // which diffuse map to use for model's color, '-1' = no textures are used
		this.color = material.color ? material.color.copy(material.color) : new THREE.Color(1.0, 1.0, 1.0); // takes on different meanings, depending on 'type' above
		this.roughness = material.roughness || 0.0; // 0.0 to 1.0 range, perfectly smooth to extremely rough
		this.metalness = material.metalness || 0.0; // 0.0 to 1.0 range, usually either 0 or 1, either non-metal or metal
		this.opacity = material.opacity || 1.0; // 0.0 to 1.0 range, fully transparent to fully opaque
	
		// this seems to be unused
		// this.refractiveIndex = this.type === 4 ? 1.0 : 1.5; // 1.0=air, 1.33=water, 1.4=clearCoat, 1.5=glass, etc.
		pathTracingMaterialList.push(this);
	}

	async function loadModels() 
	{
		pathTracingMaterialList = [];
		triangleMaterialMarkers = [];
		uniqueMaterialTextures = [];

		let meshGroup = globals.scene;					
				
		let matrixStack = [];
		let parent;
		matrixStack.push(new THREE.Matrix4());

		meshList = [];

		meshGroup.traverse(function (child) 
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
						new MaterialObject(child.material[i]);
				} 
				else 
				{
					new MaterialObject(child.material);
				}
	
				if (child.geometry.groups.length > 0) 
				{
					for (let i = 0; i < child.geometry.groups.length; i++) 
					{
						triangleMaterialMarkers.push((triangleMaterialMarkers.length > 0 ? triangleMaterialMarkers[triangleMaterialMarkers.length - 1] : 0) + child.geometry.groups[i].count / 3);
					}
				} 
				else 
				{
					triangleMaterialMarkers.push((triangleMaterialMarkers.length > 0 ? triangleMaterialMarkers[triangleMaterialMarkers.length - 1] : 0) + child.geometry.index.count / 3);
				}
	
				meshList.push(child);
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

		flattenedMeshList = [].concat.apply([], meshList);
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

		// Prepare geometry for path tracing
		prepareGeometryForPT(flattenedMeshList, pathTracingMaterialList, triangleMaterialMarkers);
	}

		
	// called automatically from within initTHREEjs() function
	function initSceneData() 
	{
		// scene/demo-specific three.js objects setup goes here
		EPS_intersect = mouseControl ? 0.01 : 1.0; // less precision on mobile

		var meshList = flattenedMeshList;

		geoList = [];

		for (let i = 0; i < meshList.length; i++)
		{
			geoList.push(meshList[i].geometry);
		}
			

		// Merge geometry from all models into one new mesh
		modelMesh = new THREE.Mesh(THREE.BufferGeometryUtils.mergeBufferGeometries(geoList));

		if (modelMesh.geometry.index)
		{
			modelMesh.geometry = modelMesh.geometry.toNonIndexed(); // why do we need NonIndexed geometry?
		}
			
		total_number_of_triangles = modelMesh.geometry.attributes.position.array.length / 9;

		// Gather all textures from materials
		for (let i = 0; i < meshList.length; i++) 
		{
			if (meshList[i].material.length > 0) 
			{
				for (let j = 0; j < meshList[i].material.length; j++) 
				{
					if (meshList[i].material[j].map)
						uniqueMaterialTextures.push(meshList[i].material[j].map);
				}
			} else if (meshList[i].material.map) 
			{
				uniqueMaterialTextures.push(meshList[i].material.map);
			}
		}
	
		// Remove duplicate entries
		uniqueMaterialTextures = Array.from(new Set(uniqueMaterialTextures));
	
		// Assign textures to the path tracing material with the correct id
		for (let i = 0; i < meshList.length; i++) 
		{
			if (meshList[i].material.length > 0) 
			{
				for (let j = 0; j < meshList[i].material.length; j++) 
				{
					if (meshList[i].material[j].map) 
					{
						for (let k = 0; k < uniqueMaterialTextures.length; k++) 
						{
							if (meshList[i].material[j].map.image.src === uniqueMaterialTextures[k].image.src) 
							{
								// albedo map
								pathTracingMaterialList[i].albedoTextureID = k;
							}
						}
					}
				}
			} 
			else if (meshList[i].material.map) 
			{
				for (let j = 0; j < uniqueMaterialTextures.length; j++) 
				{
					if (meshList[i].material.map.image.src === uniqueMaterialTextures[j].image.src) 
					{
						// albedo map
						pathTracingMaterialList[i].albedoTextureID = j;
					}
				}
			}
		}

		console.log("Triangle count:" + total_number_of_triangles);

		// todo: luka not sure why rotation is needed
		//modelMesh.geometry.rotateX(modelRotationY / 2);

		totalWork = new Uint32Array(total_number_of_triangles);

		// Initialize triangle and aabb arrays where 2048 = width and height of texture and 4 are the r, g, b and a components
		triangle_array = new Float32Array(2048 * 2048 * 4);
		aabb_array = new Float32Array(2048 * 2048 * 4);

		var triangle_b_box_min = new THREE.Vector3();
		var triangle_b_box_max = new THREE.Vector3();
		var triangle_b_box_centroid = new THREE.Vector3();

		var vpa = new Float32Array(modelMesh.geometry.attributes.position.array);

		if (modelMesh.geometry.attributes.normal === undefined)
			modelMesh.geometry.computeVertexNormals();

		var vna = new Float32Array(modelMesh.geometry.attributes.normal.array);

		var modelHasUVs = false;

		if (modelMesh.geometry.attributes.uv !== undefined) 
		{
			var vta = new Float32Array(modelMesh.geometry.attributes.uv.array);
			modelHasUVs = true;
		}

		let materialNumber = 0;

		for (let i = 0; i < total_number_of_triangles; i++) 
		{
			triangle_b_box_min.set(Infinity, Infinity, Infinity);
			triangle_b_box_max.set(-Infinity, -Infinity, -Infinity);

			let vt0 = new THREE.Vector3();
			let vt1 = new THREE.Vector3();
			let vt2 = new THREE.Vector3();
			// record vertex texture coordinates (UVs)

			if (modelHasUVs) 
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

			vp0.multiplyScalar(modelScale);
			vp1.multiplyScalar(modelScale);
			vp2.multiplyScalar(modelScale);

			vp0.add(modelPositionOffset);
			vp1.add(modelPositionOffset);
			vp2.add(modelPositionOffset);

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

			if (i >= triangleMaterialMarkers[materialNumber])
				materialNumber++;

			//slot 6
			triangle_array[32 * i + 24] = pathTracingMaterialList[materialNumber].type; // r or x
			triangle_array[32 * i + 25] = pathTracingMaterialList[materialNumber].color.r; // g or y
			triangle_array[32 * i + 26] = pathTracingMaterialList[materialNumber].color.g; // b or z
			triangle_array[32 * i + 27] = pathTracingMaterialList[materialNumber].color.b; // a or w

			//slot 7
			triangle_array[32 * i + 28] = pathTracingMaterialList[materialNumber].albedoTextureID; // r or x
			triangle_array[32 * i + 29] = pathTracingMaterialList[materialNumber].opacity; // g or y
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

		} // end for (let i = 0; i < total_number_of_triangles; i++)

		// Build the BVH acceleration structure, which places a bounding box ('root' of the tree) around all of the
		// triangles of the entire mesh, then subdivides each box into 2 smaller boxes.  It continues until it reaches 1 triangle,
		// which it then designates as a 'leaf'
		BVH_Build_Iterative(totalWork, aabb_array);
		//console.log(buildnodes);

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

		triangleDataTexture = new THREE.DataTexture(triangle_array,
			2048,
			2048,
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
		triangleDataTexture.flipY = false;
		triangleDataTexture.generateMipmaps = false;
		triangleDataTexture.needsUpdate = true;

		aabbDataTexture = new THREE.DataTexture(aabb_array,
			2048,
			2048,
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
		aabbDataTexture.flipY = false;
		aabbDataTexture.generateMipmaps = false;
		aabbDataTexture.needsUpdate = true;
	} // end function initSceneData()

	function initThree() 
	{
		console.time("InitThree");

		canvas = document.getElementById('rendering-canvas');
		let context = canvas.getContext('webgl2');

		if (mouseControl) 
		{
			window.addEventListener('wheel', onMouseWheel, false);

			canvas.addEventListener("click", function () {
				this.requestPointerLock = this.requestPointerLock || this.mozRequestPointerLock;
				this.requestPointerLock();
			}, false);

			var pointerlockChange = () => {
				isPaused = !(document.pointerLockElement === canvas || document.mozPointerLockElement === canvas || document.webkitPointerLockElement === canvas);
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
		}

		renderer = new THREE.WebGLRenderer({canvas: canvas, context: context});
		renderer.autoClear = false;
		renderer.setSize(canvas.width, canvas.height);
		//required by WebGL 2.0 for rendering to FLOAT textures
		renderer.getContext().getExtension('EXT_color_buffer_float');
		//renderer.toneMappingExposure = hdrExposure;

		clock = new THREE.Clock();

		pathTracingScene = new THREE.Scene();
		screenTextureScene = new THREE.Scene();
		screenOutputScene = new THREE.Scene();

		// quadCamera is simply the camera to help render the full screen quad (2 triangles),
		// hence the name.  It is an Orthographic camera that sits facing the view plane, which serves as
		// the window into our 3d world. This camera will not move or rotate for the duration of the app.
		quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
		screenTextureScene.add(quadCamera);
		screenOutputScene.add(quadCamera);

		// worldCamera is the dynamic camera 3d object that will be positioned, oriented and
		// constantly updated inside the 3d scene.  Its view will ultimately get passed back to the
		// stationary quadCamera, which renders the scene to a fullscreen quad (made up of 2 large triangles).
		//worldCamera = new THREE.PerspectiveCamera(50, canvas.width / canvas.height, 1, 1000);
		//pathTracingScene.add(worldCamera);

		controls = new FirstPersonCameraControls(worldCamera);
		cameraControlsObject = controls.getObject();
		cameraControlsYawObject = controls.getYawObject();
		cameraControlsPitchObject = controls.getPitchObject();

		// TODO: why is this
		pathTracingScene.add(cameraControlsObject);

		oldYawRotation = cameraControlsYawObject.rotation.y;
		oldPitchRotation = cameraControlsPitchObject.rotation.x;

		// now that we moved and rotated the camera, the following line force-updates the camera's matrix,
		// and prevents rendering the very first frame in the old default camera position/orientation
		cameraControlsObject.updateMatrixWorld(true);

		pathTracingRenderTarget = new THREE.WebGLRenderTarget(canvas.width, canvas.height, {
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
			depthBuffer: false,
			stencilBuffer: false
		});

		screenTextureRenderTarget = new THREE.WebGLRenderTarget(canvas.width, canvas.height, {
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
			depthBuffer: false,
			stencilBuffer: false
		});

		console.timeEnd("InitThree");
	}

	async function prepareGeometryForPT(meshList, pathTracingMaterialList, triangleMaterialMarkers) 
	{
		initSceneData();        

		pathTracingDefines = 
		{
			//N_ALBEDO_MAPS: uniqueMaterialTextures.length
		};

		let screenTextureGeometry = new THREE.PlaneBufferGeometry(2, 2);
		let screenTextureMaterial = new THREE.ShaderMaterial({
			uniforms: screenTextureShader.uniforms,
			vertexShader: screenTextureShader.vertexShader,
			fragmentShader: screenTextureShader.fragmentShader,
			depthWrite: false,
			depthTest: false
		});
		screenTextureMaterial.uniforms.tPathTracedImageTexture.value = pathTracingRenderTarget.texture;

		let screenTextureMesh = new THREE.Mesh(screenTextureGeometry, screenTextureMaterial);
		screenTextureScene.add(screenTextureMesh);

		let screenOutputGeometry = new THREE.PlaneBufferGeometry(2, 2);
		screenOutputMaterial = new THREE.ShaderMaterial({
			uniforms: screenOutputShader.uniforms,
			vertexShader: screenOutputShader.vertexShader,
			fragmentShader: screenOutputShader.fragmentShader,
			depthWrite: false,
			depthTest: false
		});
		screenOutputMaterial.uniforms.tPathTracedImageTexture.value = pathTracingRenderTarget.texture;

		let screenOutputMesh = new THREE.Mesh(screenOutputGeometry, screenOutputMaterial);
		screenOutputScene.add(screenOutputMesh);

		// load vertex and fragment shader files that are used in the pathTracing material, mesh and scene
		let vertexShader = await filePromiseLoader('scripts/path-tracing/shaders/vertex.glsl');
		let fragmentShader = await filePromiseLoader('scripts/path-tracing/shaders/Gltf_Viewer.glsl');
		
	
		let hdrLoader = new THREE.TextureLoader();
		var skycubeTextures = [];
		var promises = [];

		for (var i=0; i<options.SKY_CUBE_IMAGES.length; i++)
		{
			promises.push(new Promise((resolve, reject) => 
			{
				skycubeTextures.push(hdrLoader.load( options.SKY_CUBE_FILEPATH + options.SKY_CUBE_IMAGES[i], function(texture, textureData) 
				{
					texture.encoding = THREE.RGBEEncoding;
					texture.minFilter = THREE.NearestFilter;
					texture.magFilter = THREE.NearestFilter;
					texture.flipY = true;
					resolve();
				}));
			}));
		}

		await Promise.all(promises);
		

		/*pathTracingUniforms = 
		{
			MAX_RECURSION_DEPTH: {type: "i", value: options.MAX_RECURSION_DEPTH},

			//tPreviousTexture: {type: "t", value: screenTextureRenderTarget.texture},
			//tTriangleTexture: {type: "t", value: triangleDataTexture},
			//tAABBTexture: {type: "t", value: aabbDataTexture},
			//tAlbedoTextures: {type: "t", value: uniqueMaterialTextures},
			//t_PerlinNoise: {type: "t", value: PerlinNoiseTexture},
			tHDRTexture: { type: "t", value: hdrTexture },

			uCameraIsMoving: {type: "b1", value: false},
			uCameraJustStartedMoving: {type: "b1", value: false},

			uTime: {type: "f", value: 0.0},
			uFrameCounter: {type: "f", value: 1.0},
			uULen: {type: "f", value: 1.0},
			uVLen: {type: "f", value: 1.0},
			uApertureSize: {type: "f", value: apertureSize},
			uFocusDistance: {type: "f", value: focusDistance},
			uSkyLightIntensity: {type: "f", value: skyLightIntensity},
			uSunLightIntensity: {type: "f", value: sunLightIntensity},
			uSunColor: {type: "v3", value: new THREE.Color().fromArray(sunColor.map(x => x / 255))},

			uResolution: {type: "v2", value: new THREE.Vector2()},

			uSunDirection: {type: "v3", value: new THREE.Vector3()},
			uCameraMatrix: {type: "m4", value: new THREE.Matrix4()},

			tPreviousTexture: { type: "t", value: screenTextureRenderTarget.texture },
			tTriangleTexture: { type: "t", value: triangleDataTexture },
			tAABBTexture: { type: "t", value: aabbDataTexture },
			tAlbedoMap: { type: "t", value: albedoMap },
			tEmissiveMap: { type: "t", value: emissiveMap },
			tMetallicRoughnessMap: { type: "t", value: metallicRoughnessMap },
			tNormalMap: { type: "t", value: normalMap },

			uEPS_intersect: { type: "f", value: EPS_intersect },

			uRandomVector: { type: "v3", value: new THREE.Vector3() },

			uGLTF_Model_Position: { type: "v3", value: new THREE.Vector3() },
			uGLTF_Model_InvMatrix: { type: "m4", value: new THREE.Matrix4() },
			uGLTF_Model_NormalMatrix: { type: "m3", value: new THREE.Matrix3() }
		};
		*/

		pathTracingUniforms = 
		{
			tPreviousTexture: { type: "t", value: screenTextureRenderTarget.texture },
			tTriangleTexture: { type: "t", value: triangleDataTexture },
			tAABBTexture: { type: "t", value: aabbDataTexture },
			tAlbedoTextures: { type: "t", value: uniqueMaterialTextures },
			//t_PerlinNoise: {type: "t", value: PerlinNoiseTexture},
			//tHDRTexture: { type: "t", value: hdrTexture },
			tSkyCubeTextures: { type: "t", value: skycubeTextures },
	
			uCameraIsMoving: { type: "b1", value: false },
			uCameraJustStartedMoving: {type: "b1", value: false},
	
			uTime: {type: "f", value: 0.0},
			uFrameCounter: {type: "f", value: 1.0},
			uULen: {type: "f", value: 1.0},
			uVLen: {type: "f", value: 1.0},
			uApertureSize: {type: "f", value: apertureSize},
			uFocusDistance: {type: "f", value: focusDistance},
			uSkyLightIntensity: {type: "f", value: skyLightIntensity},
			uSunLightIntensity: {type: "f", value: sunLightIntensity},
			uSunColor: {type: "v3", value: new THREE.Color().fromArray(sunColor.map(x => x / 255))},
	
			uResolution: {type: "v2", value: new THREE.Vector2()},
	
			uSunDirection: {type: "v3", value: new THREE.Vector3()},
			uCameraMatrix: {type: "m4", value: new THREE.Matrix4()}
		};

		let pathTracingMaterial = new THREE.ShaderMaterial({
			uniforms: pathTracingUniforms,
			defines: pathTracingDefines,
			vertexShader: vertexShader,
			fragmentShader: fragmentShader,
			depthTest: false,
			depthWrite: false
		});

		let pathTracingGeometry = new THREE.PlaneBufferGeometry(2, 2);
		let pathTracingMesh = new THREE.Mesh(pathTracingGeometry, pathTracingMaterial);
		pathTracingScene.add(pathTracingMesh);

		// the following keeps the large scene ShaderMaterial quad right in front
		//   of the camera at all times. This is necessary because without it, the scene
		//   quad will fall out of view and get clipped when the camera rotates past 180 degrees.
		//worldCamera.add(pathTracingMesh);

		let drawingBufferWidth = renderer.getContext().drawingBufferWidth;
		let drawingBufferHeight = renderer.getContext().drawingBufferHeight;

		pathTracingUniforms.uResolution.value.x = drawingBufferWidth;
		pathTracingUniforms.uResolution.value.y = drawingBufferHeight;

		pathTracingRenderTarget.setSize(drawingBufferWidth, drawingBufferHeight);
		screenTextureRenderTarget.setSize(drawingBufferWidth, drawingBufferHeight);

		worldCamera.aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;
		worldCamera.updateProjectionMatrix();

		// the following scales all scene objects by the worldCamera's field of view,
		// taking into account the screen aspect ratio and multiplying the uniform uULen,
		// the x-coordinate, by this ratio
		var fovScale = worldCamera.fov * 0.5 * (Math.PI / 180.0);
		pathTracingUniforms.uVLen.value = Math.tan(fovScale);
		pathTracingUniforms.uULen.value = pathTracingUniforms.uVLen.value * worldCamera.aspect;

		forceUpdate = true;

		// everything is set up, now we can start animating
		animate();
	} 

	function animate() 
	{
		requestAnimationFrame(animate);

		let frameTime = clock.getDelta();

		//elapsedTime = clock.getElapsedTime() % 1000;

		// reset flags
		cameraIsMoving = false;

		if (forceUpdate) 
		{
			cameraIsMoving = true;
			forceUpdate = false;
		}

		cameraJustStartedMoving = false;

		// check user controls
		if (mouseControl) 
		{
			// movement detected
			if (oldYawRotation !== cameraControlsYawObject.rotation.y || oldPitchRotation !== cameraControlsPitchObject.rotation.x)
				cameraIsMoving = true;

			// save state for next frame
			oldYawRotation = cameraControlsYawObject.rotation.y;
			oldPitchRotation = cameraControlsPitchObject.rotation.x;

		} // end if (mouseControl)

		// if not playing on desktop, get input from the mobileJoystickControls
	

		// the following variables will be used to calculate rotations and directions from the camera
		// this gives us a vector in the direction that the camera is pointing,
		// which will be useful for moving the camera 'forward' and shooting projectiles in that direction
		let cameraDirectionVector = new THREE.Vector3();
		let cameraRightVector = new THREE.Vector3();
		let cameraUpVector = new THREE.Vector3();
		controls.getDirection(cameraDirectionVector); //for moving where the camera is looking
		cameraDirectionVector.normalize();
		controls.getRightVector(cameraRightVector); //for strafing the camera right and left
		controls.getUpVector(cameraUpVector); //for moving camera up and down

		// the following gives us a rotation quaternion (4D vector), which will be useful for
		// rotating scene objects to match the camera's rotation
		let cameraWorldQuaternion = new THREE.Quaternion(); //for rotating scene objects to match camera's current rotation
		worldCamera.getWorldQuaternion(cameraWorldQuaternion);

		var camFlightSpeed;
		if (keyboard.modifiers && keyboard.modifiers.shift)
			camFlightSpeed = speed * 2;
		else
			camFlightSpeed = speed;

		// allow flying camera
		if ((keyboard.pressed('W')) && !(keyboard.pressed('S'))) {

			cameraControlsObject.position.add(cameraDirectionVector.multiplyScalar(camFlightSpeed * frameTime));
			cameraIsMoving = true;
		}
		if ((keyboard.pressed('S')) && !(keyboard.pressed('W'))) {

			cameraControlsObject.position.sub(cameraDirectionVector.multiplyScalar(camFlightSpeed * frameTime));
			cameraIsMoving = true;
		}
		if ((keyboard.pressed('A')) && !(keyboard.pressed('D'))) {

			cameraControlsObject.position.sub(cameraRightVector.multiplyScalar(camFlightSpeed * frameTime));
			cameraIsMoving = true;
		}
		if ((keyboard.pressed('D')) && !(keyboard.pressed('A'))) {

			cameraControlsObject.position.add(cameraRightVector.multiplyScalar(camFlightSpeed * frameTime));
			cameraIsMoving = true;
		}
		if (keyboard.pressed('E') && !keyboard.pressed('Q')) {

			cameraControlsObject.position.add(cameraUpVector.multiplyScalar(camFlightSpeed * frameTime));
			cameraIsMoving = true;
		}
		if (keyboard.pressed('Q') && !keyboard.pressed('E')) {

			cameraControlsObject.position.sub(cameraUpVector.multiplyScalar(camFlightSpeed * frameTime));
			cameraIsMoving = true;
		}
		if ((keyboard.pressed('up')) && !(keyboard.pressed('down'))) {
			focusDistance++;
			focusDistanceChanged = true;
		}
		if ((keyboard.pressed('down')) && !(keyboard.pressed('up'))) {
			if (focusDistance > minFocusDistance) {
				focusDistance--;
				focusDistanceChanged = true;
			}
		}
		if (keyboard.pressed('right') && !keyboard.pressed('left')) {
			increaseApertureSize();
		}
		if (keyboard.pressed('left') && !keyboard.pressed('right')) {
			decreaseApertureSize()
		}

		if (fovChanged || apertureSizeChanged || focusDistanceChanged) {
			cameraIsMoving = true;

			// Iterate over all GUI controllers
		/*	for (var i in cameraSettingsFolder.__controllers)
				cameraSettingsFolder.__controllers[i].updateDisplay();*/
		}

		if (fovChanged) {
			var fovScale = worldCamera.fov * 0.5 * (Math.PI / 180.0);
			pathTracingUniforms.uVLen.value = Math.tan(fovScale);
			pathTracingUniforms.uULen.value = pathTracingUniforms.uVLen.value * worldCamera.aspect;
			fovChanged = false;
		}

		if (apertureSizeChanged) {
			pathTracingUniforms.uApertureSize.value = apertureSize;
			apertureSizeChanged = false;
		}

		if (focusDistanceChanged) {
			pathTracingUniforms.uFocusDistance.value = focusDistance;
			focusDistanceChanged = false;
		}

		if (skyLightIntensityChanged) {
			pathTracingUniforms.uSkyLightIntensity.value = skyLightIntensity;
			skyLightIntensityChanged = false;
		}

		if (sunLightIntensityChanged) {
			pathTracingUniforms.uSunLightIntensity.value = sunLightIntensity;
			sunLightIntensityChanged = false;
		}

		if (sunColorChanged) {
			pathTracingUniforms.uSunColor.value = new THREE.Color().fromArray(sunColor.map(x => x / 255));
			sunColorChanged = false;
		}

		if (cameraIsMoving) {

			sampleCounter = 1.0;
			frameCounter += 1.0;

			if (!cameraRecentlyMoving) {
				cameraJustStartedMoving = true;
				cameraRecentlyMoving = true;
			}

		}

		if (!cameraIsMoving) 
		{
			//sampleCounter = 1.0; // for continuous updating of image
			sampleCounter += 1.0; // for progressive refinement of image
			frameCounter += 1.0;
			if (cameraRecentlyMoving)
				frameCounter = 1.0;

			cameraRecentlyMoving = false;

		}

		

		//sunAngle = (elapsedTime * 0.03) % Math.PI;
		// sunAngle = Math.PI / 2.5;
		let sunDirection = new THREE.Vector3(Math.cos(sunAngle) * 1.2, Math.sin(sunAngle), -Math.cos(sunAngle) * 3.0);
		sunDirection.normalize();

		pathTracingUniforms.uSunDirection.value.copy(sunDirection);
		//pathTracingUniforms.uTime.value = elapsedTime;
		pathTracingUniforms.uCameraIsMoving.value = cameraIsMoving;
		pathTracingUniforms.uCameraJustStartedMoving.value = cameraJustStartedMoving;
		pathTracingUniforms.uFrameCounter.value = frameCounter;

		// CAMERA
		//cameraControlsObject.updateMatrixWorld(true);
		pathTracingUniforms.uCameraMatrix.value.copy(worldCamera.matrixWorld);
		screenOutputMaterial.uniforms.uOneOverSampleCounter.value = 1.0 / sampleCounter;
		

		//samplesSpanEl.innerHTML = `Samples: ${sampleCounter}`;

		// RENDERING in 3 steps

		// STEP 1
		// Perform PathTracing and Render(save) into pathTracingRenderTarget, a full-screen texture.
		// Read previous screenTextureRenderTarget(via texelFetch inside fragment shader) to use as a new starting point to blend with
		renderer.setRenderTarget(pathTracingRenderTarget);
		renderer.render(pathTracingScene, worldCamera);

		// STEP 2
		// Render(copy) the pathTracingScene output(pathTracingRenderTarget above) into screenTextureRenderTarget.
		// This will be used as a new starting point for Step 1 above (essentially creating ping-pong buffers)
		renderer.setRenderTarget(screenTextureRenderTarget);
		renderer.render(screenTextureScene, quadCamera);

		// STEP 3
		// Render full screen quad with generated pathTracingRenderTarget in STEP 1 above.
		// After the image is gamma-corrected, it will be shown on the screen as the final accumulated output
		renderer.setRenderTarget(null);
		renderer.render(screenOutputScene, quadCamera);


	} // end function animate()

};