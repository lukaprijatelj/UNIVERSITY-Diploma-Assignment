var socketIo = io('http://localhost:80/', { reconnect: true });

var CLIENT =
{
	isConnected: false,

	init: function()
	{
		socketIo.on('connect', function() 
		{
			CLIENT.isConnected = true;

			console.log('Connected!');

			CLIENT.notifyRenderProgress(100);
		});
	},

	/**
	 * Notifies server how much has client already rendered.
	 */
	notifyRenderProgress: function(value)
	{
		if (typeof value === 'undefined')
		{
			return;
		}

		socketIo.emit('renderProgress', value.toString());
	}
};

CLIENT.init();