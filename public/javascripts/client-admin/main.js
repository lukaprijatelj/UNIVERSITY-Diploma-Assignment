var MAIN =
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
		MAIN.io = io(MAIN.hostingUrl, { query: "clientType=admin" });

		MAIN.io.on('connect', MAIN._onServerConnected);
	},


	/**
	 * Ajax request to server.
	 * @async
	 */
	request: function(url, data)
	{
		data = data ? data : null;
		url = MAIN.apiUrl + '/request' + '/' + url;

		console.log('[Main] Requesting "' + url + '"');

		MAIN.io.emit(url, data);
	},

	/**
	 * Ajax response from server.
	 */
	response: function(url, callback)
	{
		url = MAIN.apiUrl + '/response' + '/' + url;

		MAIN.io.on(url, callback);
	},

	/**
	 * On server-client connection.
	 * @private
	 */
	_onServerConnected: function()
	{
		console.log('[Main] Connected to server!');

		// wire response callbacks
		MAIN.response('renderingCells/layout', MAIN._onGetLayout);

		MAIN.request('renderingCells/layout');
	},

	/**
	 * Sends request to recalculate grid layout.
	 * @private
	 */
	_requestLayoutRecalculation: function()
	{
		MAIN.request('renderingCells/recalculateLayout');
	},

	/**
	 * Gets rendering grid layout. Layout is needed, so that images from other clients are displayed.
	 * @private
	 */
	_onGetLayout: function(data)
	{
		MAIN.renderingCells = data;

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
	}
};

MAIN.init();