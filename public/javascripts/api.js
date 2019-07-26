// -----------------------------
// import SocketIO
// -----------------------------
var socket;

var API =
{
	isConnected: false,
	clientType: '',

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
		url = GLOBALS.apiUrl + '/' + url;

		console.log('[Globals] Requesting ' + url);

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

		url = GLOBALS.apiUrl + '/' + url;

		socket.on(url, callback);
	},

	/**
	 * Connects client to server.
	 */
	connect: function(onConnect, onDisconnect)
	{
		socket = io.connect(HOSTING_URL, { query: "clientType=" + API.clientType });

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
	

	init: function(clientType)
	{
		API.clientType = clientType;		
	}
};