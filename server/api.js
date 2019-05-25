var upload = require('./upload.js');
var DATABASE = require('./database.js');

var io = require('socket.io');
var socketIo = io.listen(30003);

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

const BLOCK_WIDTH = 50;
const BLOCK_HEIGHT = 50;

var API =
{
	/**
	 * Base url API access.
	 */
	baseUrl: '/api',

	adminSessionId: '',


    init: function(app)
    {
		console.log('[Api] Initializing');

        // mutiple callbacks are separated with comma.
        // first upload.single parses file and saves it into request.file
		app.post(API.baseUrl + '/uploadScene', upload.single('Scene'), API.onUploadFile);
		
		socketIo.on('connection', API.onConnect);
	},

	
	/**
	 * New client has connected via socket IO.
	 */
	onConnect: function(socket)
	{
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
	onRenderingCellsList: function()
	{
		var socket = this;
		var sessionId = socket.id;

		var result = DATABASE.getRenderingCells();

		socketIo.to(sessionId).emit(API.baseUrl + '/response/renderingCells/layout', result);
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

		socketIo.to(sessionId).emit(API.baseUrl + '/response/renderingCells/cell', freeCell);
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
		while(startY < CANVAS_HEIGHT)
		{
			var startX = 0;

			while(startX < CANVAS_WIDTH)
			{
				var endX = startX + BLOCK_WIDTH;
				var endY = startY + BLOCK_HEIGHT;

				var MAX_X = endX < CANVAS_WIDTH ? endX : CANVAS_WIDTH;
				var MAX_Y = endY < CANVAS_HEIGHT ? endY : CANVAS_HEIGHT;

				DATABASE.addGridLayout(startX, startY, MAX_X - startX, MAX_Y - startY);

				startX += BLOCK_WIDTH;
			}

			startY += BLOCK_HEIGHT;
		}
	},
};

module.exports = API;