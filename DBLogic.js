var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;


var DBLogic =
{
	database: null,

	url: 'mongodb://localhost:27017/distributedOnlineRenderingDB',

	init: function()
	{
		MongoClient.connect(DBLogic.url, { useNewUrlParser: true }, DBLogic.onDatabaseConnected);
	},

	onDatabaseConnected: function(err, db)
    {
        if (err)
        {
            throw err;
        } 

        DBLogic.database = db.db("distributedOnlineRenderingDB");        

        console.log("DBLogic - Database connected!");
	},
	
	addUploadedFile: function(filename, path, callback)
    {
        var uploadedFilesCollection = DBLogic.database.collection('uploadedFilesCollection');
        var fileEntry =
        {
            filename: filename,
			path: path
        };

        uploadedFilesCollection.insertOne(fileEntry, callback);
    },

    getUploadedFiles: function(callback)
    {
        var usersCollection = DBLogic.database.collection('uploadedFilesCollection');

        usersCollection.find({}).toArray(callback);
	},
	
	addRenderClient: function(name, ipAddress)
	{
		var renderClientsCllection = DBLogic.database.collection('renderClientsCllection');
        var clientEntry =
        {
            name: name,
			ipAddress: ipAddress
        };

        renderClientsCllection.insertOne(clientEntry, callback);
	},

	

};

module.exports = DBLogic;