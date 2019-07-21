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
	 * Grid layout of cells that are rendered or are waiting for rendering.
	 */
	renderingCells: [],
	
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
		
		var layoutWrapperV = document.getElementById('layout-wrapper');

		if (GLOBALS.layoutType == enums.layoutType.GRID)
		{
			GLOBALS.layout = new GridLayout(layoutWrapperV);
		}
		else if (GLOBALS.layoutType == enums.layoutType.CANVAS)
		{
			GLOBALS.layout = new CanvasLayout(layoutWrapperV);
		}
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

		GLOBALS.drawOnCell(cell);
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
		a.href = window.location.origin + '/client';    
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

		GLOBALS.layout.createLayout(data);
		
		for (var i=0; i<data.length; i++)
		{
			var current = data[i];

			if (!current.imageData)
			{
				continue;
			}

			GLOBALS.layout.updateCell(current);
		}

		GLOBALS.onLoaded();
	},

	/**
	 * Initial data is loaded.
	 * Remove skeleton screens by removing 'loading' class from elements.
	 */
	onLoaded: function()
	{
		for (var i=0; i<GLOBALS.renderingCells.length; i++)
		{
			var current = GLOBALS.renderingCells[i];

			GLOBALS.drawOnCell(current);
		}


		// -----------------------------
		// remove .loading flag
		// -----------------------------

		document.body.removeClass('loading');
		

		// -----------------------------
		// set default values
		// -----------------------------

		var recalculateLayoutButton = document.getElementById('recalculate-layout-button');
		recalculateLayoutButton.innerHTML = 'Recalculate layout';

		var startNewClientButton = document.getElementById('start-new-client-button');
		startNewClientButton.innerHTML = ' + ';

		var canvasWidthInput = document.getElementById('canvas-width-input');
		canvasWidthInput.value = CANVAS_WIDTH;

		var canvasHeightInput = document.getElementById('canvas-height-input');
		canvasHeightInput.value = CANVAS_HEIGHT;

		var blockWidthV = document.getElementById('block-width-input');
		blockWidthV.value = BLOCK_WIDTH;

		var blockHeightV = document.getElementById('block-height-input');
		blockHeightV.value = BLOCK_HEIGHT;

		var clientsConnectedV = document.getElementById('clients-connected-input');
		clientsConnectedV.value = 0;
	},

	/**
	 * Draws cell on the screen.
	 */
	drawOnCell: function(cell)
	{
		if (!cell.imageData)
		{
			return;
		}

		GLOBALS.layout.updateCell(cell);
	}
};

GLOBALS.init();