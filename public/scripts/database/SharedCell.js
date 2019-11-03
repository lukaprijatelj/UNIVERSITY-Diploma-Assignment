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
	var SharedCell = function(index, startX, startY, width, height)
	{
		Object.cloneData(this, new namespace.database.BasicCell(index, startX, startY, width, height));
		Object.setMetadata(this, 'constructor', 'namespace.database.SharedCell');

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

		this.startTimestampSending = 0;
		this.endTimestampSending = 0;
		this.fullTime = 0;

		/**
		 * Image data can either be PNG format or raw pixels.
		 */
		this.rawImage = null;
	};

	SharedCell.parse = function(obj)
	{
		if (obj.rawImage && obj.rawImage.imageData)
		{
			let originalImageData = obj.rawImage.imageData;

			let newImageData = new ImageData(originalImageData.width, originalImageData.height);
			
			for (let i=0; i<originalImageData.data.length; i++)
			{
				newImageData.data[i] = originalImageData.data[i];
			}

			obj.rawImage.imageData = newImageData;
		}
	};

	SharedCell.toJson = function(obj)
	{
		if (obj.rawImage && obj.rawImage.imageData)
		{
			let originalImageData = obj.rawImage.imageData;

			var data = Array.prototype.slice.call(originalImageData.data);

			obj.rawImage.imageData = 
			{
				data: data, 
				width: originalImageData.width, 
				height: originalImageData.height
			};
		}
	};

	SharedCell.generateId = function(startX, startY)
	{
		return 'shared-cell-' + startX + '-' + startY;
	};

	return SharedCell;
})();