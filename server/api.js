var upload = require('./upload.js');
var DATABASE = require('./database.js');
var constants = require('./constants.js');
var Exception = require('./public/javascripts/classes/Exception.js');

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
		var time = new Date();
		
		console.log('[Api] New client has connected!');

		var sessionId = socket.id;
		var ipAddress = socket.handshake.address;
		var isAdmin = false;

		if (socket.handshake.query.clientType == "admin")
		{
			isAdmin = true;
			API.adminSessionId = sessionId;
		}
		
		DATABASE.addRenderClient(sessionId, ipAddress, isAdmin);
				
		socket.on(API.baseUrl + '/request/renderingClients/list', API.onRequestCell);

		socket.on(API.baseUrl + '/request/renderingCells/layout', API.onRenderingCellsList);
		socket.on(API.baseUrl + '/request/renderingCells/cell', API.onRequestCell);
		socket.on(API.baseUrl + '/request/renderingCells/updateProgress', API.onUpdateProgress);	
		socket.on(API.baseUrl + '/request/renderingCells/recalculateLayout', API.onRecalculateLayout);		

		// when client closes tab
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

		console.log("[Api] Client has disconnected!");
	},

	/**
	 * Responds with list of rendering cells.
	 */
	onRenderingCellsList: function(data, callback)
	{
		if (callback)
		{
			new 
		}

		var socket = this;
		var sessionId = socket.id;

		var result = DATABASE.getRenderingCells();

		
		callback(result);
	},

	/**
	 * Respond with any of the cells still waiting to be rendered.
	 */
	onRequestCell: function()
	{
		var socket = this;
		var sessionId = socket.id;

		var freeCell = DATABASE.getFreeCell(sessionId);

		if (!freeCell)
		{
			console.log("[Api] All cells are already rendered! (aborting)");
			return;
		}

		io.to(sessionId).emit(API.baseUrl + '/response/renderingCells/cell', freeCell);
	},

	/**
	 * Updates render progress of certain client.
	 */
	onUpdateProgress: function(data)
	{
		console.log("[Api] Progress was updated");

		var socket = this;

		DATABASE.updateProgress(data.cell, data.progress, data.imageData);		

		if (data.progress == 100)
		{
			socket.broadcast.emit(API.baseUrl + '/response/renderingCells/updateProgress', data);
		}
	},

	/**
	 * Catches users scene and saves it to local storage.
	 */
    onUploadFile: function(request, response)
    {
		var filename = request.file.filename;
		var path = request.file.path;
		
		DATABASE.addUploadedFile(filename, path);

		response.send('Scene was uploaded!');

		console.log("[Api] File was uploaded");
	},

	onRecalculateLayout: function()
	{
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
	},
};

module.exports = API;