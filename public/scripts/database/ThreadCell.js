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

namespace.database.ThreadCell = (() =>
{
	let ThreadCell = function(threadIndex, startX, startY, width, height)
	{
		var basicCell = new namespace.database.BasicCell(startX, startY, width, height);
		Object.cloneData(this, basicCell);
		
		Object.addMetadata(this, 'type', 'namespace.database.ThreadCell');

		this._id = ThreadCell.generateId(threadIndex, startX, startY);

		this.threadIndex = threadIndex;
	};

	ThreadCell.generateId = function(threadIndex, startX, startY)
	{
		return 'thread-' + threadIndex + '-cell-' + startX + '-' + startY;
	};

	return ThreadCell;
})();