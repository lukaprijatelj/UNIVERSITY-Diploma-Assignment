/**
 * Globals. 
 */
var GLOBALS =
{
	/**
	 * Base url API access.
	 */
	apiUrl: '/api',

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
	 * Layout view instance.
	 */
	rendererCanvas: null,

	/**
	 * Canvas for editor aka preview.
	 */
	editorCanvas: null,


	init: function()
	{	
		GLOBALS.editorCanvas = new EditorCanvas();
		GLOBALS.editorCanvas.init();

		GLOBALS.rendererCanvas = new RendererCanvas();
		GLOBALS.rendererCanvas.init();
		
		DEBUG.init();	
		
		API.init('admin');	

		API.connect(GLOBALS._onServerConnected, GLOBALS._onServerDisconnect);
		API.listen('cells/update', GLOBALS._onCellUpdate);
		API.listen('clients/updated', GLOBALS._onClientsUpdated);

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
	_onServerConnected: function()
	{
		console.log('[Main] Connected to server!');

		API.isConnected = true;

		API.request('cells/getAll', GLOBALS._onGetLayout);
	},

	/**
	 * Client has disconnected from server.
	 */
	_onServerDisconnect: function()
	{
		API.isConnected = false;
	},

	startLoadingGltfModel: function(path)
	{
		console.log('[Globals] Requesting GLTF model');

		var loader = new GltfLoader();
		loader.path = 'scenes/Textured-box/BoxTextured.gltf';
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
			//API.request('cells/getWaiting', GLOBALS.onGetWaitingCells);
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

		var ratio = CANVAS_WIDTH / CANVAS_HEIGHT;
		GLOBALS.camera = new THREE.PerspectiveCamera(45, ratio, 1, 20000);

		GLOBALS.camera.position.x = 0.35;
		GLOBALS.camera.position.y = 0.03;
		GLOBALS.camera.position.z = -2.58;
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

		var intensity = 70000;

		//if (GLOBALS.rendererType == enums.rendererType.RAY_TRACING)
		{
			var light = new THREE.PointLight(0xffaa55, intensity);
			light.position.set( - 200, 100, 100 );
			light.physicalAttenuation = true;
			GLOBALS.scene.add( light );
	
			var light = new THREE.PointLight(0x55aaff, intensity);
			light.position.set( 200, 100, 100 );
			light.physicalAttenuation = true;
			GLOBALS.scene.add( light );
	
			var light = new THREE.PointLight(0xffffff, intensity * 1.5);
			light.position.set( 0, 0, 300 );
			light.physicalAttenuation = true;
			GLOBALS.scene.add( light );
		}
		//else
		{
			var light = new THREE.AmbientLight(0x404040, 3); // soft white light
			GLOBALS.scene.add( light );
		}
	},

	/**
	 * Initializes renderer.
	 */
	_initRenderer: function()
	{
		console.log('[Globals] Initialize renderer of type "' + GLOBALS.rendererType + '"');

		var canvas = document.getElementById('editor-canvas');

		var options = 
		{ 
			canvas: canvas 
		};
		GLOBALS.renderer = new THREE.WebGLRenderer(options);
		
		GLOBALS.renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);

		//GLOBALS.renderer.init();
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

	/**
	 * One of the cells was updated
	 */
	_onCellUpdate: function(data)
	{
		var cell = data.cell;

		GLOBALS.tryUpdatingCell(cell);
	},

	/**
	 * Sends request to recalculate grid layout.
	 * @private
	 */
	_onStartStopRenderingClick: function()
	{
		var startRenderingButtonV = document.getElementById('recalculate-layout-button');

		if (startRenderingButtonV.hasClass('selected'))
		{
			API.request('rendering/stop', () =>
			{
				var interfaceV = document.getElementById('interface');
				interfaceV.removeClass('rendering');

				var renderingCanvasV = document.getElementById('rendering-canvas');
				renderingCanvasV.hide();
					
				startRenderingButtonV.removeClass('selected');
				startRenderingButtonV.innerHTML = 'Start rendering';
			});
		}
		else
		{
			API.request('rendering/start', () =>
			{
				var interfaceV = document.getElementById('interface');
				interfaceV.addClass('rendering');
	
				var renderingCanvasV = document.getElementById('rendering-canvas');
				renderingCanvasV.show();
				
				startRenderingButtonV.addClass('selected');
				startRenderingButtonV.innerHTML = 'Stop rendering';

				// open rendering output window
				var myWindow = window.open("/renderingOutput", "", "width=800,height=450");
			});
		}
		
		//API.request('cells/getAll', GLOBALS._onGetLayout);
	},

	/**
	 * Starts new client/tab for rendering.
	 * @private
	 */
	_onStartNewClientClick: function()
	{
		var a = document.createElement("a");    
		a.href = window.location.origin + '/client';    
		a.setAttribute('target', '_blank');
		var evt = document.createEvent("MouseEvents");   
		evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, true, false, false, false, 0, null);    
		a.dispatchEvent(evt);
	},

	/**
	 * Gets rendering grid layout. Layout is needed, so that images from other clients are displayed.
	 * @private
	 */
	_onGetLayout: function(data)
	{
		GLOBALS.cells = data;

		console.log('[Main] Layout is received from server');

		
		// -----------------------------
		// draw layout
		// -----------------------------

		GLOBALS.rendererCanvas.createLayout(GLOBALS.cells);


		// -----------------------------
		// draw all cells that are already rendered
		// -----------------------------
		
		for (var i=0; i<GLOBALS.cells.length; i++)
		{
			var current = GLOBALS.cells[i];

			GLOBALS.tryUpdatingCell(current);
		}


		new Thread(GLOBALS.onLoaded);
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

		var canvasWidthInput = document.getElementById('canvas-width-input');
		canvasWidthInput.value = CANVAS_WIDTH;

		var canvasHeightInput = document.getElementById('canvas-height-input');
		canvasHeightInput.value = CANVAS_HEIGHT;

		var blockWidthV = document.getElementById('block-width-input');
		blockWidthV.value = BLOCK_WIDTH;

		var blockHeightV = document.getElementById('block-height-input');
		blockHeightV.value = BLOCK_HEIGHT;



		// -----------------------------
		// remove .loading flag
		// -----------------------------

		document.body.removeClass('loading');
	},

	/**
	 * Draws cell on the screen.
	 */
	tryUpdatingCell: function(cell)
	{
		if (!cell.imageData)
		{
			// cells does not have any image data so we don't really need to draw it
			return;
		}

		GLOBALS.rendererCanvas.updateCell(cell);
	}
};

window.onload = GLOBALS.init();