const fs = require('fs');
const path = require('path');
const upload = require('./upload.js');
const fsExtra = require('fs-extra');

global.socketIO = require('socket.io');
const io = socketIO.listen(SOCKETIO_PORT, { pingTimeout: 1000 * 60 });

var initialOptions = require('../public/scripts/options.js');
var options;


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

	/**
	 * Have users been notified that rendering has finished.
	 */
	hasNotifiedFinish: false,


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

		var sessionId = socket.id;
		var ipAddress = socket.handshake.address;
		var isAdmin = false;
		var data = socket.handshake.query;

		if (data.clientType == "admin")
		{
			isAdmin = true;
			
			// rendering specific listeners
			socket.on(API.baseUrl + '/rendering/setOptions', API.onSetOptions);	
			socket.on(API.baseUrl + '/rendering/start', API.onStartRendering);	
			socket.on(API.baseUrl + '/rendering/pause', API.onPauseRendering);	
			socket.on(API.baseUrl + '/rendering/resume', API.onResumeRendering);				
			socket.on(API.baseUrl + '/rendering/stop', API.onStopRendering);	
		}
		
		let clientEntry = DATABASE.addRenderClient(sessionId, index, ipAddress, isAdmin);
		
		// rendering
		socket.on(API.baseUrl + '/rendering/getOptions', API.onGetOptions);
		socket.on(API.baseUrl + '/rendering/getState', API.onGetRenderingServiceState);

		// cells
		socket.on(API.baseUrl + '/cells/getAll', API.onGetAllCells);
		socket.on(API.baseUrl + '/cells/getWaiting', API.onGetWaitingCells);
		socket.on(API.baseUrl + '/cells/update', API.onUpdateCell);
		
		// clients
		socket.on(API.baseUrl + '/clients/getAll', API.onGetAllClients);
				
		// when client closes tab
		socket.on('disconnect', API.onDisconnect);		

		
		// -----------------------------
		// notifies that new client was added
		// -----------------------------

		// emits to ALL EXCEPT socket that send this call
		socket.broadcast.emit(API.baseUrl + '/clients/add', clientEntry);
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
		// notifies that client was removed
		// -----------------------------

		// emits to ALL EXCEPT socket that send this call
		socket.broadcast.emit(API.baseUrl + '/clients/remove', sessionId);
	},

	/**
	 * Gets list of all clients.
	 */
	onGetAllClients: function(data, callback)
	{
		if (!callback)
		{
			new Exception.ValueUndefined();
		}

		var socket = this;

		var cells = DATABASE.getAllClients();
		callback(cells);
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

		var cells = DATABASE.getRenderingCells();
		callback(cells);
	},

	/**
	 * Gets current rendering job options (width, height, camera, lights, scene, etc).
	 */
	onGetOptions: function(data, callback)
	{
		if (!callback)
		{
			new Exception.ValueUndefined();
		}

		var socket = this;
		var sessionId = socket.id;

		if (!options)
		{
			var client = DATABASE.findClientBySessionId(sessionId);

			if (client.isAdmin == true)
			{
				callback(initialOptions);
				return;
			}
		}
		
		callback(options);
	},

	/**
	 * Gets current rendering service state (idle, running, pause).
	 */
	onGetRenderingServiceState: function(data, callback)
	{
		if (!callback)
		{
			new Exception.ValueUndefined();
		}

		var socket = this;

		callback(API.renderingServiceState);
	},

	/**
	 * Notifies users that rendering has finished.
	 */
	notifyFinished: function()
	{
		let responseData = new Object();

		// emits to ALL sockets
		io.sockets.emit(API.baseUrl + '/rendering/finished', responseData);
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

			if (API.hasNotifiedFinish == false)
			{
				API.hasNotifiedFinish = true;
				API.notifyFinished();
			}

			return;
		}

		let startTimestampSending = Date.nowInMiliseconds();

		for (let i=0; i<freeCells.length; i++)
		{
			let current = freeCells[i];

			current.startTimestampSending = startTimestampSending;
		}
		
		// emits to ALL EXCEPT socket that send this call
		socket.broadcast.emit(API.baseUrl + '/cells/update', freeCells);

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
	onUpdateCell: function(cells, callback)
	{
		if (!callback)
		{
			new Exception.ValueUndefined();
		}

		if (API.renderingServiceState == 'idle')
		{
			return;
		}

		console.log("[Api] Cell progress has updated");

		var socket = this;

		let endTimestampSending = Date.nowInMiliseconds();

		for (let i=0; i<cells.length; i++)
		{
			let current = cells[i];

			if (current.progress == 100)
			{
				current.endTimestampSending = endTimestampSending;
				current.fullTime = current.endTimestampSending - current.startTimestampSending;
			}			
		}

		DATABASE.updateCellsProgress(cells);		

		// emits to ALL EXCEPT socket that send this call
		socket.broadcast.emit(API.baseUrl + '/cells/update', cells);

		callback();
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
	
		response.sendStatus(200);
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

		let index = 0;

		while(startY < MAX_HEIGHT)
		{
			var startX = 0;

			while(startX < MAX_WIDTH)
			{
				var endX = startX + options.BLOCK_WIDTH;
				var endY = startY + options.BLOCK_HEIGHT;

				var MAX_X = endX < MAX_WIDTH ? endX : MAX_WIDTH;
				var MAX_Y = endY < MAX_HEIGHT ? endY : MAX_HEIGHT;

				DATABASE.createSharedCell(index, startX, startY, MAX_X - startX, MAX_Y - startY);
				index++;

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
		API.hasNotifiedFinish = false;

		let responseData = API.renderingServiceState;
	
		// -----------------------------
		// notifies that server STARTED rendering service (clients can now start or continue rendering)
		// -----------------------------

		// emits to ALL EXCEPT socket that send this call
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

		// emits to ALL EXCEPT socket that send this call
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

		// emits to ALL EXCEPT socket that send this call
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

		// emits to ALL EXCEPT socket that send this call
		socket.broadcast.emit(API.baseUrl + '/rendering/stop', responseData);

		callback(responseData);
	}
};

module.exports = API;