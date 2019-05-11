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

		MAIN.io.on('connect', MAIN.onServerConnected);
	},


	/**
	 * On server-client connection.
	 */
	onServerConnected: function()
	{
		console.log('[Main] Connected to server!');

		MAIN.io.on(MAIN.apiUrl + 'response/renderingCells/layout', MAIN.onGetLayout);

		MAIN.getLayoutAsync();
	},

	requestRecalculateLayout: function()
	{
		MAIN.io.emit(MAIN.apiUrl + 'request/renderingCells/recalculateLayout', null);
	},

	/**
	 * Gets rendering grid layout. Layout is needed, so that images from other clients are displayed.
	 * @async
	 */
	getLayoutAsync: function()
	{
		MAIN.io.emit(MAIN.apiUrl + 'request/renderingCells/layout', null);
	},
	onGetLayout: function(data)
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