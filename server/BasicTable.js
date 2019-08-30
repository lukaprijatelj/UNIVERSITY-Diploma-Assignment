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
	 * Number of requests to save file.
	 * @type {number}
	 */
	this._saveRequestNumber = 0;

	/**
	 * Number of miliseconds between intervals for checking if table needs to be saved.
	 * @type {number} 
	 */
	this.CHECK_SAVING_INTERVAL = 1000;

	/**
	 * Flag indicating if table is currently saving.
	 * @type {boolean}
	 */
	this.isSaving = false;

	/**
	 * Initializes object.
	 */
	this.init = function()
	{
		var basicTable = this;

		var tableNeedsReading = basicTable._readExistingTable.bind(basicTable);
		basicTable._checkIfTableAlreadyExists(tableNeedsReading);

		var intervalCallback = basicTable._checkIfSavingNeeded.bind(basicTable);
		setInterval(intervalCallback, basicTable.CHECK_SAVING_INTERVAL);
	};
	this.init();
};

/**
 * Callback for checking if table needs saving to file.
 */
BasicTable.prototype._checkIfSavingNeeded = function()
{
	if (this.isSaving == true)
	{
		return;
	}

	if (this._saveRequestNumber == 0)
	{
		return;
	}

	//this._save();
};

/**
 * Saves table to json file.
 */
BasicTable.prototype._save = function()
{
	var basicTable = this;
	
	var currentSaveRequestTimestamp = basicTable._saveRequestNumber;
	var fileUrl = basicTable.getFullPath();
	var jsonData = { rows: basicTable.rows };
	var jsonString = JSON.stringify(jsonData, null, 4);

	basicTable.isSaving = true;

	fs.writeFile(fileUrl, jsonString, 'utf8', function(err)
	{
		if (err)
		{
			console.error("DATABASE - Error has occured wile writing json data! (aborting)");
			console.error(err);
			return;
		} 

		if (currentSaveRequestTimestamp == basicTable._saveRequestNumber)
		{
			// reset counter
			basicTable._saveRequestNumber = 0;
		}

		basicTable.isSaving = false;
	});
};

/**
 * Gets full table filepath.
 */
BasicTable.prototype.getFullPath = function()
{
	return this.root + this.name + ".json";
};

/**
 * Checks if ptable file already exists.
 */
BasicTable.prototype._checkIfTableAlreadyExists = function(callback)
{
	callback = callback ? callback : Function.empty;

	var basicTable = this;
	var fileUrl = basicTable.getFullPath();

	fs.access(fileUrl, fs.F_OK, (err) => {
		if (err) 
		{
			// file does not exist
			basicTable.save();
			
			return;
		}
	
		callback();
	});
};

/**
 * Reads data from existing table.
 */
BasicTable.prototype._readExistingTable = function()
{
	var basicTable = this;
	var fileUrl = basicTable.getFullPath();

	fs.readFile(fileUrl, 'utf8', function(err, contents) 
	{
		if (err) 
		{
			console.error("BasicTable - Error while reading already existing table! (aborting)");
			console.error(err);
			return;
		}

		var obj = new Object();

		try
		{
			obj = JSON.parse(contents);
		}
		catch(error)
		{
			console.error("BasicTable - Error while parsing JSON. (clearing table contents)");

			fs.unlink(fileUrl, (err) => 
			{
				if (err) throw err;
			});
		}

		basicTable.rows = obj.rows;
	});
};

/**
 * Marks table for saving.
 */
BasicTable.prototype.save = function()
{
	this._saveRequestNumber++;
};

module.exports = BasicTable;