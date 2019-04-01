
var RENDERER =
{
	/**
	 * Is client connected to server.
	 */
	isConnected: false,

	/**
	 * Socket io instance.
	 */
	io: null,


	init: function()
	{
		RENDERER.io = io('http://localhost:80/', { reconnect: true });

		
		RENDERER.io.on('connect', RENDERER.onServerConnected);
	},


	/**
	 * On server-client connection.
	 */
	onServerConnected: function()
	{
		RENDERER.isConnected = true;

		console.log('Connected!');

		RENDERER.io.on('gridLayouts', RENDERER.onGridLayout);
		//RENDERER.notifyProgressUpdate(100);
	},

	onGridLayout: function(data)
	{
		var gridLayout = document.getElementById('grid-layout');

		// clear element
		gridLayout.innerHTML = '';

		for (var i=0; i<data.length; i++)
		{
			var current = data[i];
	
			if (i > 0 && data[i - 1].row != current.row)
			{
				gridLayout.innerHTML += '<br>';
			}

			gridLayout.innerHTML += '<div class="render-cell" style="width: ' + current.width + 'px; height: ' + current.height + 'px;"></div>';
		}
	},

	drawGridLayout: function()
	{
		var gridLayout = document.getElementById('grid-layout');


	},

	/**
	 * Gets rendering grid layout. Layout is needed, so that images from other clients are displayed.
	 * @async
	 */
	getGridLayout: function()
	{

	},

	/**
	 * Gets render job info.
	 * @async
	 */
	getRenderJob: function()
	{

	},

	getScreenshot: function()
	{
		//var dataURL = canvas.toDataURL();
	},

	/**
	 * Notifies server how much has client already rendered.
	 * @async
	 */
	notifyProgressUpdate: function(value)
	{
		if (typeof value === 'undefined')
		{
			return;
		}

		RENDERER.io.emit('progressUpdate', value.toString());
	}
};

RENDERER.init();