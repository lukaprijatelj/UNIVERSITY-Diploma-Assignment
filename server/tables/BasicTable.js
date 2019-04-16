var fs = require('fs');
	
/**
 * Main database table classes.
 * @inherits {classes.database.Entity}
 */
function BasicTable(root, name)
{	
	/**
	 * Root url of the database folder.
	 * @type {string}
	 */
	this.root = root;

	/**
	 * Name of the table.
	 * @type {string}
	 */
	this.name = name;

	/**
	 * Array of rows.
	 * @type {Array<Object>}
	 */
	this.rows = [];

	/**
	 * Is table synchronized.
	 * @type {boolean}
	 */
	this.isSynchronizing = false;

	this.saveRequest = false;

	/**
	 * Initializes object.
	 */
	this.init = function()
	{
		this._checkIfTableAlreadyExists(this._readFromExisting.bind(this));
	};
	this.init();
};

BasicTable.prototype.getFullPath = function()
{
	return this.root + this.name + ".json";
};

BasicTable.prototype._checkIfTableAlreadyExists = function(callback)
{
	callback = callback ? callback : function() {};

	var basicTable = this;
	var fileUrl = basicTable.getFullPath();

	basicTable.isSynchronizing = true;

	fs.access(fileUrl, fs.F_OK, (err) => {
		if (err) 
		{
			// file does not exist
			basicTable.isSynchronizing = false;

			basicTable.save();
			
			return;
		}
	
		callback();
	});
};

BasicTable.prototype._readFromExisting = function()
{
	var basicTable = this;
	var fileUrl = basicTable.getFullPath();

	basicTable.isSynchronizing = true;

	fs.readFile(fileUrl, 'utf8', function(err, contents) 
	{
		if (err) 
		{
			console.error("BasicTable - Error while reading already existing table! (aborting)");
			console.error(err);
			return;
		}

		var obj = JSON.parse(contents);
		basicTable.rows = obj.rows;

		basicTable.isSynchronizing = false;
	});
};

BasicTable.prototype.save = function(callback)
{
	callback = callback ? callback : function() {};

	var basicTable = this;

	if (basicTable.isSynchronizing == true)
	{
		basicTable.saveRequest = true;
		return;
	}
	
	var fileUrl = basicTable.getFullPath();
	var jsonData = { rows: basicTable.rows };
	var jsonString = JSON.stringify(jsonData, null, 4);

	basicTable.isSynchronizing = true;

	fs.writeFile(fileUrl, jsonString, 'utf8', function(err, data)
	{
		if (err)
		{
			console.error("DATABASE - Error has occured wile writing json data! (aborting)");
			console.error(err);
			return;
		} 

		basicTable.isSynchronizing = false;

		if (basicTable.saveRequest == true)
		{
			basicTable.save(callback);
		}
		else
		{
			callback();
		}
	});
};

module.exports = BasicTable;