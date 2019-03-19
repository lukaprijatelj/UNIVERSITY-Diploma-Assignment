var CLIENT =
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
		CLIENT.io = io('http://localhost:80/', { reconnect: true });

		CLIENT.io.on('connect', CLIENT.onConnect);
	},


	/**
	 * On server-client connection.
	 */
	onConnect: function()
	{
		CLIENT.isConnected = true;

		console.log('Connected!');

		CLIENT.notifyProgressUpdate(100);
	},

	/**
	 * Notifies server how much has client already rendered.
	 */
	notifyProgressUpdate: function(value)
	{
		if (typeof value === 'undefined')
		{
			return;
		}

		CLIENT.io.emit('progressUpdate', value.toString());
	}
};

CLIENT.init();