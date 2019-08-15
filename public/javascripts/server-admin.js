(async () =>
{
    await new namespace.core.AsyncImporter('javascripts/enums.js');
    await new namespace.core.AsyncImporter('javascripts/debug.js');
	await new namespace.core.AsyncImporter('javascripts/api.js');
	GLOBALS.init();
})();


/**
 * Globals. 
 */
var GLOBALS =
{
	/**
	 * Grid layout of cells that are rendered or are waiting for rendering.
	 */
	cells: [],
	
	/**
	 * Socket io instance.
	 */
	io: null,

	/**
	 * ThreeJS scene.
	 */
	scene: null,

	/**
	 * GLTF loader.
	 */
	loader: null,

	/**
	 * Camera controls affected by mouse movement.
	 */
	controls: null,

	/**
	 * ThreeJS camera in the scene.
	 */
	camera: null,

	/**
	 * Canvas for editor aka preview.
	 */
	editorCanvas: null,

	/**
	 * Is rendering service running.
	 */
	isRendering: false,


	init: function()
	{	
		document.getElementById('upload-file-input').onchange = EVENTS.onFileUploadChange;

		GLOBALS.editorCanvas = new EditorCanvas();
		GLOBALS.editorCanvas.init();
		
		DEBUG.init();	
		
		API.init(enums.apiClientType.ADMIN);	

		API.connect(GLOBALS._onServerConnected, GLOBALS._onServerDisconnect);
		
		GLOBALS.openScene();
	},

	openScene: function()
	{
		GLOBALS._initScene();
		GLOBALS._initCamera();
		GLOBALS._initLights();
		
		GLOBALS._initRenderer();
		GLOBALS._initCameraControls();

		GLOBALS.startLoadingGltfModel();
	},

	/**
	 * On server-client connection.
	 * @private
	 */
	_onServerConnected: function(socket, data)
	{
		console.log('[Main] Connected to server!');

		API.isConnected = true;

		API.listen('clients/updated', GLOBALS._onClientsUpdated);

		API.request('rendering/checkAdmin', GLOBALS._onCheckRendering);	

		new namespace.core.Thread(GLOBALS.onLoaded);
	},

	/**
	 * Client has disconnected from server.
	 */
	_onServerDisconnect: function()
	{
		API.isConnected = false;
	},

	/**
	 * Check is server rendering service is running.
	 */
	_onCheckRendering: function(data)
	{
		GLOBALS.isRendering = data.isRenderingServiceRunning;

		GLOBALS._updateRenderingState();
	},

	/**
	 * Starts loading GLTF model.
	 */
	startLoadingGltfModel: function(path)
	{
		console.log('[Globals] Requesting GLTF model');

		var loader = new GltfLoader();
		loader.path = options.SCENE_FILEPATH;
		loader.onSuccess = function(gltf) 
		{
			console.log('[glTF loader] Scene finished loading');

			GLOBALS.scene.add(gltf.scene);

			gltf.animations; // Array<THREE.AnimationClip>
			gltf.scene; // THREE.Scene
			gltf.scenes; // Array<THREE.Scene>
			gltf.cameras; // Array<THREE.Camera>
			gltf.asset; // Object
						
			GLOBALS.onRenderFrame();
		};
		loader.start();	
	},

	/**
	 * Initializes scene.
	 */
	_initScene: function()
	{
		GLOBALS.scene = new THREE.Scene();
	},

	/**
	 * Intializes camera in the scene.
	 */
	_initCamera: function()
	{
		console.log('[Globals] Initializing camera');

		var ratio = options.CANVAS_WIDTH / options.CANVAS_HEIGHT;
		GLOBALS.camera = new THREE.PerspectiveCamera(45, ratio, 1, 20000);

		GLOBALS.camera.position.x = options.CAMERA_POSITION_X;
		GLOBALS.camera.position.y = options.CAMERA_POSITION_Y;
		GLOBALS.camera.position.z = options.CAMERA_POSITION_Z;
	},

	/**
	 * Initializes camera mouse controls, so that changing view is easier.
	 */
	_initCameraControls: function()
	{
		console.log('[Globals] Initializing camera controls');

		GLOBALS.controls = new THREE.OrbitControls(GLOBALS.camera, GLOBALS.renderer.domElement);
	},

	/**
	 * Initializes lights.
	 */
	_initLights: function()
	{
		console.log('[Globals] Initializing lights');

		var light = new THREE.AmbientLight(0x404040, 3);
		GLOBALS.scene.add(light);
	},

	/**
	 * Initializes renderer.
	 */
	_initRenderer: function()
	{
		console.log('[Globals] Initialize editor renderer');

		var canvas = document.getElementById('editor-canvas');

		var options = 
		{ 
			canvas: canvas 
		};
		GLOBALS.renderer = new THREE.WebGLRenderer(options);
		GLOBALS.renderer.setSize(options.CANVAS_WIDTH, options.CANVAS_HEIGHT);

		GLOBALS.editorCanvas.resizeCanvas();
	},	

	/**
	 * Main rendering loop.
	 */
	onRenderFrame: function()
	{
		// will start loop for this function
		requestAnimationFrame(GLOBALS.onRenderFrame);	

		// render current frame
		GLOBALS.renderer.render(GLOBALS.scene, GLOBALS.camera);
			
		if (GLOBALS.controls)
		{
			// update camera
			GLOBALS.controls.update();
		}
	},

	/**
	 * Clears scene.
	 */
	clearScene: function()
	{
		let scene = GLOBALS.scene;

		while(scene.children.length > 0)
		{ 
			scene.remove(scene.children[0]); 
		}
	},

	/**
	 * Server has notified us that clients were updated.
	 */
	_onClientsUpdated: function(data)
	{
		var clients = data;
		var activeClientsCount = clients.filter(item => item.active == true).length;

		var clientsConnectedInput = document.getElementById('clients-connected-input');
		clientsConnectedInput.value = activeClientsCount;
	},

	/**
	 * Updates buttons and popups when rendering state is switched.
	 */
	_updateRenderingState: function()
	{
		var startRenderingButtonV = document.getElementById('render-button');

		if (GLOBALS.isRendering == true)
		{
			var interfaceV = document.getElementById('interface');
			interfaceV.addClass('rendering');

			var canvasV = document.getElementById('editor-canvas');
			canvasV.disable();

			let sceneButton = document.getElementById('scene-button');
			sceneButton.disable();

			let optionsButton = document.getElementById('options-button');
			optionsButton.disable();

			let outputButton = document.getElementById('output-button');
			outputButton.show();
				
			startRenderingButtonV.addClass('selected');
			startRenderingButtonV.innerHTML = 'STOP RENDERING';

			startRenderingButtonV.enable();
		}
		else
		{
			var interfaceV = document.getElementById('interface');
			interfaceV.removeClass('rendering');

			var canvasV = document.getElementById('editor-canvas');
			canvasV.enable();

			let sceneButton = document.getElementById('scene-button');
			sceneButton.enable();

			let optionsButton = document.getElementById('options-button');
			optionsButton.enable();

			let outputButton = document.getElementById('output-button');
			outputButton.hide();

			startRenderingButtonV.removeClass('selected');
			startRenderingButtonV.innerHTML = 'START RENDERING';

			startRenderingButtonV.enable();
		}
	},

	/**
	 * Initial data is loaded.
	 * Remove skeleton screens by removing 'loading' class from elements.
	 */
	onLoaded: function()
	{
		// -----------------------------
		// remove .loading flag
		// -----------------------------

		document.getElementById('interface').removeClass('loading');
	}
};

//window.onload = GLOBALS.init();