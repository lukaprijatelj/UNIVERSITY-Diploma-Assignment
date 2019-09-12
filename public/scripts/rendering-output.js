var WebApplication = new namespace.core.WebApplication('UNIVERSITY-Diploma-Assignment');
var options = null;


var WebPage = new namespace.core.WebPage('Rendering-output');

/**
 * Initializes page.
 */
WebPage.init = function()
{		
	WebPage.rendererCanvas = new RendererCanvas();
	WebPage.rendererCanvas.init();
	
	WebPage.onViewLoaded();

	API.init(enums.apiClientType.RENDERING_OUTPUT);		
	API.connect(WebPage._onServerConnected, WebPage._onServerDisconnect);
};


/**
 * On server-client connection.
 * @private
 */
WebPage._onServerConnected = function()
{
	console.log('[Globals] Connected to server!');

	API.isConnected = true;

	API.listen('cells/update', WebPage._onCellUpdate);
	API.listen('rendering/start', WebPage._onStartRenderingService);	
	API.listen('rendering/stop', WebPage._onStopRenderingService);	

	API.request('cells/getAll', WebPage.onGetLayout);
};

/**
 * Client has disconnected from server.
 */
WebPage._onServerDisconnect = function()
{
	console.log('[Globals] Disconnected from server!');

	API.isConnected = false;
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
	options = null;
};

/**
 * Gets rendering grid layout. Layout is needed, so that images from other clients are displayed.
 * @async
 */
WebPage.onGetLayout = function(data)
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

	let browser = new namespace.core.Browser();
	let optionsWidth = (options.CANVAS_WIDTH * options.RESOLUTION_FACTOR);
	let optionsHeight = (options.CANVAS_HEIGHT * options.RESOLUTION_FACTOR);

	browser.setTitle('Output (' + optionsWidth + ' x ' + optionsHeight + ')');

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
	}
};

/**
 * Initial data is loaded.
 * Remove skeleton screens by removing 'loading' class from elements.
 */
WebPage.onViewLoaded = function()
{
	// -----------------------------
	// remove .loading flag
	// -----------------------------

	document.body.removeClass('loading');
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