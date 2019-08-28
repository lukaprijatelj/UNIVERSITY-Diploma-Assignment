
var BasicTable = require('./BasicTable.js');
var uuidv1 = require('uuid/v1');
var database = require('../public/javascripts/classes/database.js');


var DATABASE =
{
	/**
	 * Root url of the database.
	 */
	root: 'database/',

	/**
	 * Table for storing connected clients.
	 * @type {BasicTable}
	 */
	renderingClientsTable: null,

	/**
	 * Table for saving uploaded files.
	 * @type {BasicTable}
	 */
	uploadedFilesTable: null,

	/**
	 * Table for saving rendering jobs.
	 * @type {BasicTable}
	 */
	renderingCellsTable: null,

	
	init: function()
	{
		console.log('[Database] Initializing');

		var tablesRoot = DATABASE.root + "tables/";
		
		DATABASE.renderingClientsTable = new BasicTable(tablesRoot, 'renderingClients');
		DATABASE.uploadedFilesTable = new BasicTable(tablesRoot, 'uploadedFiles');
		DATABASE.renderingCellsTable = new BasicTable(tablesRoot, 'renderingCells');
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

		var table = DATABASE.uploadedFilesTable;
		table.rows.push(fileEntry);
		table.save();
    },

	/**
	 * Gets all files that are uploaded
	 */
    getUploadedFiles: function()
    {
		var table = DATABASE.uploadedFilesTable;

        return table.rows;
	},
	
	/**
	 * Adds render client.
	 */
	addRenderClient: function(sessionId, ipAddress, isAdmin)
	{
		isAdmin = typeof isAdmin !== 'undefined' ? isAdmin : false;
		
		var table = DATABASE.renderingClientsTable;

		var id = uuidv1();
        var clientEntry = new database.Client(id, sessionId, ipAddress, false, isAdmin);
		table.rows.push(clientEntry);

		table.save();
	},

	/**
	 * Removes render client.
	 */
	removeRenderClient: function(sessionId)
	{
		var table = DATABASE.renderingClientsTable;
		table.rows = table.rows.filter(item => item.sessionId != sessionId);

		// remove client from active cells list
		var cellsTable = DATABASE.renderingCellsTable;

		for (let i=0; i<cellsTable.rows.length; i++)
		{
			let cell = cellsTable.rows[i];

			if (cell.sessionId != sessionId)
			{
				continue;
			}	
			
			if (cell.progress == 100)
			{
				continue;
			}

			cell.sessionId = String();
		}

		table.save();
	},

	/**
	 * Removes render client.
	 */
	getClients: function()
	{
		var table = DATABASE.renderingClientsTable;
		return table.rows;
	},

	/**
	 * Adds grid layout.
	 */
	addRenderingCell: function(startX, startY, width, height)
	{
		var table = DATABASE.renderingCellsTable;

		//var id = uuidv1();
		var id = 'cell-' + startX + '-' + startY;

        var clientEntry = new database.RenderingCell(id, startX, startY, width, height);
		table.rows.push(clientEntry);

		table.save();
	},

	/**
	 * Gets all grid layouts.
	 */
	getRenderingCells: function()
	{
		var table = DATABASE.renderingCellsTable;
		
		return table.rows;
	},

	/**
	 * Gets free cells.
	 */
	getFreeCells: function(sessionId, cellsLength)
	{
		var table = DATABASE.renderingCellsTable;

		var freeCells = [];	
		var cellsFound = 0;

		for (let i=0; i<table.rows.length; i++)
		{
			let current = table.rows[i];

			if (current.sessionId != "")
			{
				continue;
			}

			if (cellsFound >= cellsLength)
			{
				break;
			}

			current.sessionId = sessionId;

			var basicCurrent = Object.shrink(new database.BasicCell(), current);
			freeCells.push(basicCurrent);
			cellsFound++;
		}

		if (!freeCells.length)
		{
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
		var table = DATABASE.renderingCellsTable;

		table.rows = [];
		table.save();
	},

	/**
	 * Updates render progress of the client entry.
	 */
	updateProgress: function(cells, progress)
	{
		var table = DATABASE.renderingCellsTable;

		// update rendering progress for specific client
		for (let i=0; i<table.rows.length; i++)
		{
			let element = table.rows[i];

			for (let j=0; j<cells.length; j++)
			{
				let cell = cells[j];

				if(element._id != cell._id)
				{
					continue;
				}
	
				element.progress = progress;
	
				if (typeof cell.imageData !== 'undefined')
				{
					element.imageData = cell.imageData;
				}	
			}				
		}

        table.save();
	}
};

module.exports = DATABASE;