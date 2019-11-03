
var BasicTable = require('./BasicTable.js');
var uuidv1 = require('uuid/v1');

require('../public/scripts/database/BasicCell.js');
require('../public/scripts/database/SocketIoClient.js');
require('../public/scripts/database/SharedCell.js');

var DATABASE =
{
	/**
	 * Root url of the database.
	 */
	root: 'database/',

	/**
	 * List of index ports indicating if they are taken or not.
	 */
	listOfClientIndexes: null,

	/**
	 * Database tables.
	 */
	tables:
	{
		/**
		 * Table for storing connected clients.
		 * @type {BasicTable}
		 */
		renderingClients: null,

		/**
		 * Table for saving uploaded files.
		 * @type {BasicTable}
		 */
		uploadedFiles: null,
	
		/**
		 * Table for saving rendering jobs.
		 * @type {BasicTable}
		 */
		renderingCells: null,
	},

	
	init: function()
	{
		console.log('[Database] Initializing');

		DATABASE.clearListOfClientIndexes();

		var tablesRoot = DATABASE.root + "tables/";
		
		DATABASE.tables.renderingClients = new BasicTable(tablesRoot, 'renderingClients');
		DATABASE.tables.uploadedFiles = new BasicTable(tablesRoot, 'uploadedFiles');
		DATABASE.tables.renderingCells = new BasicTable(tablesRoot, 'renderingCells');
	},

	/**
	 * Clears list of client indexes.
	 */
	clearListOfClientIndexes: function()
	{
		DATABASE.listOfClientIndexes = new Array(MAX_SOCKETIO_CLIENTS);

		for (let i=0; i<MAX_SOCKETIO_CLIENTS; i++)
		{
			DATABASE.listOfClientIndexes[i] = false;
		}
	},

	/**
	 * Adds uploaded file record to DATABASE.
	 */
	addUploadedFile: function(filename, path)
    {
        var fileEntry =
        {
			_id: uuidv1(),
            filename: filename,
			path: path
        };

		var table = DATABASE.tables.uploadedFiles;
		table.rows.push(fileEntry);
		table.save();
    },

	/**
	 * Gets all files that are uploaded
	 */
    getUploadedFiles: function()
    {
		var table = DATABASE.tables.uploadedFiles;
        return table.rows;
	},
	
	/**
	 * Adds render client.
	 */
	addRenderClient: function(sessionId, index, ipAddress, isAdmin)
	{
		isAdmin = typeof isAdmin !== 'undefined' ? isAdmin : false;
		
		var table = DATABASE.tables.renderingClients;

		var id = uuidv1();
        var clientEntry = new namespace.database.SocketIoClient(id, index, sessionId, ipAddress, false, isAdmin);
		table.rows.push(clientEntry);

		table.save();

		return clientEntry;
	},

	/**
	 * Removes render client.
	 */
	removeRenderClient: function(sessionId)
	{
		let client = DATABASE.findClientBySessionId(sessionId);

		// free index port of the client
		DATABASE.listOfClientIndexes[client.index] = false;

		var table = DATABASE.tables.renderingClients;

		// remove client from clients list
		table.rows = table.rows.filter(item => item.sessionId != sessionId);

		// remove client from rendering cells list
		var cellsTable = DATABASE.tables.renderingCells;

		for (let i=0; i<cellsTable.rows.length; i++)
		{
			let cell = cellsTable.rows[i];

			if (!cell.socketIoClient)
			{
				continue;
			}

			if (cell.socketIoClient.sessionId != sessionId)
			{
				continue;
			}	
			
			// todo: not sure why i need this
			/*if (cell.progress == 100)
			{
				continue;
			}*/

			cell.socketIoClient = null;
		}

		table.save();
	},

	/**
	 * Finds socketIO client.
	 */
	findClientBySessionId: function(sessionId)
	{
		var table = DATABASE.tables.renderingClients;

		for (let i=0; i<table.rows.length; i++)
		{
			let socketIoClient = table.rows[i];

			if (socketIoClient.sessionId == sessionId)
			{
				return socketIoClient;
			}	
		}

		return null;
	},

	/**
	 * Removes render client.
	 */
	getAllClients: function()
	{
		var table = DATABASE.tables.renderingClients;
		return table.rows;
	},

	/**
	 * Adds grid layout.
	 */
	createSharedCell: function(index, startX, startY, width, height)
	{
		var table = DATABASE.tables.renderingCells;

		//var id = uuidv1();

        var clientEntry = new namespace.database.SharedCell(index, startX, startY, width, height);
		table.rows.push(clientEntry);

		table.save();
	},

	/**
	 * Gets all grid layouts.
	 */
	getRenderingCells: function()
	{
		var table = DATABASE.tables.renderingCells;
		
		return table.rows;
	},

	/**
	 * Gets free cells.
	 */
	getFreeCells: function(socketIoClient, cellsLength)
	{
		var table = DATABASE.tables.renderingCells;

		var freeCells = new Array();	
		var cellsFound = 0;

		for (let i=0; i<table.rows.length; i++)
		{
			let current = table.rows[i];

			if (current.progress == 100)
			{
				// cell is already rendered
				continue;
			}

			if (current.socketIoClient)
			{
				if (current.socketIoClient != socketIoClient)
				{
					// some other client is already rendering cell
					continue;
				}
			}

			current.socketIoClient = socketIoClient;

			freeCells.push(current);
			cellsFound++;

			if (cellsFound >= cellsLength)
			{
				break;
			}
		}

		if (!freeCells.length)
		{
			// all cells are already rendered
			return null;
		}
		
		table.save();

		return freeCells;
	},

	/**
	 * Clears all existing grid cells data.
	 */
	removeAllCells: function()
	{
		var table = DATABASE.tables.renderingCells;

		table.rows = new Array();
		table.save();
	},

	/**
	 * Updates render progress of the client entry.
	 */
	updateCellsProgress: function(cells)
	{
		var table = DATABASE.tables.renderingCells;
		let j = 0;

		// update rendering progress for specific client
		for (let i=0; i<table.rows.length; i++)
		{
			let element = table.rows[i];
			let newCell = cells[j];

			if(element._id != newCell._id)
			{
				continue;
			}

			// swap old cell with new cell
			table.rows[i] = newCell;
			j++;

			if (j == cells.length)
			{
				break;
			}
		}

        table.save();
	}
};

module.exports = DATABASE;