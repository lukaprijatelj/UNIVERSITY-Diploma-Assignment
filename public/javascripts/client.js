/** ----- NOTES: ----- */ 
// when exporting .obj scene from Cinema4D please use meters as a unit. 
// then use coverter command "obj2gltf -i input.obj -o output.gltf"

var options = null;

var GLOBALS =
{
	/**
	 * ThreeJS scene.
	 */
	scene: null,

	/**
	 * GLTF loader.
	 */
	loader: null,

	/**
	 * ThreeJS camera in the scene.
	 */
	camera: null,

	/**
	 * Base url API access.
	 */
	apiUrl: '/api',

	/**
	 * Socket io instance.
	 */
	io: null,

	/**
	 * Canvas renderer.
	 */
	renderer: null,

	/**
	 * Grid layout of cells that are rendered or are waiting for rendering.
	 */
	cells: [],

	/**
	 * Current renderer type.
	 */
	rendererType: enums.rendererType.RAY_TRACING,

	/**
	 * Camera controls affected by mouse movement.
	 */
	controls: null,

	/**
	 * Last rendered time.
	 */
	lastRenderingTime: 0,


	
	init: function()
	{
		var layoutWrapperV = document.querySelector('wrapper.layout');
		GLOBALS.rendererCanvas = new RendererCanvas(layoutWrapperV);
		GLOBALS.rendererCanvas.init();
		
		GLOBALS.onViewLoaded();

		API.init('renderer');		
		API.connect(GLOBALS._onServerConnected, GLOBALS._onServerDisconnect);
	},


	/**
	 * On server-client connection.
	 */
	_onServerConnected: function()
	{
		console.log('[Globals] Connected to server!');

		API.isConnected = true;

		API.listen('cells/update', GLOBALS._onCellUpdate);
		API.listen('rendering/start', GLOBALS._onStartRendering);	
		API.listen('rendering/stop', GLOBALS._onStopRendering);	

		API.request('cells/getAll', GLOBALS.onGetLayout);
	},	

	/**
	 * Server started rendering service.
	 */
	_onStartRendering: function(data)
	{
		API.request('cells/getAll', GLOBALS.onGetLayout);
	},

	/**
	 * Server stopped rendering service.
	 */
	_onStopRendering: function(data)
	{
		options = null;
	},

	/**
	 * Client has disconnected from server.
	 */
	_onServerDisconnect: function()
	{
		console.log('[Globals] Disconnected from server!');

		API.isConnected = false;
	},

	/**
	 * Progress was updated.
	 */
	_onCellUpdate: async function(data)
	{
		var cell = data.cell;
		GLOBALS.tryUpdatingCell(cell);
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
						

			API.request('cells/getWaiting', GLOBALS.onGetWaitingCells);
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

		var ratio = options.RESOLUTION_WIDTH / options.RESOLUTION_HEIGHT;
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

		GLOBALS.controls = new THREE.OrbitControls(GLOBALS.camera);
		GLOBALS.controls.enabled = false;
	},

	/**
	 * Initializes lights.
	 */
	_initLights: function()
	{
		console.log('[Globals] Initializing lights');

		var intensity = 70000;

		// WARNING:
		// do not use THREE.AmbientLight because RayTracing does not recognize it. Nothing is rendered if it is used. 
		// only Use PointLight

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
	},

	/**
	 * Initializes renderer.
	 */
	_initRenderer: function()
	{
		console.log('[Globals] Initialize renderer of type "' + GLOBALS.rendererType + '"');

		var renderer = null;
		var canvas = document.getElementById('rendering-canvas');

		switch(GLOBALS.rendererType)
		{
			case enums.rendererType.RAY_TRACING:
				renderer = new RaytracingRenderer(canvas);
				renderer.updateFunction = GLOBALS.updateProgressAsync;
				renderer.onCellRendered = GLOBALS.onCellRendered;
				GLOBALS.renderer = renderer;
				renderer.init();
				break;

			case enums.rendererType.PATH_TRACING:
				init();
				break;
		}		
	},	

	/**
	 * Main rendering loop.
	 */
	onRenderFrame: function()
	{
		// render current frame
		GLOBALS.renderer.render(GLOBALS.scene, GLOBALS.camera);
	},

	/**
	 * Gets rendering grid layout. Layout is needed, so that images from other clients are displayed.
	 * @async
	 */
	onGetLayout: function(data)
	{
		console.log('[Globals] Grid layout drawn');


		// -----------------------------
		// update options
		// -----------------------------

		if (!data.options)
		{
			return;
		}

		options = data.options;
		GLOBALS.rendererCanvas.resizeCanvas();


		// -----------------------------
		// draw layout
		// -----------------------------

		GLOBALS.cells = data.cells;
		GLOBALS.rendererCanvas.createLayout(GLOBALS.cells);


		// -----------------------------
		// draw all already rendered cells
		// -----------------------------

		for (var i=0; i<GLOBALS.cells.length; i++)
		{
			var current = GLOBALS.cells[i];

			GLOBALS.tryUpdatingCell(current);
		}
		

		// -----------------------------
		// check if rendering service is running on server
		// -----------------------------
		
		if (!data.isRenderingServiceRunning)
		{
			// nothing to render
			return;
		}
		API.isRenderingServiceRunning = data.isRenderingServiceRunning;

		GLOBALS.onDataLoaded();
	},

	/**
	 * View has done loading.
	 * Remove skeleton screens by removing 'loading' class from elements.
	 */
	onViewLoaded: function()
	{
		document.body.removeClass('loading');
	},

	/**
	 * Initial data is loaded.
	 */
	onDataLoaded: function()
	{
		GLOBALS._initScene();
		GLOBALS._initCamera();
		
		GLOBALS._initLights();
		
		GLOBALS._initRenderer();
		GLOBALS._initCameraControls();

		GLOBALS.startLoadingGltfModel();
	},

	/**
	 * Tries to update canvas with data from this cell.
	 */
	tryUpdatingCell: function(cell)
	{
		if (!cell.imageData)
		{
			return;
		}

		GLOBALS.rendererCanvas.updateCell(cell);
	},

	/**
	 * Cell finished rendering.
	 */
	onCellRendered: function()
	{
		GLOBALS.lastRenderingTime = window.setTimeout(()=>
		{
			document.getElementById('interface').removeClass('rendering');
			GLOBALS.lastRenderingTime = 0;
		}, 1000);
				
		API.request('cells/getWaiting', GLOBALS.onGetWaitingCells);
	},

	/**
	 * Cell waiting to be rendered is received.
	 */
	onGetWaitingCells: function(cell)
	{
		console.log('[Globals] Rendering cell received');

		if (GLOBALS.lastRenderingTime > 0)
		{
			window.clearTimeout(GLOBALS.lastRenderingTime);
		}
		
		document.getElementById('interface').addClass('rendering');

		GLOBALS.cells.currentRenderCell = cell;

		// must start new thread because socketIO will retry call if function is not finished in X num of miliseconds
		// heavy duty operation
		GLOBALS.startRendering();
	},

	/**
	 * Starts rendering.
	 */
	startRendering: async function()
	{
		if (GLOBALS.rendererType == enums.rendererType.RAY_TRACING)
		{
			GLOBALS.renderer.setCell(GLOBALS.cells.currentRenderCell);

			// start rendering
			GLOBALS.onRenderFrame();
		}

		
	},

	/**
	 * Notifies server how much has client already rendered.
	 * @async
	 */
	updateProgressAsync: function(cell, progress)
	{
		var data = 
		{
			cell: cell,
			progress: progress
		};

		API.request('cells/update', undefined, data);
	}
};

window.onload = GLOBALS.init();