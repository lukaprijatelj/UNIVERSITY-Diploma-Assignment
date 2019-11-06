var _this = this;

if (typeof _this.namespace == 'undefined')
{
    _this.namespace = new Object();
}

if (typeof namespace.html == 'undefined')
{
    namespace.html = new Object();
}

namespace.html.RendererCanvas = (() =>
{
	/**
	 * Rendering canvas.
	 */
	var RendererCanvas = function()
	{
		Interface.inherit(this, IDisposable);

		this.canvasV = null;
		this.flagCanvasV = null;
		this.flagCanvasOthersV = null;

		this.updateThreadCellImage = this.updateThreadCellImage.bind(this);
	};
	Interface.inheritPrototype(RendererCanvas, IDisposable);

	/**
	 * Initializes canvas.
	 */
	RendererCanvas.prototype.init = function()
	{
		var _this = this;

		_this.canvasV = document.getElementById('rendering-canvas');
		_this.flagCanvasV = document.getElementById('flag-canvas-this');
		_this.flagCanvasOthersV = document.getElementById('flag-canvas-others');
	};

	/**
	 * Resizes canvas width and height.
	 */
	RendererCanvas.prototype.resize = function()
	{
		var _this = this;

		/*var interfaceV = document.querySelector('interface');
		var width = interfaceV.clientWidth;  
		var height = interfaceV.clientHeight; */

		var canvas = _this.canvasV;
		canvas.width = options.CANVAS_WIDTH * options.RESOLUTION_FACTOR;
		canvas.height = options.CANVAS_HEIGHT * options.RESOLUTION_FACTOR;

		let flagCanvas = _this.flagCanvasV;
		flagCanvas.style.width = options.CANVAS_WIDTH * options.RESOLUTION_FACTOR + 'px';
		flagCanvas.style.height = options.CANVAS_HEIGHT * options.RESOLUTION_FACTOR + 'px';

		//var ctx = canvas.getContext('2d');
		//ctx.translate(width/2,height/2); // now 0,0 is the center of the canvas.
	};

	/**
	 * Updates thread cell image.
	 */
	RendererCanvas.prototype.updateThreadCellImage = function(cell)
	{
		let _this = this;

		var posX = cell.startX;
		var posY = cell.startY;

		var canvas = _this.canvasV;

		var ctx = canvas.getContext('2d');
		ctx.putImageData(cell.rawImage.imageData, posX, posY);
	};

	/**
	 * Updates cell image.
	 */
	RendererCanvas.prototype.updateCellImage = function(cell)
	{
		var _this = this;

		if (!cell)
		{
			new Exception.ValueUndefined('Image to be updated on canvas is undefined!');
		}

		if (!cell.rawImage)
		{
			new Exception.ValueUndefined('Image to be updated on canvas is undefined!');
		}

		var posX = cell.startX;
		var posY = cell.startY;
		var canvas = _this.canvasV;

		var ctx = canvas.getContext('2d');
		ctx.putImageData(cell.rawImage.imageData, posX, posY);
	};

	/**
	 * Adds cell to flag-canvas (usually cell that are waiting to be rendered).
	 */
	RendererCanvas.prototype.addWaitingCell = function(cell)
	{
		var _this = this;	

		let div = new namespace.html.Div();
		div.id = cell._id;
		div.addClass('waiting-cell');

		var borderWidth = 0.5;
		var posX = cell.startX;
		var posY = cell.startY;
		var width = cell.width;
		var height = cell.height;

		let unit = 'px';
		div.style.width = width + unit;
		div.style.height = height + unit;
		div.style.borderWidth = borderWidth + unit;

		_this.flagCanvasV.appendChild(div, posX, posY);
	};

	/**
	 * Removes cell from flag-canvas.
	 */
	RendererCanvas.prototype.removeWaitingCell = function(cell)
	{
		var _this = this;

		let div = _this.flagCanvasV.querySelector('#' + cell._id);

		if (!div)
		{
			new Warning.Other('Waiting cell was not found!');
			return;
		}

		div.remove();
	};

	/**
	 * Flags area where this cell is currently rendering.
	 */
	RendererCanvas.prototype.addThreadCell = function(thread)
	{
		var _this = this;

		let div = new namespace.html.Div();
		div.id = thread.cellId;
		div.addClass('thread-cell');
		div.hide();	

		let label = new namespace.html.Div();
		label.addClass('label');
		div.appendChild(label);
			
		_this.flagCanvasV.appendChild(div);
	};

	/**
	 * Flags area where this cell is currently rendering.
	 */
	RendererCanvas.prototype.removeThreadCell = function(thread)
	{
		var _this = this;

		let div = _this.flagCanvasV.querySelector('#' + thread.cellId);
		
		if (!div)
		{
			new Warning.Other('Thread cell was not found!');
			return;
		}

		div.remove();
	};

	/**
	 * Flags area where this cell is currently rendering.
	 */
	RendererCanvas.prototype.showThreadCell = function(thread)
	{
		var _this = this;

		let div = _this.flagCanvasV.querySelector('#' + thread.cellId);
		div.show();
		
		if (!div)
		{
			new Warning.Other('Thread cell was not found!');
			return;
		}

		let label = Array.getFirst(div.children);

		let cell = thread.cell;
		var borderWidth = 2;
		var posX = cell.startX - borderWidth;
		var posY = cell.startY - borderWidth;
		var width = cell.width + borderWidth * 2;
		var height = cell.height + borderWidth * 2;
		let unit = 'px';

		label.innerHTML = thread.index;
		label.style.marginTop = cell.height + unit; 

		div.style.width = width + unit;
		div.style.height = height + unit;
		div.style.left = posX + unit;
		div.style.top = posY + unit;
		div.style.borderWidth = borderWidth + unit;
	};

	/**
	 * Flags area where this cell is currently rendering.
	 */
	RendererCanvas.prototype.scrollToCell = function(thread)
	{
		var _this = this;

		let div = _this.flagCanvasV.querySelector('#' + thread.cellId);
		div.show();
		
		if (!div)
		{
			new Warning.Other('Thread cell was not found!');
			return;
		}

		let interfaceHtml = document.querySelector('interface');
		interfaceHtml.scrollIntoView(div);
	};

	/**
	 * Flags area where this cell is currently rendering.
	 */
	RendererCanvas.prototype.hideThreadCell = function(thread)
	{
		var _this = this;

		let div = _this.flagCanvasV.querySelector('#' + thread.cellId);
		
		if (!div)
		{
			new Warning.Other('Thread cell was not found!');
			return;
		}

		div.hide();
	};

	/**
	 * Flags thread cell as paused.
	 */
	RendererCanvas.prototype.pauseThreadCell = function(thread)
	{
		var _this = this;

		let div = _this.flagCanvasV.querySelector('#' + thread.cellId);
		
		if (!div)
		{
			new Warning.Other('Thread cell was not found!');
			return;
		}

		div.addClass('paused');
	};

	/**
	 * Unflags thread cell as paused.
	 */
	RendererCanvas.prototype.resumeThreadCell = function(thread)
	{
		var _this = this;

		let div = _this.flagCanvasV.querySelector('#' + thread.cellId);
		
		if (!div)
		{
			new Warning.Other('Thread cell was not found!');
			return;
		}

		div.removeClass('paused');
	};


	/**
	 * Adds cell to flag-canvas (usually cell that are waiting to be rendered).
	 */
	RendererCanvas.prototype.addOthersCell = function(cell)
	{
		var _this = this;	

		let div = new namespace.html.Div();
		div.id = cell._id;
		div.addClass('others-cell');

		var posX = cell.startX;
		var posY = cell.startY;
		var width = cell.width;
		var height = cell.height;

		let unit = 'px';
		div.style.width = width + unit;
		div.style.height = height + unit;

		_this.flagCanvasOthersV.appendChild(div, posX, posY);
	};

	/**
	 * Removes others cell.
	 */
	RendererCanvas.prototype.removeOthersCell = function(cell)
	{
		var _this = this;

		let div = _this.flagCanvasOthersV.querySelector('#' + cell._id);
		
		if (!div)
		{
			new Warning.Other('Others cell was not found!');
			return;
		}

		div.remove();
	};

	return RendererCanvas;
})();