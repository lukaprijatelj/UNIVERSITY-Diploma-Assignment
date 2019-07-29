var upload = require('./upload.js');
var DATABASE = require('./database.js');
var constants = require('../public/javascripts/constants.js');
var Exception = require('../public/javascripts/classes/Exception.js');
var Warning = require('../public/javascripts/classes/Warning.js');
var options = null;

var socketIO = require('socket.io');
var io = socketIO.listen(constants.SOCKETIO_PORT);


var API =
{
	/**
	 * Base url API access.
	 */
	baseUrl: '/api',

	/**
	 * Admin client session ID.
	 */
	adminSessionId: '',

	/**
	 * Is rendering service currently running.
	 */
	isRenderingServiceRunning: false,


    init: function(app)
    {
		console.log('[Api] Initializing');

        // mutiple callbacks are separated with comma.
        // first upload.single parses file and saves it into request.file
		app.post(API.baseUrl + '/uploadScene', upload.single('Scene'), API.onUploadFile);
		
		io.on('connection', API.onConnect);
	},

	
	/**
	 * New client has connected via socket IO.
	 */
	onConnect: function(socket)
	{
		console.log('[Api] New client has connected!');

		var time = new Date();		

		var sessionId = socket.id;
		var ipAddress = socket.handshake.address;
		var isAdmin = false;
		var data = socket.handshake.query;

		if (data.clientType == "admin")
		{
			isAdmin = true;
			API.adminSessionId = sessionId;	
			
			socket.on(API.baseUrl + '/rendering/checkAdmin', API.onAdminCheckRendering); 
			socket.on(API.baseUrl + '/rendering/start', API.onStartRendering);	
			socket.on(API.baseUrl + '/rendering/stop', API.onStopRendering);
		}
		
		DATABASE.addRenderClient(sessionId, ipAddress, isAdmin);
				
		// cells
		socket.on(API.baseUrl + '/cells/getAll', API.onGetAllCells);
		socket.on(API.baseUrl + '/cells/getWaiting', API.onGetWaitingCells);
		socket.on(API.baseUrl + '/cells/update', API.onUpdateCell);			
		
		
		// when client closes tab
		socket.on('disconnect', API.onDisconnect);		

		
		// -----------------------------
		// notifies that clients list was updated
		// -----------------------------

		var result = DATABASE.getClients();
		socket.broadcast.emit(API.baseUrl + '/clients/updated', result);
	},

	/**
	 * One of the clients has disconnected.
	 */
	onDisconnect: function()
	{
		console.log("[Api] Client has disconnected!");

		var socket = this;
		var sessionId = socket.id;

		DATABASE.removeRenderClient(sessionId);		


		// -----------------------------
		// notifies that clients list was updated
		// -----------------------------

		var result = DATABASE.getClients();
		socket.broadcast.emit(API.baseUrl + '/clients/updated', result);
	},

	/**
	 * Responds with list of rendering cells.
	 */
	onAdminCheckRendering: function(data, callback)
	{
		if (!callback)
		{
			new Exception.ValueUndefined();
		}

		var socket = this;
		var result = { isRenderingServiceRunning: API.isRenderingServiceRunning };

		callback(result);
	},

	/**
	 * Responds with list of rendering cells.
	 */
	onGetAllCells: function(data, callback)
	{
		if (!callback)
		{
			new Exception.ValueUndefined();
		}

		var socket = this;
		var result = 
		{
			cells: DATABASE.getRenderingCells(),
			options: options,
			isRenderingServiceRunning: API.isRenderingServiceRunning
		}

		callback(result);
	},

	/**
	 * Respond with any of the cells still waiting to be rendered.
	 */
	onGetWaitingCells: function(data, callback)
	{
		if (API.isRenderingServiceRunning == false)
		{
			return;
		}

		if (!callback)
		{
			new Exception.ValueUndefined();
		}

		var socket = this;
		var sessionId = socket.id;

		var freeCells = DATABASE.getFreeCells(sessionId, options.NUM_OF_BLOCKS_IN_CHUNK);

		if (!freeCells)
		{
			console.log("[Api] All cells are already rendered! (aborting)");
			return;
		}

		callback(freeCells);
	},

	/**
	 * Updates render progress of certain client.
	 */
	onUpdateCell: function(data)
	{
		if (API.isRenderingServiceRunning == false)
		{
			return;
		}

		console.log("[Api] Progress was updated");

		var socket = this;

		DATABASE.updateProgress(data.cell, data.progress, data.imageData);		

		if (data.progress == 100)
		{
			// notifies ALL clients that are currently connected
			socket.broadcast.emit(API.baseUrl + '/cells/update', data);
		}
	},

	/**
	 * Catches users scene and saves it to local storage.
	 */
    onUploadFile: function(request, response)
    {
		console.log("[Api] File was uploaded");

		var filename = request.file.filename;
		var path = request.file.path;
		
		DATABASE.addUploadedFile(filename, path);

		response.send('Scene was uploaded!');		
	},

	/**
	 * Recalculates layout cells.
	 */
	onStartRendering: function(data, callback)
	{
		if (!callback)
		{
			new Exception.ValueUndefined();
		}

		var socket = this;

		// update rendering options
		options = data.options;
		

		// -----------------------------
		// recalculates cell layout
		// -----------------------------

		DATABASE.removeAllCells();

		var startY = 0;

		while(startY < options.RESOLUTION_HEIGHT)
		{
			var startX = 0;

			while(startX < options.RESOLUTION_WIDTH)
			{
				var endX = startX + options.BLOCK_WIDTH;
				var endY = startY + options.BLOCK_HEIGHT;

				var MAX_X = endX < options.RESOLUTION_WIDTH ? endX : options.RESOLUTION_WIDTH;
				var MAX_Y = endY < options.RESOLUTION_HEIGHT ? endY : options.RESOLUTION_HEIGHT;

				DATABASE.addRenderingCell(startX, startY, MAX_X - startX, MAX_Y - startY);

				startX += options.BLOCK_WIDTH;
			}

			startY += options.BLOCK_HEIGHT;
		}

		API.isRenderingServiceRunning = true;


		callback();


		// -----------------------------
		// notifies that server started rendering service (clients can now start or continue rendering)
		// -----------------------------

		var startData = 
		{
			options: options
		};
		socket.broadcast.emit(API.baseUrl + '/rendering/start', startData);
	},

	/**
	 * Stops rendering
	 */
	onStopRendering: function(data, callback)
	{
		if (!callback)
		{
			new Exception.ValueUndefined();
		}

		var socket = this;

		API.isRenderingServiceRunning = false;

		callback();


		// -----------------------------
		// notifies that server stopped rendering service (clients must stop rendering)
		// -----------------------------

		var stopData = {};
		socket.broadcast.emit(API.baseUrl + '/rendering/stop', stopData);
	}
};

module.exports = API;