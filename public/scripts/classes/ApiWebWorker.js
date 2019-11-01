importScripts('../socket.io/socket.io.js');
importScripts('../constants.js');
importScripts('../../externals/namespace-core/namespace-core.js');
importScripts('../../externals/namespace-enums/namespace-enums.js');

// -----------------------------
// import SocketIO
// -----------------------------
var socket = null;

/**
 * Main thread.
 */
var mainThread = namespace.core.MainThread;

/**
 * Base url API access.
 */
var apiUrl = '/api';

/**
 * Is SocketIO currently connected to server.
 * @type {boolean}
 */
var isConnected = false;

/**
 * Type of the client.
 * @type {string}
 */
var clientType = '';

/**
 * Is rendering service running on server.
 * @type {boolean}
 */
var renderingServiceState = 'idle';

/**
 * Ajax request to server.
 * @async
 */
function request(thread, data, resolve, reject)
{
	if(!socket)
	{
		new Exception.ValueUndefined();
	}

	if(!isConnected)
	{
		new Exception.Other('No longer connected to server!');
	}

	let args = data.data ? data.data : new Object();
	let url = apiUrl + '/' + data.url;

	console.log('[ApiWebWorker] Requesting ' + url);

	socket.emit(url, args, resolve);
}

/**
 * Ajax response from server.
 */
function listen(thread, data)
{
	if(!socket)
	{
		new Exception.ValueUndefined();
	}

	if(!isConnected)
	{
		new Exception.Other('No longer connected to server!');
	}

	let url = apiUrl + '/' + data.url;

	socket.on(url, listenCallback.bind(null, data.callbackUrl));
}
function listenCallback(callbackUrl, data)
{
	mainThread.invoke(callbackUrl, data);
}

/**
 * Connects client to server.
 */
function connect(thread, data)
{
	let initOptions =
	{
		pingTimeout: 1000 * 60
	};

	let hostname = data;
	socket = io.connect(hostname + ':' + SOCKETIO_PORT, { query: "clientType=" + clientType });

	socket.on('connect', () =>
	{
		isConnected = true;
		mainThread.invoke('API.onConnect');
	});

	socket.on('disconnect', () =>
	{
		isConnected = false;
		mainThread.invoke('API.onDisconnect');
	});
}

/**
 * Disconnects client from server.
 */
function disconnect()
{
	socket.disconnect();
}

/**
 * Initializes api.
 */
function init(thread, data)
{
	clientType = data;		
}