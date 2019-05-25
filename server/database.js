
var BasicTable = require('./BasicTable.js');
var uuidv1 = require('uuid/v1');


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

        var clientEntry =
        {
			_id: uuidv1(),
            sessionId: sessionId,
			ipAddress: ipAddress,
			active: false,
			admin: isAdmin
        };

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
		cellsTable.rows.forEach(function(cell)
		{
			if (cell.sessionId != sessionId)
			{
				return;
			}

			if (cell.progress == 100)
			{
				return;
			}

			cell.sessionId = "";
		});

		table.save();
	},

	/**
	 * Adds grid layout.
	 */
	addGridLayout: function(startX, startY, width, height)
	{
        var clientEntry =
        {
			_id: uuidv1(),
			width: width,
			height: height,
			startY: startY,
			startX: startX,
            sessionId: '',
			progress: 0,
			imageData: null
        };

		var table = DATABASE.renderingCellsTable;

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
	 * Gets free cell
	 */
	getFreeCell: function(sessionId)
	{
		var table = DATABASE.renderingCellsTable;
		var freeCell = table.rows.find(element => element.sessionId == "");	

		if (!freeCell)
		{
			return null;
		}

		freeCell.sessionId = sessionId;

		table.save();

		return freeCell;
	},

	/**
	 * Clears all existing grid cells data.
	 */
	clearGridLayout: function()
	{
		var table = DATABASE.renderingCellsTable;

		table.rows = [];
		table.save();
	},

	/**
	 * Updates render progress of the client entry.
	 */
	updateProgress: function(cell, progress)
	{
		var table = DATABASE.renderingCellsTable;

		// update rendering progress for specific client
		table.rows.forEach((element) => { 
			if(element._id == cell._id)
			{
				element.progress = progress;

				if (typeof cell.imageData !== 'undefined')
				{
					element.imageData = cell.imageData;
				}				
			}
		});

        table.save();
	}
};

module.exports = DATABASE;