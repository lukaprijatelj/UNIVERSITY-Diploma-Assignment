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


	init: function()
	{	
		GLOBALS.editorCanvas = new EditorCanvas();
		GLOBALS.editorCanvas.init();
		
		DEBUG.init();	
		
		API.init('admin');	

		API.connect(GLOBALS._onServerConnected, GLOBALS._onServerDisconnect);
		

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

		new Thread(GLOBALS.onLoaded);
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
		GLOBALS._updateRenderingState(data.isRenderingServiceRunning);
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
	 * Server has notified us that clients were updated.
	 */
	_onClientsUpdated: function(data)
	{
		var clients = data;
		var activeClientsCount = clients.filter(item => item.active == true).length;

		var clientsConnectedInput = document.getElementById('clients-connected-input');
		clientsConnectedInput.value = activeClientsCount;
	},

	_updateRenderingState: function(isRendering)
	{
		var startRenderingButtonV = document.getElementById('recalculate-layout-button');

		if (isRendering == true)
		{
			var interfaceV = document.getElementById('interface');
			interfaceV.addClass('rendering');

			var canvasV = document.getElementById('editor-canvas');
			canvasV.disable();
				
			startRenderingButtonV.addClass('selected');
			startRenderingButtonV.innerHTML = 'Stop rendering';

			startRenderingButtonV.enable();
		}
		else
		{
			var interfaceV = document.getElementById('interface');
			interfaceV.removeClass('rendering');

			var canvasV = document.getElementById('editor-canvas');
			canvasV.enable();

			startRenderingButtonV.removeClass('selected');
			startRenderingButtonV.innerHTML = 'Start rendering';

			startRenderingButtonV.enable();
		}
	},

	/**
	 * Sends request to recalculate grid layout.
	 * @private
	 */
	_onStartStopRenderingClick: function()
	{
		var startRenderingButtonV = document.getElementById('recalculate-layout-button');
		startRenderingButtonV.disable();

		var data = {};

		if (startRenderingButtonV.hasClass('selected'))
		{
			API.request('rendering/stop', () =>
			{
				GLOBALS._updateRenderingState(false);
			}, data);
		}
		else
		{
			data.options = options;

			API.request('rendering/start', () =>
			{
				GLOBALS._updateRenderingState(true);
			}, data);
		}
	},

	_onResolutionWidthChange: function(val)
	{
		options.RESOLUTION_WIDTH = val;
	},

	_onResolutionHeightChange: function(val)
	{
		options.RESOLUTION_HEIGHT = val;
	},

	_onBlockWidthChange: function(val)
	{
		options.BLOCK_WIDTH = val;
	},

	_onBlockHeightChange: function(val)
	{
		options.BLOCK_HEIGHT = val;
	},

	_onOpenOutputClick: function()
	{
		// open rendering output window
		window.open("/renderingOutput", "", "width=" + options.RESOLUTION_WIDTH + ",height=" + options.RESOLUTION_HEIGHT);
	},

	/**
	 * Starts new client/tab for rendering.
	 * @private
	 */
	_onStartNewClientClick: function()
	{
		/*var a = document.createElement("a");    
		a.href = window.location.origin + '/client';    
		a.setAttribute('target', '_blank');
		var evt = document.createEvent("MouseEvents");   
		evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, true, false, false, false, 0, null);    
		a.dispatchEvent(evt);*/

		window.open("/client", "", "width=" + options.RESOLUTION_WIDTH + ",height=" + options.RESOLUTION_HEIGHT);
	},

	/**
	 * Initial data is loaded.
	 * Remove skeleton screens by removing 'loading' class from elements.
	 */
	onLoaded: function()
	{
		// -----------------------------
		// set default values
		// -----------------------------

		var resolutionWidthInput = document.getElementById('resolution-width-input');
		resolutionWidthInput.value = options.RESOLUTION_WIDTH;

		var resolutionHeightInput = document.getElementById('resolution-height-input');
		resolutionHeightInput.value = options.RESOLUTION_HEIGHT;

		var blockWidthV = document.getElementById('block-width-input');
		blockWidthV.value = options.BLOCK_WIDTH;

		var blockHeightV = document.getElementById('block-height-input');
		blockHeightV.value = options.BLOCK_HEIGHT;


		// -----------------------------
		// remove .loading flag
		// -----------------------------

		document.body.removeClass('loading');
	}
};

window.onload = GLOBALS.init();