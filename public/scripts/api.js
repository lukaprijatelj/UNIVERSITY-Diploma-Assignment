var API =
{	
	/**
	 * Is SocketIO currently connected to server.
	 * @type {boolean}
	 */
	isConnected: false,

	/**
	 * Webworker thread instance.
	 */
	thread: null,

	/**
	 * Is rendering service running on server.
	 * @type {boolean}
	 */
	renderingServiceState: 'idle',

	/**
	 * Ajax request to server.
	 * @async
	 */
	request: function(url, data)
	{
		let args =
		{
			url: url,
			data: data
		};
		return API.thread.invokeRequest('request', args);
	},

	/**
	 * Ajax response from server.
	 */
	listen: function(url, callbackUrl)
	{
		let data =
		{
			url: url,
			callbackUrl: callbackUrl
		};
		API.thread.invoke('listen', data);
	},

	/**
	 * Connects client to server.
	 */
	connect: function(onConnect, onDisconnect)
	{
		API.isConnected = true;

		API.onConnect = () =>
		{
			API.isConnected = true;
			onConnect();
		};

		API.onDisconnect = () =>
		{
			API.isConnected = false;
			onDisconnect();
		};

		API.thread.invoke('connect', window.location.hostname);
	},

	/**
	 * Disconnects client from server.
	 */
	disconnect: function()
	{
		API.thread.invoke('disconnect');
	},
	
	/**
	 * Initializes api.
	 */
	init: function(clientType)
	{
		console.log('[API] Api thread initialized');

		let thread = new namespace.core.Thread('./scripts/classes/ApiWebWorker.js');
		API.thread = thread;

		thread.invoke('init', clientType);
	}
};