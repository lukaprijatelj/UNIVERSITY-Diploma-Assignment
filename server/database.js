
var BasicTable = require('./BasicTable.js');
var uuidv1 = require('uuid/v1');

require('../public/scripts/namespace-database/BasicCell.js');
require('../public/scripts/namespace-database/SocketIoClient.js');
require('../public/scripts/namespace-database/SharedCell.js');

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

	/**
	 * Number of cells that are already finished rendering.
	 */
	finishedCells: 0,
	

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
	 * Merges all cells data into one buffer.
	 */
	getImagesBuffer: function(width, height)
	{
		let NUM_OF_CHANNELS = 4;
		let buffer = new Uint8Array(width * height * NUM_OF_CHANNELS);

		var cellsTable = DATABASE.tables.renderingCells;

		for (let a=0; a<cellsTable.rows.length; a++)
		{
			let cell = cellsTable.rows[a];

			for (let j=0; j<cell.height; j++)
			{
				for (let i=0; i<cell.width; i++)
				{					
					let globalPosition = 0;
					globalPosition += (cell.startY + j) * width;
					globalPosition += cell.startX + i;
					globalPosition *= NUM_OF_CHANNELS;

					let localPosition = 0;
					localPosition += j * cell.width;
					localPosition += i;
					localPosition *= NUM_OF_CHANNELS;

					buffer[globalPosition + 0] = cell.rawImage.imageData.data[localPosition + 0];
					buffer[globalPosition + 1] = cell.rawImage.imageData.data[localPosition + 1];
					buffer[globalPosition + 2] = cell.rawImage.imageData.data[localPosition + 2];
					buffer[globalPosition + 3] = cell.rawImage.imageData.data[localPosition + 3];
				}
			}
		}

		return buffer;
	},

	/**
	 * Gets rendering info results like time rendering, time sending etc.
	 */
	getRenderingInfo: function()
	{
		let cellsTable = DATABASE.tables.renderingCells;
		let htmlString = '<!DOCTYPE html>';

		htmlString += '<html lang="en">';
		htmlString += '<head><meta charset="utf-8"></head>';

		htmlString += '<body>';
		htmlString += '<table cellspacing="10">';

		htmlString += '<tr>';
		htmlString += '<th>Index</th>';
		htmlString += '<th>Size</th>';
		htmlString += '<th>Position</th>';
		htmlString += '<th>Client IP</th>';
		htmlString += '<th>Time rendering</th>';
		htmlString += '<th>Full time</th>';
		htmlString += '</tr>';
		
		for (let a=0; a<cellsTable.rows.length; a++)
		{
			let cell = cellsTable.rows[a];

			htmlString += '<tr>';
			htmlString += '<td>' + cell.index + '</td>';
			htmlString += '<td>' + cell.width + 'x' + cell.height + '</td>';
			htmlString += '<td>' + cell.startX + ',' + cell.startY + '</td>';

			if (cell.socketIoClient)
			{
				htmlString += '<td>' + cell.socketIoClient.ipAddress + '</td>';
			}
			else
			{
				htmlString += '<td></td>';
			}
			
			htmlString += '<td>' + cell.timeRendering + '&micro;s</td>';
			htmlString += '<td>' + cell.fullTime + 'ms</td>';
			htmlString += '</tr>';
		}

		htmlString += '</table>';
		htmlString += '</body>';

		return htmlString;
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
		
			if (cell.progress == 100)
			{
				// needed to track which client rendered this cell
				continue;
			}

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
	areCellsFinished: function()
	{
		var table = DATABASE.tables.renderingCells;

		for (let i=0; i<table.rows.length; i++)
		{
			let current = table.rows[i];

			if (current.progress != 100)
			{
				// cell is already rendered
				return false;
			}
		}

		return true;
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