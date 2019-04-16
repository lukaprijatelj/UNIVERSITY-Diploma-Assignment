
var BasicTable = require('./tables/BasicTable.js');


var DATABASE =
{
	root: 'database/',

	renderingClientsTable: null,

	uploadedFilesTable: null,

	gridLayoutsTable: null,

	init: function()
	{
		var tablesRoot = DATABASE.root + "tables/";
		
		DATABASE.renderingClientsTable = new BasicTable(tablesRoot, 'renderingClients');
		DATABASE.uploadedFilesTable = new BasicTable(tablesRoot, 'uploadedFiles');
		DATABASE.gridLayoutsTable = new BasicTable(tablesRoot, 'gridLayouts');
	},
	

	/**
	 * Adds uploaded file record to DATABASE.
	 */
	addUploadedFile: function(filename, path)
    {
        var fileEntry =
        {
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
	addRenderClient: function(sessionId, ipAddress, active)
	{
        var clientEntry =
        {
            sessionId: sessionId,
			ipAddress: ipAddress,
			active: active
        };

		var table = DATABASE.renderingClientsTable;

		table.rows.push(clientEntry);
		table.save();
	},

	/**
	 * Removes render client.
	 */
	removeRenderClient: function(sessionId)
	{
		var table = DATABASE.renderingClientsTable;

		table.rows = table.rows.filter(item => item.sessionId !== sessionId);
		table.save();
	},

	addGridLayout: function(width, height, sessionId, row, progress)
	{
        var clientEntry =
        {
			width: width,
			height: height,
			row: row,
            sessionId: sessionId,
			progress: progress
        };

		var table = DATABASE.gridLayoutsTable;

		table.rows.push(clientEntry);
		table.save();
	},

	getGridLayouts: function()
	{
		var table = DATABASE.gridLayoutsTable;
		
		return table.rows;
	},

	/**
	 * Updates render progress of the client entry.
	 */
	updateProgress: function(sessionId, renderProgress)
	{
		var table = DATABASE.renderingClientsTable;

		table.rows.forEach((element) => { 
			if(element.sessionId == sessionId)
			{
				element.renderProgress = renderProgress;
			}
		});
        table.save();
	}
	

};

module.exports = DATABASE;