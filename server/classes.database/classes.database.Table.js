/**
 * Main database table classes.
 * @inherits {classes.database.Entity}
 */
function Table(root, name)
{
	/** Using */
	var fs = require('fs');
	var classes = require('../classes.js');

	/** Inheritance */
	Function.inherit(this, classes.database.Entity);

	
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
	 * @type {Array<classes.database.Row>}
	 */
	this.rows = [];

	/**
	 * Initializes object.
	 */
	this.init = function()
	{
		
	};

	this.getFullPath = function()
	{
		return this.root + this.name + ".json";
	};

	this._checkIfTableAlreadyExists = function()
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

	this._readFromExisting = function()
	{

	};

	this.save = function(jsonData, callback)
	{
		var fileUrl = this.getFullPath();
		var jsonString = JSON.stringify(jsonData);

		fs.writeFile(fileUrl, jsonString, 'utf8', function(err, data){
			if (err)
			{
				console.log("DATABASE - Error has occured wile writing json data! (aborting)");
				console.log(err);
				return;
			} 
			
			obj = JSON.parse(data); //now it an object
		});
	};
};


module.exports = Table;