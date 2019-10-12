var WebApplication = new namespace.core.WebApplication('UNIVERSITY-Diploma-Assignment');

/** ----- NOTES: ----- */ 
// when exporting .obj scene from Cinema4D please use meters as a unit. 
// then use coverter command "obj2gltf -i input.obj -o output.gltf"

var options = null;
var previousOptions = null;

var ClientPage = new namespace.core.WebPage('Client');
var globals = new namespace.core.Globals();

/**
 * ThreeJS scene.
 */
globals.scene = null;

/**
 * GLTF loader.
 */
globals.loader = null;

/**
 * ThreeJS camera in the scene.
 */
globals.camera = null;

/**
 * Canvas renderer.
 */
globals.renderer = null;

/**
 * Grid layout of cells that are rendered or are waiting for rendering.
 */
globals.cells = new Array();

/**
 * Camera controls affected by mouse movement.
 */
globals.controls = null;

/**
 * Last rendered time.
 */
globals.lastRenderingTime = 0;

/**
 * Rendering canvas.
 */
globals.rendererCanvas = null;


/**
 * Initializes page.
 */
ClientPage.init = function()
{
	globals.rendererCanvas = new RendererCanvas();
	globals.rendererCanvas.init();
	
	document.querySelector('interface').removeClass('loading');

	API.init(enums.apiClientType.RENDERER);		
	API.connect(ClientPage._onServerConnected, ClientPage._onServerDisconnect);
};


/**
 * On server-client connection.
 */
ClientPage._onServerConnected = function()
{
	console.log('[ClientPage] Connected to server!');

	API.isConnected = true;

	API.listen('cells/update', ClientPage._onCellUpdate);
	API.listen('rendering/start', ClientPage._onStartRenderingService);	
	API.listen('rendering/stop', ClientPage._onStopRenderingService);	

	API.request('cells/getAll', ClientPage.onGetLayout);
};	

/**
 * Server started rendering service.
 */
ClientPage._onStartRenderingService = function(data)
{
	API.request('cells/getAll', ClientPage.onGetLayout);
};

/**
 * Server stopped rendering service.
 */
ClientPage._onStopRenderingService = function(data)
{
	previousOptions = options;
	options = null;

	globals.renderer.stopRendering();
	ClientPage.stopRendererUi();
};

/**
 * Client has disconnected from server.
 */
ClientPage._onServerDisconnect = function()
{
	console.log('[ClientPage] Disconnected from server!');

	API.isConnected = false;
};

/**
 * Progress was updated.
 */
ClientPage._onCellUpdate = function(data)
{
	var cells = data.cells;
	
	for (var i=0; i<cells.length; i++)
	{
		var current = cells[i];

		ClientPage.tryUpdatingCell(current);
	}
};

/**
 * Starts loading GLTF model.
 */
ClientPage.startLoadingGltfModel = function()
{
	console.log('[ClientPage] Requesting GLTF model');	

	var onSuccess = (resolve, reject) =>
	{
		var loader = new GltfLoader();
		loader.path = options.SCENE_FILEPATH;
		loader.onSuccess = (gltf) =>
		{
			console.log('[glTF loader] Scene finished loading');
		
			resolve(gltf);
		};
		loader.start();	
	};
	return new Promise(onSuccess);
};

/**
 * Initializes scene.
 * @private
 */
ClientPage._initScene = function()
{
	var asyncCallback = async function(resolve, reject)
    {
		globals.scene = new THREE.Scene();

		if (options.SKY_CUBE_FILEPATH)
		{				
			var loader = new THREE.CubeTextureLoader();
			loader.setPath(options.SKY_CUBE_FILEPATH);

			globals.scene.background = loader.load(options.SKY_CUBE_IMAGES, resolve, undefined, reject);
		}	
		else
		{
			resolve();
		}		
    };
	return new Promise(asyncCallback);
};

/**
 * Intializes camera in the scene.
 */
ClientPage._initCamera = function()
{
	console.log('[ClientPage] Initializing camera');

	if (!options.CAMERA)
	{
		return;
	}

	var loader = new THREE.ObjectLoader();

	globals.camera = loader.parse(options.CAMERA);
};

/**
 * Initializes lights.
 */
ClientPage._initLights = function()
{
	console.log('[ClientPage] Initializing lights');

	if (!options.LIGHTS)
	{
		return;
	}

	var loader = new THREE.ObjectLoader();
	
	for (let i=0; i<options.LIGHTS.length; i++)
	{
		var light = loader.parse(options.LIGHTS[i]);
		globals.scene.add(light);
	}

	/*var intensity = 1;

	var light = new THREE.PointLight(0xffaa55, intensity);
	light.position.set( - 200, 100, 100 );
	globals.scene.add( light );

	var light = new THREE.PointLight(0x55aaff, intensity);
	light.position.set( 200, -100, 100 );
	globals.scene.add( light );

	var light = new THREE.PointLight(0xffffff, intensity);
	light.position.set( 0, 0, -300 );
	globals.scene.add( light );*/
};

/**
 * Initializes renderer.
 */
ClientPage._initRenderer = function()
{
	console.log('[ClientPage] Initialize renderer of type "' + options.RENDERER_TYPE + '"');

	var renderer = null;

	switch(options.RENDERER_TYPE)
	{
		case enums.rendererType.RAY_TRACING:
			renderer = new RaytracingRenderer();
			break;

		case enums.rendererType.PATH_TRACING:
			new Exception.NotImplemented();
			break;
	}	
	
	globals.renderer = renderer;
};	

