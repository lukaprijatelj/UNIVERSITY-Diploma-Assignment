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


	init: function()
	{
		MongoClient.connect(DBLogic.url, { useNewUrlParser: true }, DBLogic.onDatabaseConnected);
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
	addRenderClient: function(sessionId, ipAddress, renderProgress, callback)
	{
		if (DBLogic.isConnected == false)
		{
			return;
		}		

		var renderClientsCllection = DBLogic.database.collection('renderClientsCllection');
        var clientEntry =
        {
            sessionId: sessionId,
			ipAddress: ipAddress,
			renderProgress: renderProgress
        };

        renderClientsCllection.insertOne(clientEntry, callback);
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

		var renderClientsCllection = DBLogic.database.collection('renderClientsCllection');
        var clientEntry =
        {
            sessionId: sessionId
        };

        renderClientsCllection.deleteOne(clientEntry, callback);
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

		var renderClientsCllection = DBLogic.database.collection('renderClientsCllection');
		var clientEntry =
        {
            sessionId: sessionId
        };
        var updateData =
        {
			renderProgress: renderProgress
        };

        renderClientsCllection.updateOne(clientEntry, { $set: updateData }, callback);
	}
	

};

module.exports = DBLogic;