/** ----- NOTES: ----- */ 
// when exporting .obj scene from Cinema4D please use meters as a unit. 
// then use coverter command "obj2gltf -i input.obj -o output.gltf"

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
	 * Layout view instance.
	 */
	layout: null,

	/**
	 * Type of the layout view.
	 */
	layoutType: enums.layoutType.CANVAS,

	
	init: function()
	{
		var layoutWrapperV = document.querySelector('wrapper.layout');
		GLOBALS.rendererCanvas = new RendererCanvas(layoutWrapperV);
		GLOBALS.rendererCanvas.init();
		
		GLOBALS.onViewLoaded();

		API.init('renderer');		
		API.connect(GLOBALS._onServerConnected, GLOBALS._onServerDisconnect);
		API.listen('cells/update', GLOBALS._onCellUpdate);
	},

	

	/**
	 * On server-client connection.
	 */
	_onServerConnected: function()
	{
		console.log('[Globals] Connected to server!');

		API.isConnected = true;
		
		API.request('cells/getAll', GLOBALS.onGetLayout);
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

		var ratio = CANVAS_WIDTH / CANVAS_HEIGHT;
		GLOBALS.camera = new THREE.PerspectiveCamera(45, ratio, 1, 20000);

		GLOBALS.camera.position.x = 0.35;
		GLOBALS.camera.position.y = 0.03;
		GLOBALS.camera.position.z = -2.58;
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

		var renderer = null;
		var canvas = document.getElementById('rendering-canvas');

		switch(GLOBALS.rendererType)
		{
			case enums.rendererType.RAY_TRACING:
				renderer = new RaytracingRenderer();
				renderer.canvas = canvas;
				renderer.updateFunction = GLOBALS.updateProgressAsync;
				renderer.onCellRendered = GLOBALS.onCellRendered;
				break;

			case enums.rendererType.PATH_TRACING:
				new Exception.NotImplemented();
				break;
		}

		GLOBALS.renderer = renderer;

		renderer.init();
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
		GLOBALS.cells = data;

		console.log('[Globals] Grid layout drawn');


		// -----------------------------
		// draw layout
		// -----------------------------

		GLOBALS.rendererCanvas.createLayout(GLOBALS.cells);


		// -----------------------------
		// draw all already rendered cells
		// -----------------------------

		for (var i=0; i<GLOBALS.cells.length; i++)
		{
			var current = GLOBALS.cells[i];

			GLOBALS.tryUpdatingCell(current);
		}
		

		new Thread(GLOBALS.onDataLoaded);
	},

	/**
	 * View has done loading.
	 * Remove skeleton screens by removing 'loading' class from elements.
	 */
	onViewLoaded: function()
	{

		// -----------------------------
		// remove .loading flag
		// -----------------------------

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
		document.body.removeClass('busy');
		API.request('cells/getWaiting', GLOBALS.onGetWaitingCells);
	},

	/**
	 * Cell waiting to be rendered is received.
	 */
	onGetWaitingCells: function(cell)
	{
		console.log('[Globals] Rendering cell received');

		document.body.addClass('busy');

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
		if (GLOBALS.rendererType != enums.rendererType.WEB_GL_RENDERER)
		{
			GLOBALS.renderer.setCell(GLOBALS.cells.currentRenderCell);
		}

		// start rendering
		GLOBALS.onRenderFrame();
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