/**
 * Gets rendering grid layout. Layout is needed, so that images from other clients are displayed.
 * @async
 */
ClientPage.onGetLayout = function(data)
{
	console.log('[ClientPage] Grid layout drawn');


	// -----------------------------
	// update options
	// -----------------------------

	if (!data.options)
	{
		return;
	}

	previousOptions = options;
	options = data.options;	

	if (previousOptions)
	{
		let browser = new namespace.core.Browser();
		let prevWidth = (previousOptions.CANVAS_WIDTH * previousOptions.RESOLUTION_FACTOR);
		let prevHeight = (previousOptions.CANVAS_HEIGHT * previousOptions.RESOLUTION_FACTOR);
		browser.setTitle('Idle (' + prevWidth + ' x ' + prevHeight + ')');
	}

	globals.rendererCanvas.resizeCanvas();


	// -----------------------------
	// draw layout
	// -----------------------------

	globals.cells = data.cells;
	globals.rendererCanvas.createLayout(globals.cells);


	// -----------------------------
	// draw all already rendered cells
	// -----------------------------

	for (var i=0; i<globals.cells.length; i++)
	{
		var current = globals.cells[i];

		ClientPage.tryUpdatingCell(current);

		current.imageData = null;
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

	ClientPage.onDataLoaded();
};

/**
 * Initial data is loaded.
 */
ClientPage.onDataLoaded = async function()
{
	/**
	 * gltf.animations; // Array<THREE.AnimationClip>
	 * gltf.scene; // THREE.Scene
	 * gltf.scenes; // Array<THREE.Scene>
	 * gltf.cameras; // Array<THREE.Camera>
	 * gltf.asset; // Object
	 */
	var gltf = await ClientPage.startLoadingGltfModel();

	await ClientPage._initScene();
	ClientPage._initCamera();
	ClientPage._initLights();
	
	ClientPage._initRenderer();

	globals.scene.add(gltf.scene);
	
	await globals.renderer.prepareJsonData();

	API.request('cells/getWaiting', ClientPage.onGetWaitingCells);
};

/**
 * Tries to update canvas with data from this cell.
 */
ClientPage.tryUpdatingCell = function(cell)
{
	if (!cell.imageData)
	{
		return;
	}

	globals.rendererCanvas.updateCellImage(cell);
};

/**
 * Stop rendering UI.
 */
ClientPage.stopRendererUi = function()
{
	document.querySelector('interface').removeClass('rendering');
	globals.lastRenderingTime = 0;

	if (previousOptions)
	{
		let browser = new namespace.core.Browser();
		let prevWidth = (previousOptions.CANVAS_WIDTH * previousOptions.RESOLUTION_FACTOR);
		let prevHeight = (previousOptions.CANVAS_HEIGHT * previousOptions.RESOLUTION_FACTOR);
		browser.setTitle('Idle (' + prevWidth + ' x ' + prevHeight + ')');
	}
};

/**
 * All waiting cells are done rendering.
 */
ClientPage.onRendererDone = function(cells)
{
	globals.lastRenderingTime = window.setTimeout(ClientPage.stopRendererUi, 1000);

	if (!API.isRenderingServiceRunning)
	{
		return;
	}

	ClientPage.updateProgressAsync(cells, 100);
			
	API.request('cells/getWaiting', ClientPage.onGetWaitingCells);
};

/**
 * Cell waiting to be rendered is received.
 */
ClientPage.onGetWaitingCells = function(cells)
{
	console.log('[ClientPage] Rendering cells received');

	if (!cells)
	{
		new Exception.ValueUndefined();
	}

	if (!cells.length)
	{
		new Exception.ArrayEmpty();
	}

	if (globals.lastRenderingTime > 0)
	{
		window.clearTimeout(globals.lastRenderingTime);
	}

	var cellsWaiting = new Array();

	for (let i=0; i<globals.cells.length; i++)
	{
		let current = globals.cells[i];

		for (let j=0; j<cells.length; j++)
		{
			let waitingCurrent = cells[j];

			if (current._id != waitingCurrent._id)
			{
				continue;
			}

			cellsWaiting.push(current);
		}
	}

	// must start new thread because socketIO will retry call if function is not finished in X num of miliseconds
	// heavy duty operation
	ClientPage.startRendering(cellsWaiting);
};

/**
 * Starts rendering.
 */
ClientPage.startRendering = function(cellsWaiting)
{
	document.querySelector('interface').addClass('rendering');

	if (previousOptions)
	{
		let browser = new namespace.core.Browser();
		let prevWidth = (previousOptions.CANVAS_WIDTH * previousOptions.RESOLUTION_FACTOR);
		let prevHeight = (previousOptions.CANVAS_HEIGHT * previousOptions.RESOLUTION_FACTOR);

		browser.setTitle('Rendering (' + prevWidth + ' x ' + prevHeight + ')');
	}

	if (options.RENDERER_TYPE == enums.rendererType.RAY_TRACING)
	{
		// start rendering
		globals.renderer.render(cellsWaiting);
	}
};

/**
 * Notifies server how much has client already rendered.
 * @async
 */
ClientPage.updateProgressAsync = function(cells, progress)
{
	var data = 
	{
		cells: cells,
		progress: progress
	};

	API.request('cells/update', undefined, data);
};