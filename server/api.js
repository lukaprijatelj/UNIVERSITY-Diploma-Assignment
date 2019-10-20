const fs = require('fs');
const path = require('path');
var upload = require('./upload.js');
var options = require('../public/scripts/options.js');

global.socketIO = require('socket.io');
var io = socketIO.listen(SOCKETIO_PORT, { pingTimeout: 1000 * 60 });

const fsExtra = require('fs-extra');



var API =
{
	/**
	 * Base url API access.
	 */
	baseUrl: '/api',

	/**
	 * Is rendering service currently running.
	 */
	renderingServiceState: 'idle',


    init: function(app)
    {
		console.log('[Api] Initializing');

        // mutiple callbacks are separated with comma.
        // first upload.single parses file and saves it into request.file
		app.post(API.baseUrl + '/uploadScene', API.emptyUploadsFolder, upload.array('reserved_word-scene'), API.onUploadFile);
		app.post(API.baseUrl + '/listScenes', API.onListScenes);
		
		io.on('connection', API.onConnect);
	},

	/**
	 * Disconects user and thus blocks connection.
	 */
	blockConnection: function(socket)
	{
		new Warning.Other('Blocking connection!');
		socket.disconnect();
	},
	
	/**
	 * New client has connected via socket IO.
	 */
	onConnect: function(socket)
	{
		let index = -1;

		for (let i=0; i<DATABASE.listOfClientIndexes.length; i++)
		{
			if (DATABASE.listOfClientIndexes[i] == false)
			{
				DATABASE.listOfClientIndexes[i] = true;
				index = i;
				break;
			}
		}

		if (index == -1)
		{
			new Warning.Other('All indexes are already used!');

			API.blockConnection(socket);
			return;
		}

		console.log('[Api] New client has connected!');

		var time = new Date();		

		var sessionId = socket.id;
		var ipAddress = socket.handshake.address;
		var isAdmin = false;
		var data = socket.handshake.query;

		if (data.clientType == "admin")
		{
			isAdmin = true;
			
			// admin specific listeners
			socket.on(API.baseUrl + '/admin/getRenderingServiceState', API.onAdminCheckRendering); 

			// rendering specific listeners
			socket.on(API.baseUrl + '/rendering/setOptions', API.onSetOptions);	
			socket.on(API.baseUrl + '/rendering/start', API.onStartRendering);	
			socket.on(API.baseUrl + '/rendering/pause', API.onPauseRendering);	
			socket.on(API.baseUrl + '/rendering/resume', API.onResumeRendering);				
			socket.on(API.baseUrl + '/rendering/stop', API.onStopRendering);
		}
		
		DATABASE.addRenderClient(sessionId, index, ipAddress, isAdmin);
				
		// cells
		socket.on(API.baseUrl + '/cells/getAll', API.onGetAllCells);
		socket.on(API.baseUrl + '/cells/getWaiting', API.onGetWaitingCells);
		socket.on(API.baseUrl + '/cells/update', API.onUpdateCell);			
				
		// when client closes tab
		socket.on('disconnect', API.onDisconnect);		

		
		// -----------------------------
		// notifies that clients list was updated
		// -----------------------------

		var result = DATABASE.getAllClients();

		// emits to ALL and also to socket that send this call
		io.sockets.emit(API.baseUrl + '/clients/updated', result);
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

		var result = DATABASE.getAllClients();

		// emits to ALL EXCEPT socket that send this call
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
		var result = 
		{ 
			renderingServiceState: API.renderingServiceState,
			options: options
		};

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
			renderingServiceState: API.renderingServiceState
		}

		callback(result);
	},

	/**
	 * Respond with any of the cells still waiting to be rendered.
	 */
	onGetWaitingCells: function(data, callback)
	{
		if (API.renderingServiceState == 'idle')
		{
			return;
		}

		if (!callback)
		{
			new Exception.ValueUndefined();
		}

		var socket = this;
		var sessionId = socket.id;

		var client = DATABASE.findClientBySessionId(sessionId);
		var freeCells = DATABASE.getFreeCells(client, options.NUM_OF_BLOCKS_IN_CHUNK);

		if (!freeCells)
		{
			console.log("[Api] All cells are already rendered! (aborting)");
			return;
		}

		callback(freeCells);
	},

	/**
	 * Respond with any of the cells still waiting to be rendered.
	 */
	onListScenes: function(request, response)
	{
		var results = fs.readdirSync('./public/scenes');
		response.send(results);
	},

	/**
	 * Updates render progress of certain client.
	 */
	onUpdateCell: function(data)
	{
		if (API.renderingServiceState == 'idle')
		{
			return;
		}

		console.log("[Api] Cell progress has updated");

		var socket = this;

		DATABASE.updateCellsProgress(data.cells, data.progress);		

		if (data.progress == 100)
		{
			// notifies ALL clients that are currently connected
			socket.broadcast.emit(API.baseUrl + '/cells/update', data);
		}
	},

	/**
	 * Empties uploads folder before saving files there.
	 */
	emptyUploadsFolder: async function(req, res, next)
	{
		// perform middleware function e.g. check if user is authenticated

		var folder = 'public/scenes/Uploads';

		await fsExtra.remove(folder);

		await fsExtra.mkdir(folder);
	
		next();  // move on to the next middleware
	},

	/**
	 * Catches users scene and saves it to local storage.
	 */
    onUploadFile: function(request, response)
    {
		console.log("[Api] File was uploaded");

		/*var filename = request.file.filename;
		var path = request.file.path;
		
		DATABASE.addUploadedFile(filename, path);*/
	
		response.sendStatus(200)
	},

	/**
	 * Sets rendering options.
	 */
	onSetOptions: function(data, callback)
	{
		if (!callback)
		{
			new Exception.ValueUndefined();
		}

		var socket = this;

		// update rendering options
		options = data;
		

		// -----------------------------
		// recalculates cell layout
		// -----------------------------

		DATABASE.removeAllCells();

		var startY = 0;
		var MAX_WIDTH = options.CANVAS_WIDTH * options.RESOLUTION_FACTOR;
		var MAX_HEIGHT = options.CANVAS_HEIGHT * options.RESOLUTION_FACTOR;

		while(startY < MAX_HEIGHT)
		{
			var startX = 0;

			while(startX < MAX_WIDTH)
			{
				var endX = startX + options.BLOCK_WIDTH;
				var endY = startY + options.BLOCK_HEIGHT;

				var MAX_X = endX < MAX_WIDTH ? endX : MAX_WIDTH;
				var MAX_Y = endY < MAX_HEIGHT ? endY : MAX_HEIGHT;

				DATABASE.createSharedCell(startX, startY, MAX_X - startX, MAX_Y - startY);

				startX += options.BLOCK_WIDTH;
			}

			startY += options.BLOCK_HEIGHT;
		}

		callback();
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

		API.renderingServiceState = 'running';

		let responseData = API.renderingServiceState;
	
		// -----------------------------
		// notifies that server STARTED rendering service (clients can now start or continue rendering)
		// -----------------------------

		socket.broadcast.emit(API.baseUrl + '/rendering/start', responseData);

		callback(responseData);
	},

	/**
	 * Pause rendering.
	 */
	onPauseRendering: function(data, callback)
	{
		if (!callback)
		{
			new Exception.ValueUndefined();
		}

		var socket = this;

		API.renderingServiceState = 'pause';

		let responseData = API.renderingServiceState;
	
		// -----------------------------
		// notifies that server PAUSED rendering service (clients must stop rendering)
		// -----------------------------

		socket.broadcast.emit(API.baseUrl + '/rendering/pause', responseData);

		callback(responseData);
	},

	/**
	 * Resume rendering.
	 */
	onResumeRendering: function(data, callback)
	{
		if (!callback)
		{
			new Exception.ValueUndefined();
		}

		var socket = this;

		API.renderingServiceState = 'running';

		let responseData = API.renderingServiceState;

		// -----------------------------
		// notifies that server RESUME rendering service (clients must stop rendering)
		// -----------------------------

		socket.broadcast.emit(API.baseUrl + '/rendering/resume', responseData);

		callback(responseData);
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

		API.renderingServiceState = 'idle';

		let responseData = API.renderingServiceState;
	
		// -----------------------------
		// notifies that server STOPPED rendering service (clients must stop rendering)
		// -----------------------------

		socket.broadcast.emit(API.baseUrl + '/rendering/stop', responseData);

		callback(responseData);
	}
};

module.exports = API;