// -----------------------------
// import SocketIO
// -----------------------------
var io;

var API =
{
	onConnect: new BasicEvent(),
	onGetLayout: new BasicEvent(),
	onRequestCell: new BasicEvent(),
	onUpdateProgress: new BasicEvent(),

	_requestCallbacks: [],

	/**
	 * Ajax request to server.
	 * @async
	 */
	request: function(url, data, callback)
	{
		data = data ? data : null;
		url = GLOBALS.apiUrl + '/request' + '/' + url;

		console.log('[Globals] Requesting ' + url);

		io.emit(url, data, callback);
	},

	/**
	 * Ajax response from server.
	 */
	response: function(url, callback)
	{
		url = GLOBALS.apiUrl + '/response' + '/' + url;

		io.on(url, callback);
	},

	

	init: function(clientType)
	{
		io = io(HOSTING_URL, { query: "clientType=" + clientType });

		io.on('connect', GLOBALS._onServerConnected);

		var url = GLOBALS.apiUrl + '/response' + '/';

		/*io.on(url + 'renderingCells/layout', GLOBALS.);


		API.response('renderingCells/cell', GLOBALS.);
		API.response('renderingCells/updateProgress', GLOBALS.);*/
	}
};