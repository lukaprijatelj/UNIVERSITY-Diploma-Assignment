// -----------------------------
// import SocketIO
// -----------------------------
var socket = null;

var API =
{
	/**
	 * Base url API access.
	 */
	apiUrl: '/api',
	
	/**
	 * Is SocketIO currently connected to server.
	 * @type {boolean}
	 */
	isConnected: false,

	/**
	 * Type of the client.
	 * @type {string}
	 */
	clientType: String(),

	/**
	 * Is rendering service running on server.
	 * @type {boolean}
	 */
	isRenderingServiceRunning: false,

	/**
	 * Ajax request to server.
	 * @async
	 */
	request: function(url, callback, data)
	{
		if(!socket)
		{
			new Exception.ValueUndefined();
		}

		data = data ? data : null;
		url = API.apiUrl + '/' + url;

		console.log('[Api] Requesting ' + url);

		socket.emit(url, data, callback);
	},

	/**
	 * Ajax response from server.
	 */
	listen: function(url, callback)
	{
		if(!socket)
		{
			new Exception.ValueUndefined();
		}

		url = API.apiUrl + '/' + url;

		socket.on(url, callback);
	},

	/**
	 * Connects client to server.
	 */
	connect: function(onConnect, onDisconnect)
	{
		socket = io.connect(window.location.hostname + ':' + SOCKETIO_PORT, { query: "clientType=" + API.clientType });

		socket.on('connect', onConnect);
		socket.on('disconnect', onDisconnect);
	},

	/**
	 * Disconnects client from server.
	 */
	disconnect: function()
	{
		socket.disconnect();
	},
	
	/**
	 * Initializes api.
	 */
	init: function(clientType)
	{
		API.clientType = clientType;		
	}
};