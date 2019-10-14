'use strict';

var _this = this;

if (typeof module !== 'undefined' && module.exports)
{
	// export for nodeJS use
	_this = global;
}

if (typeof _this.namespace == 'undefined')
{
	_this.namespace = {};
}

if (typeof _this.namespace.database == 'undefined')
{
	_this.namespace.database = {};
}

// -----------------------------
// Rendering cells
// -----------------------------
namespace.database.BasicCell = function(id, startX, startY, width, height)
{
	this._id = id;
	this.width = width;
	this.height = height;
	this.startY = startY;
	this.startX = startX;
};