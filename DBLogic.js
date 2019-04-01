var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;


var DBLogic =
{
	/**
	 * Database instance.
	 */
	database: null,

	/**
	 * Database url.
	 */
	url: 'mongodb://localhost:27017/distributedOnlineRenderingDB',

	/**
	 * Is database connected.
	 */
	isConnected: false,


	init: function(callback)
	{
		callback = callback ? callback : function() {};

		MongoClient.connect(DBLogic.url, { useNewUrlParser: true }, function(err, db)
		{
			DBLogic.onDatabaseConnected(err, db);
			callback();
		});		
	},


	/**
	 * Connection with database was successfully established.
	 */
	onDatabaseConnected: function(err, db)
    {
        if (err)
        {
            throw err;
        } 

		DBLogic.database = db.db("distributedOnlineRenderingDB");    
		DBLogic.isConnected = true;    

        console.log("DBLogic - Database connected!");
	},
	
	/**
	 * Adds uploaded file record to database.
	 */
	addUploadedFile: function(filename, path, callback)
    {
		if (DBLogic.isConnected == false)
		{
			return;
		}	

        var uploadedFilesCollection = DBLogic.database.collection('uploadedFilesCollection');
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
		if (DBLogic.isConnected == false)
		{
			return;
		}	

        var usersCollection = DBLogic.database.collection('uploadedFilesCollection');

        usersCollection.find({}).toArray(callback);
	},
	
	/**
	 * Adds render client.
	 */
	addRenderClient: function(sessionId, ipAddress, active, callback)
	{
		if (DBLogic.isConnected == false)
		{
			return;
		}		

		var renderingClientsCollection = DBLogic.database.collection('renderingClientsCollection');
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
		if (DBLogic.isConnected == false)
		{
			return;
		}	

		var renderingClientsCollection = DBLogic.database.collection('renderingClientsCollection');
        var clientEntry =
        {
            sessionId: sessionId
        };

        renderingClientsCollection.deleteOne(clientEntry, callback);
	},

	addGridLayout: function(width, height, sessionId, row, progress, callback)
	{
		if (DBLogic.isConnected == false)
		{
			return;
		}	

		var gridLayoutCollection = DBLogic.database.collection('gridLayoutCollection');
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
		if (DBLogic.isConnected == false)
		{
			return;
		}	

		var gridLayoutCollection = DBLogic.database.collection('gridLayoutCollection');

        gridLayoutCollection.find({}).toArray(callback);
	},

	/**
	 * Updates render progress of the client entry.
	 */
	updateProgress: function(sessionId, renderProgress, callback)
	{
		if (DBLogic.isConnected == false)
		{
			return;
		}	

		var activeRenderingClients = DBLogic.database.collection('activeRenderingClients');
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

module.exports = DBLogic;