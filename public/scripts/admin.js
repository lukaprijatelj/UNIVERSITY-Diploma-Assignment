var WebApplication = new namespace.core.WebApplication('UNIVERSITY-Diploma-Assignment');
var options = null;

var WebPage = new namespace.core.WebPage('Admin');

/**
 * Grid layout of cells that are rendered or are waiting for rendering.
 */
WebPage.cells = new List();

/**
 * Socket io instance.
 */
WebPage.io = null;

/**
 * ThreeJS scene.
 */
WebPage.scene = null;

/**
 * GLTF loader.
 */
WebPage.loader = null;

/**
 * Camera controls affected by mouse movement.
 */
WebPage.controls = null;

/**
 * ThreeJS camera in the scene.
 */
WebPage.camera = null;

/**
 * Canvas for editor aka preview.
 */
WebPage.editorCanvas = null;

/**
 * Is rendering service running.
 */
WebPage.isRendering = false;

/**
 * Initializes page.
 */
WebPage.init = function()
{	
	API.init(enums.apiClientType.ADMIN);	

	API.connect(WebPage._onServerConnected, WebPage._onServerDisconnect);

	WebPage.editorCanvas = new EditorCanvas();
	WebPage.editorCanvas.init();
	
	DEBUG.init();
};

/**
 * Opens scene and loads cameras and lights.
 */
WebPage.openScene = function()
{
	WebPage._initScene();
	WebPage._initCamera();
	WebPage._initLights();
	
	WebPage._initRenderer();
	WebPage._initCameraControls();

	WebPage.startLoadingGltfModel();
};

/**
 * On server-client connection.
 * @private
 */
WebPage._onServerConnected = function(socket, data)
{
	console.log('[Main] Connected to server!');

	API.isConnected = true;

	API.listen('clients/updated', WebPage._onClientsUpdated);

	API.request('rendering/checkAdmin', WebPage._onCheckRendering);	

	new namespace.core.Thread(WebPage.onLoaded);
};

/**
 * Client has disconnected from server.
 */
WebPage._onServerDisconnect = function()
{
	API.isConnected = false;
};

/**
 * Check is server rendering service is running.
 */
WebPage._onCheckRendering = function(data)
{
	WebPage.isRendering = data.isRenderingServiceRunning;

	options = data.options;
	WebPage.editorCanvas.resizeCanvas();

	WebPage.openScene();

	WebPage._updateRenderingState();
};

/**
 * Starts loading GLTF model.
 */
WebPage.startLoadingGltfModel = function(path)
{
	console.log('[Globals] Requesting GLTF model');

	let loadingLayer = document.querySelector('layer#loading');
	loadingLayer.querySelector('.centered-text wrapper_').innerHTML = 'Loading...';
	loadingLayer.show();

	var loader = new GltfLoader();
	loader.path = options.SCENE_FILEPATH;
	loader.onSuccess = (gltf) =>
	{
		console.log('[glTF loader] Scene finished loading');

		loadingLayer.hide();

		WebPage.scene.add(gltf.scene);

		gltf.animations; // Array<THREE.AnimationClip>
		gltf.scene; // THREE.Scene
		gltf.scenes; // Array<THREE.Scene>
		gltf.cameras; // Array<THREE.Camera>
		gltf.asset; // Object
					
		WebPage.onRenderFrame();
	};
	loader.start();	
};

/**
 * Initializes scene.
 */
WebPage._initScene = function()
{
	WebPage.scene = new THREE.Scene();
};

/**
 * Intializes camera in the scene.
 */
WebPage._initCamera = function()
{
	console.log('[Globals] Initializing camera');

	var ratio = options.CANVAS_WIDTH / options.CANVAS_HEIGHT;
	WebPage.camera = new THREE.PerspectiveCamera(45, ratio, 1, 20000);

	WebPage.camera.position.x = options.CAMERA_POSITION_X;
	WebPage.camera.position.y = options.CAMERA_POSITION_Y;
	WebPage.camera.position.z = options.CAMERA_POSITION_Z;
};

/**
 * Initializes camera mouse controls, so that changing view is easier.
 */
WebPage._initCameraControls = function()
{
	console.log('[Globals] Initializing camera controls');

	WebPage.controls = new THREE.OrbitControls(WebPage.camera, WebPage.renderer.domElement);
};

/**
 * Initializes lights.
 */
WebPage._initLights = function()
{
	console.log('[Globals] Initializing lights');

	var light = new THREE.AmbientLight(0x404040, 7);
	WebPage.scene.add(light);
};

/**
 * Initializes renderer.
 */
WebPage._initRenderer = function()
{
	console.log('[Globals] Initialize editor renderer');

	var canvas = document.getElementById('editor-canvas');

	var options = 
	{ 
		canvas: canvas 
	};
	WebPage.renderer = new THREE.WebGLRenderer(options);
	WebPage.renderer.setSize(options.CANVAS_WIDTH, options.CANVAS_HEIGHT);

	WebPage.editorCanvas.resizeCanvas();
};

/**
 * Main rendering loop.
 */
WebPage.onRenderFrame = function()
{
	// will start loop for this function
	requestAnimationFrame(WebPage.onRenderFrame);	

	// render current frame
	WebPage.renderer.render(WebPage.scene, WebPage.camera);
		
	if (WebPage.controls)
	{
		// update camera
		WebPage.controls.update();
	}
};

/**
 * Clears scene.
 */
WebPage.clearScene = function()
{
	let scene = WebPage.scene;

	while(scene.children.length > 0)
	{ 
		scene.remove(scene.children[0]); 
	}
};

/**
 * Server has notified us that clients were updated.
 */
WebPage._onClientsUpdated = function(data)
{
	var clients = data;
	var renderingClientsCount = clients.filter(item => item.admin == false).length;

	var clientsConnectedInput = document.querySelector('#num-clients-connected .value');
	clientsConnectedInput.innerHTML = renderingClientsCount;
};

/**
 * Updates buttons and popups when rendering state is switched.
 */
WebPage._updateRenderingState = function()
{
	var startRenderingButtonV = document.getElementById('render-button');

	if (WebPage.isRendering == true)
	{
		var interfaceV = document.getElementById('interface');
		interfaceV.addClass('rendering');

		var canvasV = document.getElementById('editor-canvas');
		canvasV.disable();

		let sceneButton = document.getElementById('scene-button');
		sceneButton.disable();

		let optionsButton = document.getElementById('options-button');
		optionsButton.disable();

		//let outputButton = document.getElementById('output-button');
		//outputButton.show();

		let newRendererButton = document.getElementById('new-renderer-button');
		newRendererButton.show();
			
		startRenderingButtonV.addClass('selected');
		startRenderingButtonV.innerHTML = 'DISABLE RENDERING';

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

		//let outputButton = document.getElementById('output-button');
		//outputButton.hide();

		let newRendererButton = document.getElementById('new-renderer-button');
		newRendererButton.hide();

		startRenderingButtonV.removeClass('selected');
		startRenderingButtonV.innerHTML = 'ENABLE RENDERING';

		startRenderingButtonV.enable();
	}
};

/**
 * Initial data is loaded.
 * Remove skeleton screens by removing 'loading' class from elements.
 */
WebPage.onLoaded = function()
{
	// -----------------------------
	// remove .loading flag
	// -----------------------------

	document.getElementById('interface').removeClass('loading');
};