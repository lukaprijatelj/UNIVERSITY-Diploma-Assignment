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

namespace.database.SharedCell = (() => 
{
	var SharedCell = function(startX, startY, width, height)
	{
		var basicCell = new namespace.database.BasicCell(startX, startY, width, height);
		Object.cloneData(this, basicCell);

		Object.setMetadata(this, 'type', 'namespace.database.SharedCell');

		this._id = SharedCell.generateId(startX, startY);

		/**
		 * Socket IO client.
		 */
		this.socketIoClient = null;

		/**
		 * Progress of how much image has already rendered.
		 */
		this.progress = 0;

		this.timeRendering = 0;

		/**
		 * Image data can either be PNG format or raw pixels.
		 */
		this.imageData = null;
	};

	SharedCell.generateId = function(startX, startY)
	{
		return 'shared-cell-' + startX + '-' + startY;
	};

	return SharedCell;
})();