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
	let ThreadCell = function(threadIndex)
	{
		var basicCell = new namespace.database.BasicCell();
		Object.cloneData(this, basicCell);
		Object.setMetadata(this, 'type', 'namespace.database.ThreadCell');

		this._id = ThreadCell.generateId(threadIndex);

		this.threadIndex = threadIndex;

		/**
		 * Progress of how much image has already rendered.
		 */
		this.progress = 0;

		this.rawImage = null;
	};

	ThreadCell.generateId = function(threadIndex)
	{
		return 'thread-' + threadIndex + '-cell';
	};

	return ThreadCell;
})();