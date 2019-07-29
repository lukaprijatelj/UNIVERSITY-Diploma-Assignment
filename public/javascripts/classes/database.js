// namespace
var database = { };


if (typeof module !== 'undefined' && module.exports)
{
	// export for nodeJS use
	module.exports = database;
}


// -----------------------------
// Rendering cells
// -----------------------------
database.BasicCell = function(id, startX, startY, width, height)
{
	this._id = id;
	this.width = width;
	this.height = height;
	this.startY = startY;
	this.startX = startX;
};

database.RenderingCell = function(id, startX, startY, width, height)
{
	var basicCell = new database.BasicCell(id, startX, startY, width, height);
	Object.cloneData(this, basicCell);

	this.sessionId = '';
	this.progress = 0;
	this.imageData = null;
};



// -----------------------------
// Rendering clients
// -----------------------------
database.Client = function(id, sessionId, ipAddress, active, isAdmin)
{
	this._id = id;
	this.sessionId = sessionId;
	this.ipAddress = ipAddress;
	this.active = active;
	this.admin = isAdmin;
};