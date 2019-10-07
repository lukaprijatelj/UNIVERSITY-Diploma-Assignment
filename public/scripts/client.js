var WebApplication = new namespace.core.WebApplication('UNIVERSITY-Diploma-Assignment');

/** ----- NOTES: ----- */ 
// when exporting .obj scene from Cinema4D please use meters as a unit. 
// then use coverter command "obj2gltf -i input.obj -o output.gltf"

var options = null;
var previousOptions = null;

var WebPage = new namespace.core.WebPage('Client');

/**
 * ThreeJS scene.
 */
WebPage.scene = null;

/**
 * GLTF loader.
 */
WebPage.loader = null;

/**
 * ThreeJS camera in the scene.
 */
WebPage.camera = null;

/**
 * Canvas renderer.
 */
WebPage.renderer = null;

/**
 * Grid layout of cells that are rendered or are waiting for rendering.
 */
WebPage.cells = new Array();

/**
 * Current renderer type.
 */
WebPage.rendererType = null;

/**
 * Camera controls affected by mouse movement.
 */
WebPage.controls = null;

/**
 * Last rendered time.
 */
WebPage.lastRenderingTime = 0;


/**
 * Initializes page.
 */
WebPage.init = function()
{
	WebPage.rendererType = enums.rendererType.RAY_TRACING;

	WebPage.rendererCanvas = new RendererCanvas();
	WebPage.rendererCanvas.init();
	
	WebPage.onViewLoaded();

	API.init(enums.apiClientType.RENDERER);		
	API.connect(WebPage._onServerConnected, WebPage._onServerDisconnect);
};


/**
 * On server-client connection.
 */
WebPage._onServerConnected = function()
{
	console.log('[WebPage] Connected to server!');

	API.isConnected = true;

	API.listen('cells/update', WebPage._onCellUpdate);
	API.listen('rendering/start', WebPage._onStartRenderingService);	
	API.listen('rendering/stop', WebPage._onStopRenderingService);	

	API.request('cells/getAll', WebPage.onGetLayout);
};	

/**
 * Server started rendering service.
 */
WebPage._onStartRenderingService = function(data)
{
	API.request('cells/getAll', WebPage.onGetLayout);
};

/**
 * Server stopped rendering service.
 */
WebPage._onStopRenderingService = function(data)
{
	previousOptions = options;
	options = null;

	WebPage.renderer.stopRendering();
	WebPage.stopRendererUi();
};

/**
 * Client has disconnected from server.
 */
WebPage._onServerDisconnect = function()
{
	console.log('[WebPage] Disconnected from server!');

	API.isConnected = false;
};

/**
 * Progress was updated.
 */
WebPage._onCellUpdate = function(data)
{
	var cells = data.cells;
	
	for (var i=0; i<cells.length; i++)
	{
		var current = cells[i];

		WebPage.tryUpdatingCell(current);
	}
};

/**
 * Starts loading GLTF model.
 */
