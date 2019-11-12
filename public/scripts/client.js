'use strict';

var WebApplication = new namespace.core.WebApplication('UNIVERSITY-Diploma-Assignment');

/** ----- NOTES: ----- */ 
// when exporting .obj scene from Cinema4D please use meters as a unit. 
// then use coverter command "obj2gltf -i input.obj -o output.gltf"

var options = null;
var previousOptions = null;

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
 * Last rendered time.
 */
globals.lastRenderingTime = 0;

/**
 * Rendering canvas.
 */
globals.rendererCanvas = null;




var cache = new namespace.core.Cache();

/**
 * Grid layout of cells that are rendered or are waiting for rendering.
 */
cache.cells = new Array();

/**
 * List of clients connected to server.
 */
cache.clients = new Array();



var ClientPage = new namespace.core.WebPage('Client');

/**
 * Initializes page.
 */
ClientPage.init = function()
{
	console.log('[ClientPage] Initializing!');

	if (navigator.hardwareConcurrency < 2)
	{
		// 1 thread needed for socketIO
		// at least 1 thread needed for rendering
		new Exception.Other('Client does not have enough cores/threads to work properly!');
	}

	let interfaceHtml = new namespace.html.ScrollViewer(document.querySelector('interface'));
	interfaceHtml.removeClass('loading');
	
	let rendererCanvas = new namespace.html.Canvas();	
	rendererCanvas.id = 'rendering-canvas';
	rendererCanvas.width = 0;
	rendererCanvas.height = 0;
	interfaceHtml.appendChild(rendererCanvas);

	let flagCanvasOther = new namespace.html.DOMCanvas();
	flagCanvasOther.id = 'flag-canvas-others';
	flagCanvasOther.hide();
	interfaceHtml.appendChild(flagCanvasOther);

	let flagCanvasThis = new namespace.html.DOMCanvas();
	flagCanvasThis.id = 'flag-canvas-this';
	flagCanvasThis.hide();
	interfaceHtml.appendChild(flagCanvasThis);

	globals.rendererCanvas = new namespace.html.RendererCanvas();
	globals.rendererCanvas.init();
	
	API.init(namespace.enums.apiClientType.RENDERER);		
	API.connect(ClientPage._onServerConnected, ClientPage._onServerDisconnect);
};

/**
 * On server-client connection.
 */
ClientPage._onServerConnected = async function()
{
	console.log('[ClientPage] Connected to server!');

	if (API.areListenersAttached == false)
	{
		API.areListenersAttached = true;

		API.listen('cells/update', 'ClientPage._onCellsUpdate');

		API.listen('rendering/start', 'ClientPage._onStartRenderingService');	
		API.listen('rendering/stop', 'ClientPage._onStopRenderingService');	
		API.listen('rendering/pause', 'ClientPage._onPauseRenderingService');	
		API.listen('rendering/resume', 'ClientPage._onResumeRenderingService');	

		API.listen('clients/add', 'ClientPage._onClientAdd');
		API.listen('clients/remove', 'ClientPage._onClientRemove');
	}
	
	let data;

	data = await API.request('clients/getAll');
	ClientPage._updateClients(data);

	data = await API.request('rendering/getState');
	ClientPage._updateRenderingServiceState(data);

	ClientPage._startRenderingService();
};	

/**
 * Updates clients list.
 */
ClientPage._updateClients = function(data)
{
	console.log('[ClientPage] Updating clients list');

	cache.clients = data;
};

/**
 * Server has notified us that clients were updated.
 */
ClientPage._onClientAdd = function(thread, data, resolve, reject)
{
	console.log('[ClientPage] Detected that new client has connected');

	cache.clients.push(data);
};

/**
 * Client has removed.
 */
ClientPage._onClientRemove = function(thread, data, resolve, reject)
{
	console.log('[ClientPage] Detected that client has disconnected');

	let sessionId = data;

	for (let i=0; i<cache.clients.length; i++)
	{
		let current = cache.clients[i];

		if (current.sessionId == sessionId)
		{
			Array.removeAtIndex(cache.clients, i);
			break;
		}
	}


	// -----------------------------
	// remove cells that were flaged to removed client
	// -----------------------------

	for (let i=0; i<cache.cells.length; i++)
	{
		let current = cache.cells[i];

		if (!current.socketIoClient)
		{
			continue;
		}

		if (current.socketIoClient.sessionId != sessionId)
		{
			continue;
		}

		globals.rendererCanvas.removeOthersCell(current);

		current.socketIoClient = null;
	}
};

/**
 * Starts rendering procedure.
 */
ClientPage._startRenderingService = async function()
{
	let data;
	
	data = await API.request('rendering/getOptions');
	ClientPage._updateOptions(data);

	data = await API.request('cells/getAll');
	ClientPage._updateCells(data);

	if (API.renderingServiceState == namespace.enums.renderingServiceState.IDLE)
	{
		// nothing to render
		return;
	}

	ClientPage.openScene();
};

