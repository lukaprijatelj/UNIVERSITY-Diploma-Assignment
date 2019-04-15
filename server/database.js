
var classes = require('./classes.js');


var DATABASE =
{
	root: 'database/',

	init: function()
	{
		var tablesRoot = DATABASE.root + "tables/";
		var tabel = new classes.database.CustomTable(tablesRoot, 'morskaRibica');

		var is = Function.isInheriting(tabel, classes.database.Table);
	},
	
	
	/**
	 * Adds uploaded file record to DATABASE.
	 */
	addUploadedFile: function(filename, path, callback)
    {
		if (DATABASE.isConnected == false)
		{
			return;
		}	

        var uploadedFilesCollection = DATABASE.DATABASE.collection('uploadedFilesCollection');
        var fileEntry =
        {
            filename: filename,
			path: path
        };

        uploadedFilesCollection.insertOne(fileEntry, callback);
    },

	/**
	 * Gets all files that are uploaded
	 */
    getUploadedFiles: function(callback)
    {
		if (DATABASE.isConnected == false)
		{
			return;
		}	

        var usersCollection = DATABASE.DATABASE.collection('uploadedFilesCollection');

        usersCollection.find({}).toArray(callback);
	},
	
	/**
	 * Adds render client.
	 */
	addRenderClient: function(sessionId, ipAddress, active, callback)
	{
		if (DATABASE.isConnected == false)
		{
			return;
		}		

		var renderingClientsCollection = DATABASE.DATABASE.collection('renderingClientsCollection');
        var clientEntry =
        {
            sessionId: sessionId,
			ipAddress: ipAddress,
			active: active
        };

        renderingClientsCollection.insertOne(clientEntry, callback);
	},

	/**
	 * Removes render client.
	 */
	removeRenderClient: function(sessionId, callback)
	{
		if (DATABASE.isConnected == false)
		{
			return;
		}	

		var renderingClientsCollection = DATABASE.DATABASE.collection('renderingClientsCollection');
        var clientEntry =
        {
            sessionId: sessionId
        };

        renderingClientsCollection.deleteOne(clientEntry, callback);
	},

	addGridLayout: function(width, height, sessionId, row, progress, callback)
	{
		if (DATABASE.isConnected == false)
		{
			return;
		}	

		var gridLayoutCollection = DATABASE.DATABASE.collection('gridLayoutCollection');
        var clientEntry =
        {
			width: width,
			height: height,
			row: row,
            sessionId: sessionId,
			progress: progress
        };

        gridLayoutCollection.insertOne(clientEntry, callback);
	},

	getGridLayouts: function(callback)
	{
		if (DATABASE.isConnected == false)
		{
			return;
		}	

		var gridLayoutCollection = DATABASE.DATABASE.collection('gridLayoutCollection');

        gridLayoutCollection.find({}).toArray(callback);
	},

	/**
	 * Updates render progress of the client entry.
	 */
	updateProgress: function(sessionId, renderProgress, callback)
	{
		if (DATABASE.isConnected == false)
		{
			return;
		}	

		var activeRenderingClients = DATABASE.DATABASE.collection('activeRenderingClients');
		var clientEntry =
        {
            sessionId: sessionId
        };
        var updateData =
        {
			renderProgress: renderProgress
        };

        activeRenderingClients.updateOne(clientEntry, { $set: updateData }, callback);
	}
	

};

module.exports = DATABASE;