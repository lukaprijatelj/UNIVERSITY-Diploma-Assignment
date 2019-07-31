var options = null;

/**
 * Globals. 
 */
var GLOBALS =
{
	/**
	 * Type of the layout view.
	 */
	layoutType: enums.layoutType.CANVAS,


	init: function()
	{		
		var layoutWrapperV = document.querySelector('wrapper.layout');
		GLOBALS.rendererCanvas = new RendererCanvas(layoutWrapperV);
		GLOBALS.rendererCanvas.init();

		API.init('renderer');
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

		API.request('cells/getAll', GLOBALS._onGetLayout);
	},

	/**
	 * Client has disconnected from server.
	 */
	_onServerDisconnect: function()
	{
		API.isConnected = false;
	},

	/**
	 * Gets rendering grid layout. Layout is needed, so that images from other clients are displayed.
	 * @async
	 */
	_onGetLayout: function(data)
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
		

		GLOBALS.onLoaded();
	},

	/**
	 * Initial data is loaded.
	 * Remove skeleton screens by removing 'loading' class from elements.
	 */
	onLoaded: function()
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