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
	hostingUrl: 'http://localhost:30002/',

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
		GLOBALS.response('renderingCells/updateProgress', GLOBALS._onUpdateProgress);

		GLOBALS.request('renderingCells/layout');
	},

	/**
	 * One of the cells was updated
	 */
	_onUpdateProgress: function(data)
	{
		var cell = data.cell;
		var imagedata = new ImageData(new Uint8ClampedArray(cell.imageData), cell.width, cell.height);

		var canvas = HTML('#cell-' + cell._id).elements[0];
		canvas.getContext('2d').putImageData(imagedata, 0, 0);
	},

	/**
	 * Sends request to recalculate grid layout.
	 * @private
	 */
	_onRecalculateLayoutClick: function()
	{
		GLOBALS.request('renderingCells/recalculateLayout');
		GLOBALS.request('renderingCells/layout');
	},

	/**
	 * Starts new client/tab for rendering.
	 * @private
	 */
	_onStartNewClientClick: function()
	{
		var a = document.createElement("a");    
		a.href = window.location.origin + '/clientRenderer';    
		a.setAttribute('target', '_blank');
		var evt = document.createEvent("MouseEvents");   
		evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, true, false, false, false, 0, null);    
		a.dispatchEvent(evt);
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

			gridLayout.append('<canvas id="cell-' + current._id + '" class="render-cell" width="' + current.width + 'px" height="' + current.height + 'px"></canvas>');
			prevCell = current;
		}
		
		HTML('#loading-curtain').hide();
		HTML('#interface').show();
	}
};

GLOBALS.init();