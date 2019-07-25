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
	cells: [],
	
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

		if (GLOBALS.layoutType == enums.layoutType.GRID)
		{
			GLOBALS.layout = new GridLayout(layoutWrapperV);
		}
		else if (GLOBALS.layoutType == enums.layoutType.CANVAS)
		{
			GLOBALS.layout = new CanvasLayout(layoutWrapperV);
		}

		API.init('admin');	
		API.connect(GLOBALS._onServerConnected, GLOBALS._onServerDisconnect);
		API.listen('renderingCells/updateProgress', GLOBALS._onUpdateProgress);
	},

	/**
	 * On server-client connection.
	 * @private
	 */
	_onServerConnected: function()
	{
		console.log('[Main] Connected to server!');

		API.isConnected = true;

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
	 * One of the cells was updated
	 */
	_onUpdateProgress: function(data)
	{
		var cell = data.cell;

		GLOBALS.tryUpdatingCell(cell);
	},

	/**
	 * Sends request to recalculate grid layout.
	 * @private
	 */
	_onRecalculateLayoutClick: function()
	{
		API.request('renderingCells/recalculateLayout', Function.empty);
		API.request('renderingCells/layout', GLOBALS._onGetLayout);
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
		GLOBALS.cells = data;

		console.log('[Main] Layout is received from server');

		
		// -----------------------------
		// draw layout
		// -----------------------------

		GLOBALS.layout.createLayout(GLOBALS.cells);



		// -----------------------------
		// draw all cells that are already rendered
		// -----------------------------
		
		for (var i=0; i<GLOBALS.cells.length; i++)
		{
			var current = GLOBALS.cells[i];

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