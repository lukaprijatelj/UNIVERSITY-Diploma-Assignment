var options = null;

/**
 * Globals. 
 */
var GLOBALS =
{

	init: function()
	{		
		GLOBALS.rendererCanvas = new RendererCanvas();
		GLOBALS.rendererCanvas.init();
		
		GLOBALS.onViewLoaded();

		API.init(enums.apiClientType.RENDERING_OUTPUT);		
		API.connect(GLOBALS._onServerConnected, GLOBALS._onServerDisconnect);
	},


	/**
	 * On server-client connection.
	 * @private
	 */
	_onServerConnected: function()
	{
		console.log('[Globals] Connected to server!');

		API.isConnected = true;

		API.listen('cells/update', GLOBALS._onCellUpdate);
		API.listen('rendering/start', GLOBALS._onStartRenderingService);	
		API.listen('rendering/stop', GLOBALS._onStopRenderingService);	

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
	 * Server started rendering service.
	 */
	_onStartRenderingService: function(data)
	{
		API.request('cells/getAll', GLOBALS.onGetLayout);
	},

	/**
	 * Server stopped rendering service.
	 */
	_onStopRenderingService: function(data)
	{
		options = null;
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

		let browser = new namespace.core.Browser();
		browser.setTitle('Output (' + options.RESOLUTION_WIDTH + ' x ' + options.RESOLUTION_HEIGHT + ')');

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
	},

	/**
	 * Initial data is loaded.
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
	 * Progress was updated.
	 */
	_onCellUpdate: function(data)
	{
		var cells = data.cells;
		
		for (var i=0; i<cells.length; i++)
		{
			var current = cells[i];

			GLOBALS.tryUpdatingCell(current);
		}
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
	}
};