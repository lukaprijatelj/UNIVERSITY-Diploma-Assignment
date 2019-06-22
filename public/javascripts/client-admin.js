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


	init: function()
	{
		io.on('connect', GLOBALS._onServerConnected);

		var leftSidebarV = document.getElementById("left-sidebar");
		document.getElementById("expand-button").onclick = () =>
		{
			leftSidebarV.cssAnimation('expanding-from-left', () =>
			{
				leftSidebarV.addClass('expanded');
				leftSidebarV.querySelector(".minimized-section").hide();
				leftSidebarV.querySelector(".expanded-section").show();
			});
		};

		document.getElementById("minimize-button").onclick = () =>
		{
			leftSidebarV.removeClass('expanded');
			leftSidebarV.querySelector(".minimized-section").show();
			leftSidebarV.querySelector(".expanded-section").hide();

			leftSidebarV.cssAnimation('minimize-from-right');
		};
		
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

		var gridLayout = document.getElementById('grid-layout');
		gridLayout.empty();

		var prevCell = null;

		for (var i=0; i<data.length; i++)
		{
			var current = data[i];

			if (prevCell && prevCell.startX > current.startX)
			{
				gridLayout.appendChild(HTMLElement.createElement('<br>'));
			}

			gridLayout.appendChild(HTMLElement.createElement('<div id="cell-' + current._id + '" class="render-cell" style="width:' + current.width + 'px; height:' + current.height + 'px;"></div>'));
			prevCell = current;
		}
		
		for (var i=0; i<data.length; i++)
		{
			var current = data[i];

			GLOBALS.drawOnCell(current);
		}

		document.getElementById('loading-curtain').hide();
		document.getElementById('interface').show();
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

		var divHolderV = document.getElementById("cell-" + cell._id);
		var imageV = HTMLElement.createElement('<img src="' + cell.imageData + '" id="cell-' + cell._id + '" class="render-cell" style="width:' + cell.width + 'px; height:' + cell.height + 'px;" />');

		divHolderV.parentNode.replaceChild(imageV, divHolderV);
	}
};

GLOBALS.init();