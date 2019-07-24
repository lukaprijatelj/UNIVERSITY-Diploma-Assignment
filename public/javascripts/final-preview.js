// -----------------------------
// import SocketIO
// -----------------------------
var io = io(HOSTING_URL, { query: "clientType=admin" });


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
		io.on('connect', GLOBALS._onServerConnected);	
		
		var layoutWrapperV = document.querySelector('wrapper.layout');

		GLOBALS.layout = new CanvasLayout(layoutWrapperV);
	},


	/**
	 * Ajax request to server.
	 * @async
	 */
	request: function(url, data)
	{
		data = data ? data : null;
		url = GLOBALS.apiUrl + '/request' + '/' + url;

		console.log('[Main] Requesting "' + url + '"');

		io.emit(url, data);
	},

	/**
	 * Ajax response from server.
	 */
	response: function(url, callback)
	{
		url = GLOBALS.apiUrl + '/response' + '/' + url;

		io.on(url, callback);
	},

	/**
	 * On server-client connection.
	 * @private
	 */
	_onServerConnected: function()
	{
		console.log('[Main] Connected to server!');

		// wire response callbacks
		API.response('renderingCells/layout', GLOBALS._onGetLayout);

		API.request('renderingCells/layout');
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