/**
 * Server started rendering service.
 */
ClientPage._onStartRenderingService = function(thread, data, resolve, reject)
{
	API.renderingServiceState = data;

	ClientPage._startRenderingService();
};

/**
 * Server stopped rendering service.
 */
ClientPage._onStopRenderingService = function(thread, data, resolve, reject)
{
	API.renderingServiceState = data;

	previousOptions = options;
	options = null;	

	globals.renderer.stopRendering();
	ClientPage.stopRendererUi();
};

/**
 * Server stopped rendering service.
 */
ClientPage._onPauseRenderingService = function(thread, data, resolve, reject)
{
	console.log('[ClientPage] Pausing rendering service!');

	API.renderingServiceState = data;
};

/**
 * Server stopped rendering service.
 */
ClientPage._onResumeRenderingService = function(thread, data, resolve, reject)
{
	console.log('[ClientPage] Resuming rendering service!');

	API.renderingServiceState = data;

	globals.renderer.resumeRendering();
};

/**
 * Client has disconnected from server.
 */
ClientPage._onServerDisconnect = function()
{
	console.log('[ClientPage] Disconnected from server!');

	if (API.renderingServiceState != namespace.enums.renderingServiceState.IDLE)
	{
		ClientPage._onStopRenderingService();
	}
};

/**
 * Progress was updated.
 */
ClientPage._onCellsUpdate = function(thread, data, resolve, reject)
{	
	let cells = data;

	for (let i=0; i<cells.length; i++)
	{
		let current = cells[i];
		Object.parse(current);
	}

	let j = 0;

	for (let i=0; i<cache.cells.length; i++)
	{
		let current = cache.cells[i];
		let newCell = cells[j];

		if (current._id != newCell._id)
		{
			continue;
		}

		// remove old cell
		GarbageCollector.dispose(cache.cells[i]);

		// swap old cell with new cell
		Array.setAtIndex(cache.cells, newCell, i);

		j++;

		if (j == cells.length)
		{
			break;
		}
	}

	for (let i=0; i<cells.length; i++)
	{
		let current = cells[i];

		if (current.progress == 100)
		{
			globals.rendererCanvas.updateCellImage(current);
			globals.rendererCanvas.removeOthersCell(current);
		}
		else
		{
			globals.rendererCanvas.addOthersCell(current);
		}		
	}
};

/**
 * Starts loading GLTF model.
 */
ClientPage._loadGltfModel = function()
{
	console.log('[ClientPage] Requesting GLTF model');	

	var onSuccess = (resolve, reject) =>
	{
		let onProgress = function(xhr)
		{
			// occurs when one of the files is done loading
			var percentage = xhr.loaded / xhr.total * 100;
		
			console.log('[ClientPage] GLTF model is ' + percentage + '% loaded');	
		};
		let onSuccess = (gltf) =>
		{
			console.log('[ClientPage] Scene finished loading');

			resolve(gltf);
		};

		var loader = new THREE.GLTFLoader();
		loader.load(options.SCENE_FILEPATH, onSuccess, onProgress, reject);
	};
	return new Promise(onSuccess);
};

/**
 * Initializes scene.
 */
ClientPage._initScene = function(gltfScene)
{
	globals.scene = new THREE.Scene();
	globals.scene.add(gltfScene);
};

/**
 * Sets background for scene.
 */
ClientPage._initSceneBackground = function(skyCubeFilePath, skyCubeImages)
{
	return new Promise((resolve, reject) =>
	{
		if (skyCubeFilePath)
		{
			var loader = new THREE.CubeTextureLoader();
			loader.setPath(skyCubeFilePath);

			globals.scene.background = loader.load(skyCubeImages, resolve, undefined, reject);
		}	
		else
		{
			onProgress(100);
			onLoad();
		}	
	});
};

/**
 * Intializes camera in the scene.
 */
ClientPage._initCamera = function(gltfCamera)
{
	console.log('[ClientPage] Initializing camera');

	if (!gltfCamera)
	{
		return;
	}

	var loader = new THREE.ObjectLoader();

	globals.camera = loader.parse(gltfCamera);
};

/**
 * Initializes lights.
 */
ClientPage._initLights = function(gltfLights)
{
	console.log('[ClientPage] Initializing lights');

	if (!gltfLights)
	{
		return;
	}

	var loader = new THREE.ObjectLoader();
	
	for (let i=0; i<gltfLights.length; i++)
	{
		var light = loader.parse(gltfLights[i]);
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
		case namespace.enums.rendererType.RAY_TRACING:
			renderer = new RaytracingRenderer();
			break;

		case namespace.enums.rendererType.PATH_TRACING:
			renderer = new PathtracingRenderer();
			break;
	}	
	
	globals.renderer = renderer;
};	

