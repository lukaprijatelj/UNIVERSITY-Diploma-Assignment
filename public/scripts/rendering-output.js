var WebApplication = new namespace.core.WebApplication('UNIVERSITY-Diploma-Assignment');
var options = null;

var RenderingOutputPage = new namespace.core.WebPage('Rendering-output');
var globals = new namespace.core.Globals();


/**
 * Initializes page.
 */
RenderingOutputPage.init = function()
{		
	RenderingOutputPage.rendererCanvas = new RendererCanvas();
	RenderingOutputPage.rendererCanvas.init();
	
	RenderingOutputPage.onViewLoaded();

	API.init(enums.apiClientType.RENDERING_OUTPUT);		
	API.connect(RenderingOutputPage._onServerConnected, RenderingOutputPage._onServerDisconnect);
};


/**
 * On server-client connection.
 * @private
 */
RenderingOutputPage._onServerConnected = async function()
{
	console.log('[RenderingOutputPage] Connected to server!');

	API.isConnected = true;

	API.listen('cells/update', RenderingOutputPage._onCellUpdate);
	API.listen('rendering/start', RenderingOutputPage._onStartRenderingService);	
	API.listen('rendering/stop', RenderingOutputPage._onStopRenderingService);	

	let data = await API.request('cells/getAll');
	RenderingOutputPage.onGetLayout(data);
};

/**
 * Client has disconnected from server.
 */
RenderingOutputPage._onServerDisconnect = function()
{
	console.log('[RenderingOutputPage] Disconnected from server!');

	API.isConnected = false;
};

/**
 * Server started rendering service.
 */
RenderingOutputPage._onStartRenderingService = async function()
{
	let data = await API.request('cells/getAll');
	RenderingOutputPage.onGetLayout(data);
};

/**
 * Server stopped rendering service.
 */
RenderingOutputPage._onStopRenderingService = function(data)
{
	options = null;
};

/**
 * Gets rendering grid layout. Layout is needed, so that images from other clients are displayed.
 * @async
 */
RenderingOutputPage.onGetLayout = function(data)
{
	console.log('[RenderingOutputPage] Grid layout drawn');


	// -----------------------------
	// update options
	// -----------------------------

	if (!data.options)
	{
		return;
	}

	options = data.options;

	let browser = new namespace.core.Browser();
	let optionsWidth = (options.CANVAS_WIDTH * options.RESOLUTION_FACTOR);
	let optionsHeight = (options.CANVAS_HEIGHT * options.RESOLUTION_FACTOR);

	browser.setTitle('Output (' + optionsWidth + ' x ' + optionsHeight + ')');

	RenderingOutputPage.rendererCanvas.resize();


	// -----------------------------
	// draw layout
	// -----------------------------

	Cache.cells = data.cells;


	// -----------------------------
	// draw all already rendered cells
	// -----------------------------

	for (var i=0; i<Cache.cells.length; i++)
	{
		var current = Cache.cells[i];

		RenderingOutputPage.tryUpdatingCell(current);
	}
};

/**
 * Initial data is loaded.
 * Remove skeleton screens by removing 'loading' class from elements.
 */
RenderingOutputPage.onViewLoaded = function()
{
	// -----------------------------
	// remove .loading flag
	// -----------------------------

	document.body.removeClass('loading');
};

/**
 * Progress was updated.
 */
RenderingOutputPage._onCellUpdate = function(data)
{
	var cells = data.cells;
	
	for (var i=0; i<cells.length; i++)
	{
		var current = cells[i];

		RenderingOutputPage.tryUpdatingCell(current);
	}
};

/**
 * Tries to update canvas with data from this cell.
 */
RenderingOutputPage.tryUpdatingCell = function(cell)
{
	if (!cell.imageData)
	{
		return;
	}

	RenderingOutputPage.rendererCanvas.updateCellImage(cell);
};