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

namespace.database.RenderingCell = function(id, startX, startY, width, height)
{
	var basicCell = new namespace.database.BasicCell(id, startX, startY, width, height);
	Object.cloneData(this, basicCell);

	this.sessionId = String();
	this.progress = 0;
	this.imageData = null;
};