WebPage.startLoadingGltfModel = function()
{
	console.log('[WebPage] Requesting GLTF model');	

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
 */
WebPage._initScene = function()
{
	var asyncCallback = async function(resolve, reject)
    {
		WebPage.scene = new THREE.Scene();

		if (options.SKY_CUBE_FILEPATH)
		{
			var skyImages = 
			[
				'posX.png',
				'negX.png',
				'posY.png',
				'negY.png',
				'posZ.png',
				'negZ.png'
			];
				
			WebPage.scene.background = new THREE.CubeTextureLoader().setPath(options.SKY_CUBE_FILEPATH).load(skyImages, resolve);
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
WebPage._initCamera = function()
{
	console.log('[WebPage] Initializing camera');

	if (!options.CAMERA)
	{
		return;
	}

	var loader = new THREE.ObjectLoader();

	WebPage.camera = loader.parse(options.CAMERA);
};

/**
 * Initializes lights.
 */
WebPage._initLights = function()
{
	console.log('[WebPage] Initializing lights');

	if (!options.LIGHTS)
	{
		return;
	}

	var loader = new THREE.ObjectLoader();
	
	for (let i=0; i<options.LIGHTS.length; i++)
	{
		var light = loader.parse(options.LIGHTS[i]);
		WebPage.scene.add(light);
	}

	/*var intensity = 1;

	var light = new THREE.PointLight(0xffaa55, intensity);
	light.position.set( - 200, 100, 100 );
	WebPage.scene.add( light );

	var light = new THREE.PointLight(0x55aaff, intensity);
	light.position.set( 200, -100, 100 );
	WebPage.scene.add( light );

	var light = new THREE.PointLight(0xffffff, intensity);
	light.position.set( 0, 0, -300 );
	WebPage.scene.add( light );*/
};

/**
 * Initializes renderer.
 */
WebPage._initRenderer = function()
{
	console.log('[WebPage] Initialize renderer of type "' + WebPage.rendererType + '"');

	var renderer = null;
	var canvas = document.getElementById('rendering-canvas');

	switch(WebPage.rendererType)
	{
		case enums.rendererType.RAY_TRACING:
			renderer = new RaytracingRenderer(canvas, WebPage.scene, WebPage.camera);
			break;

		case enums.rendererType.PATH_TRACING:
			new Exception.NotImplemented();
			init();
			break;
	}	
	
	WebPage.renderer = renderer;
};	

/**
 * Gets rendering grid layout. Layout is needed, so that images from other clients are displayed.
 * @async
 */
WebPage.onGetLayout = function(data)
{
	console.log('[WebPage] Grid layout drawn');


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

	WebPage.rendererCanvas.resizeCanvas();


	// -----------------------------
	// draw layout
	// -----------------------------

	WebPage.cells = data.cells;
	WebPage.rendererCanvas.createLayout(WebPage.cells);


	// -----------------------------
	// draw all already rendered cells
	// -----------------------------

	for (var i=0; i<WebPage.cells.length; i++)
	{
		var current = WebPage.cells[i];

		WebPage.tryUpdatingCell(current);

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

	WebPage.onDataLoaded();
};

/**
 * View has done loading.
 * Remove skeleton screens by removing 'loading' class from elements.
 */
WebPage.onViewLoaded = function()
{
	document.body.removeClass('loading');
};

/**
 * Initial data is loaded.
 */
WebPage.onDataLoaded = async function()
{
	/**
	 * gltf.animations; // Array<THREE.AnimationClip>
	 * gltf.scene; // THREE.Scene
	 * gltf.scenes; // Array<THREE.Scene>
	 * gltf.cameras; // Array<THREE.Camera>
	 * gltf.asset; // Object
	 */
	var gltf = await WebPage.startLoadingGltfModel();

	await WebPage._initScene();
	WebPage._initCamera();
	WebPage._initLights();
	
	WebPage._initRenderer();

	WebPage.scene.add(gltf.scene);
	
	await WebPage.renderer.prepareJsonData();

	API.request('cells/getWaiting', WebPage.onGetWaitingCells);
};

/**
 * Tries to update canvas with data from this cell.
 */
WebPage.tryUpdatingCell = function(cell)
{
	if (!cell.imageData)
	{
		return;
	}

	WebPage.rendererCanvas.updateCell(cell);
};

/**
 * Stop rendering UI.
 */
WebPage.stopRendererUi = function()
{
	document.querySelector('interface').removeClass('rendering');
	WebPage.lastRenderingTime = 0;

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
WebPage.onRendererDone = function(cells)
{
	WebPage.lastRenderingTime = window.setTimeout(WebPage.stopRendererUi, 1000);

	if (!API.isRenderingServiceRunning)
	{
		return;
	}

	WebPage.updateProgressAsync(cells, 100);
			
	API.request('cells/getWaiting', WebPage.onGetWaitingCells);
};

/**
 * Cell waiting to be rendered is received.
 */
WebPage.onGetWaitingCells = function(cells)
{
	console.log('[WebPage] Rendering cells received');

	if (!cells)
	{
		new Exception.ValueUndefined();
	}

	if (!cells.length)
	{
		new Exception.ArrayEmpty();
	}

	if (WebPage.lastRenderingTime > 0)
	{
		window.clearTimeout(WebPage.lastRenderingTime);
	}

	var cellsWaiting = new Array();

	for (let i=0; i<WebPage.cells.length; i++)
	{
		let current = WebPage.cells[i];

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
	WebPage.startRendering(cellsWaiting);
};

/**
 * Starts rendering.
 */
WebPage.startRendering = function(cellsWaiting)
{
	document.querySelector('interface').addClass('rendering');

	if (previousOptions)
	{
		let browser = new namespace.core.Browser();
		let prevWidth = (previousOptions.CANVAS_WIDTH * previousOptions.RESOLUTION_FACTOR);
		let prevHeight = (previousOptions.CANVAS_HEIGHT * previousOptions.RESOLUTION_FACTOR);

		browser.setTitle('Rendering (' + prevWidth + ' x ' + prevHeight + ')');
	}

	if (WebPage.rendererType == enums.rendererType.RAY_TRACING)
	{
		// start rendering
		WebPage.renderer.render(cellsWaiting);
	}
};

/**
 * Notifies server how much has client already rendered.
 * @async
 */
WebPage.updateProgressAsync = function(cells, progress)
{
	var data = 
	{
		cells: cells,
		progress: progress
	};

	API.request('cells/update', undefined, data);
};