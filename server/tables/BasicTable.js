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
	 * Initializes object.
	 */
	this.init = function()
	{
		
	};
};

BasicTable.prototype.getFullPath = function()
{
	return this.root + this.name + ".json";
};

BasicTable.prototype._checkIfTableAlreadyExists = function()
{
	var fileUrl = this.getFullPath();

	fs.access(fileUrl, fs.F_OK, (err) => {
		if (err) 
		{
			console.log("classes.database.Table - Error while checking if table already exists! (aborting)");
			console.error(err);
			return;
		}
	
		//file exists
	});
};

BasicTable.prototype._readFromExisting = function()
{

};

BasicTable.prototype.save = function(callback)
{
	var fileUrl = this.getFullPath();
	var jsonData = { rows: this.rows };
	var jsonString = JSON.stringify(jsonData);

	fs.writeFile(fileUrl, jsonString, 'utf8', function(err, data){
		if (err)
		{
			console.log("DATABASE - Error has occured wile writing json data! (aborting)");
			console.log(err);
			return;
		} 
		
		//obj = JSON.parse(data); //now it an object
	});
};

module.exports = BasicTable;