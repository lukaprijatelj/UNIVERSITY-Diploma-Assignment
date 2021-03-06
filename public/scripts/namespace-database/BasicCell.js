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
namespace.database.BasicCell = (() =>
{
	let BasicCell = function(index, startX, startY, width, height)
	{
		Object.setMetadata(this, 'constructor', 'namespace.database.BasicCell');

		this._id = BasicCell.generateId(startX, startY);
		this.index = index;
		this.width = width;
		this.height = height;
		this.startY = startY;
		this.startX = startX;
	};

	BasicCell.generateId = function(startX, startY)
	{
		return 'basic-cell-' + startX + '-' + startY;
	};

	return BasicCell;
})();