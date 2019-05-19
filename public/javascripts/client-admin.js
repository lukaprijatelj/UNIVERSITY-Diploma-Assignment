/**
 * Globals for 
 */
var GLOBALS =
{
	/**
	 * Base url API access.
	 */
	apiUrl: '/api',

	/**
	 * Url where socketIO will be hosted.
	 */
	hostingUrl: 'http://localhost:80/',

	/**
	 * Grid layout of cells that are rendered or are waiting for rendering.
	 */
	renderingCells: [],
	
	/**
	 * Socket io instance.
	 */
	io: null,


	init: function()
	{
		GLOBALS.io = io(GLOBALS.hostingUrl, { query: "clientType=admin" });

		GLOBALS.io.on('connect', GLOBALS._onServerConnected);
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

		GLOBALS.io.emit(url, data);
	},

	/**
	 * Ajax response from server.
	 */
	response: function(url, callback)
	{
		url = GLOBALS.apiUrl + '/response' + '/' + url;

		GLOBALS.io.on(url, callback);
	},

	/**
	 * On server-client connection.
	 * @private
	 */
	_onServerConnected: function()
	{
		console.log('[Main] Connected to server!');

		// wire response callbacks
		GLOBALS.response('renderingCells/layout', GLOBALS._onGetLayout);

		GLOBALS.request('renderingCells/layout');
	},

	/**
	 * Sends request to recalculate grid layout.
	 * @private
	 */
	_onRecalculateLayoutClick: function()
	{
		GLOBALS.request('renderingCells/recalculateLayout');
	},

	/**
	 * Gets rendering grid layout. Layout is needed, so that images from other clients are displayed.
	 * @private
	 */
	_onGetLayout: function(data)
	{
		GLOBALS.renderingCells = data;

		console.log('[Main] Grid layout drawn');

		var gridLayout = HTML('#grid-layout');
		gridLayout.empty();

		var prevCell = null;

		for (var i=0; i<data.length; i++)
		{
			var current = data[i];
	
			if (prevCell && prevCell.startX > current.startX)
			{
				gridLayout.append('<br>');
			}

			gridLayout.append('<div id="cell-' + current._id + '" class="render-cell" style="width: ' + current.width + 'px; height: ' + current.height + 'px;"></div>');
			prevCell = current;
		}
		
		HTML('#loading-curtain').hide();
		HTML('#interface').show();
	}
};

GLOBALS.init();