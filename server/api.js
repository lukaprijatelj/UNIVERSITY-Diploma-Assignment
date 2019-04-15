var upload = require('./upload.js');
var DATABASE = require('./database.js');

var io = require('socket.io');
var socketIo = io.listen(80);

var API =
{
	/**
	 * Base url API access.
	 */
	baseUrl: '/api',


    init: function(app)
    {
        // mutiple callbacks are separated with comma.
        // first upload.single parses file and saves it into request.file
		app.post(API.baseUrl + '/uploadScene', upload.single('fileneki'), API.onUploadScene);

		app.post(API.baseUrl + '/downloadScene', API.onDownloadScene);
		
		socketIo.on('connection', API.onConnect);
	},

	
	/**
	 * New client has connected via socket IO.
	 */
	onConnect: function(socket)
	{
		console.log('New client has connected!');

		var sessionId = socket.id;
		var ipAddress = socket.handshake.address;

		DATABASE.addRenderClient(sessionId, ipAddress, false);
		DATABASE.getGridLayouts(function(err, result) {
			socketIo.to(`${sessionId}`).emit('gridLayouts', result);
		});

		socket.on('progressUpdate', API.onProgressUpdate);		
		socket.on('disconnect', API.onDisconnect);
	},

	/**
	 * One of the clients has disconnected.
	 */
	onDisconnect: function()
	{
		var socket = this;
		var sessionId = socket.id;

		DATABASE.removeRenderClient(sessionId);

		console.log("Client has disconnected!");
	},

	/**
	 * Updates render progress of certain client.
	 */
	onProgressUpdate: function(progress)
	{
		var socket = this;
		var sessionId = socket.id;

		DATABASE.updateProgress(sessionId, progress);

		console.log('message: ' + progress);
	},

	/**
	 * Catches users scene and saves it to local storage.
	 */
    onUploadScene: function(request, response)
    {
		var filename = request.file.filename;
		var path = request.file.path;
		
		DATABASE.addUploadedFile(filename, path, function()
		{
			response.send('Scene was uploaded!');
		});
	},
	
	/**
	 * Retrieves scene for the client.
	 */
	onDownloadScene: function()
	{

	}
};

module.exports = API;