/**
 * Updates options.
 */
ClientPage._updateOptions = function(dataOptions)
{
	console.log('[ClientPage] Updating options');

	if (!dataOptions)
	{
		return;
	}

	previousOptions = options;
	options = dataOptions;	

	// adjust MAX threads to the capabilities of the client
	options.MAX_THREADS = Math.min(options.MAX_THREADS, navigator.hardwareConcurrency - 1);

	if (previousOptions)
	{
		let browser = new namespace.core.Browser();
		let prevWidth = (previousOptions.CANVAS_WIDTH * previousOptions.RESOLUTION_FACTOR);
		let prevHeight = (previousOptions.CANVAS_HEIGHT * previousOptions.RESOLUTION_FACTOR);
		browser.setTitle('Idle (' + prevWidth + ' x ' + prevHeight + ')');
	}

	globals.rendererCanvas.resize();
};

/**
 * Updates rendering service state from server.
 */
ClientPage._updateRenderingServiceState = function(renderingServiceState)
{
	console.log('[ClientPage] Updating rendering service state');

	API.renderingServiceState = renderingServiceState;	
};

/**
 * Gets rendering grid layout. Layout is needed, so that images from other clients are displayed.
 */
ClientPage._updateCells = function(cells)
{
	console.log('[ClientPage] Updating cells');

	for (let i=0; i<cells.length; i++)
	{
		let current = cells[i];
		Object.parse(current);
	}

	// -----------------------------
	// draw all already rendered cells
	// -----------------------------
	cache.cells = new Array(cells.length);

	for (let i=0; i<cells.length; i++)
	{
		let current = cells[i];

		if (current.progress == 100)
		{
			globals.rendererCanvas.updateCellImage(current);
		}
		else if (current.socketIoClient)
		{
			globals.rendererCanvas.addOthersCell(current);
		}

		cache.cells[i] = current;
	}	
};

/**
 * Initial data is loaded.
 */
ClientPage.openScene = async function()
{
	//try
	{
		/**
		 * gltf.animations; // Array<THREE.AnimationClip>
		 * gltf.scene; // THREE.Scene
		 * gltf.scenes; // Array<THREE.Scene>
		 * gltf.cameras; // Array<THREE.Camera>
		 * gltf.asset; // Object
		 */
		var gltf = await ClientPage._loadGltfModel();
		
		await ClientPage._initScene(gltf.scene);
		await ClientPage._initSceneBackground(options.SKY_CUBE_FILEPATH, options.SKY_CUBE_IMAGES);
		
		ClientPage._initCamera(options.CAMERA);
		ClientPage._initLights(options.LIGHTS);		


		ClientPage._initRenderer();

return;
	

		globals.renderer.prepareJsonData();
		globals.renderer.initScene();
		globals.renderer.initCamera();
		globals.renderer.initLights();		

		let cells = await API.request('cells/getWaiting');
		ClientPage._updateWaitingCells(cells);
	}
	/*catch (err)
	{
		console.error(err.message);
	}	*/
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
ClientPage.onRendererDone = async function(cells)
{	
	globals.lastRenderingTime = window.setTimeout(ClientPage.stopRendererUi, 1000);

	if (API.renderingServiceState == namespace.enums.renderingServiceState.IDLE)
	{
		return;
	}

	for (let i=0; i<cells.length; i++)
	{
		let current = cells[i];

		Object.toJson(current);
	}

	await API.request('cells/update', cells);
			
	let waitingCells = await API.request('cells/getWaiting');
	ClientPage._updateWaitingCells(waitingCells);
};

/**
 * Cell waiting to be rendered is received.
 */
ClientPage._updateWaitingCells = function(cells)
{
	console.log('[ClientPage] Rendering cells received');

	if (!cells)
	{
		new Exception.ValueUndefined('No waiting cells!');
	}

	if (!cells.length)
	{
		new Exception.ArrayEmpty('No waiting cells!');
	}

	if (globals.lastRenderingTime > 0)
	{
		window.clearTimeout(globals.lastRenderingTime);
	}

	for (let i=0; i<cells.length; i++)
	{
		let current = cells[i];
		Object.parse(current);
	}

	let j = 0;

	for (let i=0; i<cache.cells.length; i++)
	{
		let current = cache.cells[i];
		let newCell = cells[j];

		if (current._id != newCell._id)
		{
			continue;
		}

		// swap old cell with new cell
		cache.cells[i] = newCell;
		j++;

		if (j == cells.length)
		{
			break;
		}
	}

	// must start new thread because socketIO will retry call if function is not finished in X num of miliseconds
	// heavy duty operation
	ClientPage.startRendering(cells);
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

	if (options.RENDERER_TYPE == namespace.enums.rendererType.RAY_TRACING)
	{
		// start rendering
		globals.renderer.setWaitingCells(cellsWaiting);
		globals.renderer.startRendering();
	}
};