var upload = require('./upload.js');
var DATABASE = require('./database.js');
var constants = require('./constants.js');
var Exception = require('../public/javascripts/classes/Exception.js');
var Warning = require('../public/javascripts/classes/Warning.js');

var socketIO = require('socket.io');
var io = socketIO.listen(30003);


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
		}
		
		DATABASE.addRenderClient(sessionId, ipAddress, isAdmin);
				
		socket.on(API.baseUrl + '/cells/getAll', API.onGetAllCells);
		socket.on(API.baseUrl + '/cells/getWaiting', API.onGetWaitingCells);
		socket.on(API.baseUrl + '/cells/update', API.onUpdateCell);		
		socket.on(API.baseUrl + '/rendering/start', API.onStartRendering);	
		socket.on(API.baseUrl + '/rendering/stop', API.onStopRendering);	
		
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
		var sessionId = socket.id;

		var result = DATABASE.getRenderingCells();

		callback(result);
	},

	/**
	 * Respond with any of the cells still waiting to be rendered.
	 */
	onGetWaitingCells: function(data, callback)
	{
		if (!callback)
		{
			new Exception.ValueUndefined();
		}

		var socket = this;
		var sessionId = socket.id;

		var freeCell = DATABASE.getFreeCell(sessionId);

		if (!freeCell)
		{
			console.log("[Api] All cells are already rendered! (aborting)");
			return;
		}

		callback(freeCell);
	},

	/**
	 * Updates render progress of certain client.
	 */
	onUpdateCell: function(data)
	{
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

		DATABASE.clearGridLayout();
		
		var startY = 0;

		while(startY < constants.CANVAS_HEIGHT)
		{
			var startX = 0;

			while(startX < constants.CANVAS_WIDTH)
			{
				var endX = startX + constants.BLOCK_WIDTH;
				var endY = startY + constants.BLOCK_HEIGHT;

				var MAX_X = endX < constants.CANVAS_WIDTH ? endX : constants.CANVAS_WIDTH;
				var MAX_Y = endY < constants.CANVAS_HEIGHT ? endY : constants.CANVAS_HEIGHT;

				DATABASE.addGridLayout(startX, startY, MAX_X - startX, MAX_Y - startY);

				startX += constants.BLOCK_WIDTH;
			}

			startY += constants.BLOCK_HEIGHT;
		}

		callback();
	},

	onStopRendering: function(data, callback)
	{
		if (!callback)
		{
			new Exception.ValueUndefined();
		}

		callback();
	}
};

module.exports = API;