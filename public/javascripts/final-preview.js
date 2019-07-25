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
	 * Socket io instance.
	 */
	io: null,

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

		GLOBALS.layout = new CanvasLayout(layoutWrapperV);

		API.init('admin', GLOBALS._onServerConnected, GLOBALS._onServerDisconnect);
		API.listen('renderingCells/updateProgress', GLOBALS._onUpdateProgress);
	},


	/**
	 * On server-client connection.
	 * @private
	 */
	_onServerConnected: function()
	{
		console.log('[Main] Connected to server!');

		API.request('renderingCells/layout', GLOBALS._onGetLayout);
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
	 * @private
	 */
	_onGetLayout: function(data)
	{
		console.log('[Main] Layout is received from server');

		
		// -----------------------------
		// draw layout
		// -----------------------------

		GLOBALS.layout.createLayout(data);


		// -----------------------------
		// draw all cells that are already rendered
		// -----------------------------
		
		for (var i=0; i<data.length; i++)
		{
			var current = data[i];

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
		// remove .loading flag
		// -----------------------------

		document.body.removeClass('loading');
	},

	/**
	 * Progress was updated.
	 */
	_onUpdateProgress: function(data)
	{
		var cell = data.cell;
		GLOBALS.tryUpdatingCell(cell);
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

		GLOBALS.layout.updateCell(cell);
	}
};

window.onload = GLOBALS.init();