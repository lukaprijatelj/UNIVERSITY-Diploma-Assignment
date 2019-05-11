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
		}
		
		DATABASE.addRenderClient(sessionId, ipAddress, isAdmin);		
		
		socket.on(API.baseUrl + 'request/renderingCells/layout', API.onRenderingCellsList);
		socket.on(API.baseUrl + 'request/renderingCells/cell', API.onRequestCell);
		socket.on(API.baseUrl + 'request/renderingCells/updateProgress', API.onUpdateProgress);	
		socket.on(API.baseUrl + 'request/renderingCells/recalculateLayout', API.onRecalculateLayout);		

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

	onRenderingCellsList: function()
	{
		var socket = this;
		var sessionId = socket.id;

		var result = DATABASE.getRenderingCells();

		socketIo.to(`${sessionId}`).emit(API.baseUrl + 'response/renderingCells/layout', result);
	},

	onRequestCell: function()
	{
		var socket = this;
		var sessionId = socket.id;

		var result = DATABASE.getRenderingCells();
		var freeCell = result.find(element => element.sessionId == "");	

		if (!freeCell)
		{
			console.log("[Api] All cells are already rendered! (aborting)");
			return;
		}

		freeCell.sessionId = sessionId;
		socketIo.to(`${sessionId}`).emit(API.baseUrl + 'response/renderingCells/cell', freeCell);
	},

	/**
	 * Updates render progress of certain client.
	 */
	onUpdateProgress: function(data)
	{
		var socket = this;

		DATABASE.updateProgress(data.renderCellId, data.progress, data.imageData);

		console.log("[Api] Progress was updated");
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
		var NUM_OF_CELLS_HORIZONTALLY = 5;
		var NUM_OF_CELLS_VERTICALLY = 5;

		var CELL_WIDTH = 384;
		var CELL_HEIGHT = 216;

		DATABASE.clearGridLayout();
		
		var startY = 0;
		while(startY < CELL_HEIGHT * NUM_OF_CELLS_VERTICALLY)
		{
			var startX = 0;

			while(startX < CELL_WIDTH * NUM_OF_CELLS_HORIZONTALLY)
			{
				DATABASE.addGridLayout(startX, startY, CELL_WIDTH, CELL_HEIGHT);
				startX += CELL_WIDTH;
			}

			startY += CELL_HEIGHT;
		}
	},
};

module.exports = API;