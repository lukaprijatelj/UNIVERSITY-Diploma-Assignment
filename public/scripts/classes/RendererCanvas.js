/**
 * Rendering canvas.
 */
function RendererCanvas()
{
	Interface.inherit(this, IDisposable);

	this.canvasV = null;
	this.flagCanvasV = null;

	this._onImageLoaded = RendererCanvas._onImageLoaded.bind(this);
	this.updateCellPixels = RendererCanvas.updateCellPixels.bind(this);
	this.updateThreadCellImage = RendererCanvas.updateThreadCellImage.bind(this);
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

RendererCanvas.updateThreadCellImage = function(thread, cell, resolve, reject)
{
	let _this = this;

	var posX = cell.startX;
	var posY = cell.startY;

	var canvas = _this.canvasV;
	var ctx = canvas.getContext('2d');
	
	ctx.putImageData(cell.rawImage.imageData, posX, posY);

	if (API.renderingServiceState == 'pause')
	{
		thread.resolve = resolve;
		thread.reject = reject;

		_this.pauseThreadCell(thread.cell);
	}
	else
	{
		resolve();
	}
};

/**
 * Updates cell image.
 */
RendererCanvas.updateCellImage = function(cell)
{
	var _this = this;

	if (!cell)
	{
		new Exception.ValueUndefined('Image to be updated on canvas is undefined!');
	}

	if (!cell.imageData)
	{
		new Exception.ValueUndefined('Image to be updated on canvas is undefined!');
	}
	
	var img = new Image();
	img.onload = _this._onImageLoaded.bind(null, img, cell);
	img.src = cell.imageData;
};

/**
 * Updates cell image.
 */
RendererCanvas.updateCellPixels = function(thread, data)
{
	var _this = this;

	var canvas = _this.canvasV;
	var ctx = canvas.getContext('2d');

	ctx.putImageData(data.imageData, data.posX, data.posY); 
};

/**
 * Image is loaded and can now be drawn to canvas.
 */
RendererCanvas._onImageLoaded = function(img, cell)
{
	var _this = this;

	var posX = cell.startX;
	var posY = cell.startY;

	var canvas = _this.canvasV;
	var ctx = canvas.getContext('2d');

	ctx.drawImage(img, posX, posY); 
};

/**
 * Adds cell to flag-canvas (usually cell that are waiting to be rendered).
 */
RendererCanvas.prototype.addWaitingCell = function(cell)
{
	var _this = this;	

	let div = new namespace.html.Div();
	div.id = cell._id;
	div.addClass('flag-cell');

	var borderWidth = 0.5;
	var posX = cell.startX;
	var posY = cell.startY;
	var width = cell.width;
	var height = cell.height;

	let unit = 'px';
	div.style.width = width + unit;
	div.style.height = height + unit;
	div.style.left = posX + unit;
	div.style.top = posY + unit;
	div.style.borderWidth = borderWidth + unit;

	_this.flagCanvasV.appendChild(div);
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
RendererCanvas.prototype.addThreadCell = function(threadIndex)
{
	var _this = this;

	let div = new namespace.html.Div();
	div.id = 'thread-cell-' + threadIndex;
	div.hide();
	div.addClass('thread-cell');

	let label = new namespace.html.Div();
	label.addClass('label');
	div.appendChild(label);
		
	_this.flagCanvasV.appendChild(div);
};

/**
 * Flags area where this cell is currently rendering.
 */
RendererCanvas.prototype.removeThreadCell = function(cell)
{
	var _this = this;

	let div = _this.flagCanvasV.querySelector('#thread-cell-' + cell.threadIndex);
	
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
RendererCanvas.prototype.showThreadCell = function(cell)
{
	var _this = this;

	let div = _this.flagCanvasV.querySelector('#thread-cell-' + cell.threadIndex);
	div.show();
	
	if (!div)
	{
		new Warning.Other('Thread cell was not found!');
		return;
	}

	let label = div.children[0];

	var borderWidth = 2;
	var posX = cell.startX - borderWidth;
	var posY = cell.startY - borderWidth;
	var width = cell.width + borderWidth * 2;
	var height = cell.height + borderWidth * 2;
	let unit = 'px';

	label.innerHTML = cell.threadIndex;
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
RendererCanvas.prototype.hideThreadCell = function(cell)
{
	var _this = this;

	let div = _this.flagCanvasV.querySelector('#thread-cell-' + cell.threadIndex);
	
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
RendererCanvas.prototype.pauseThreadCell = function(cell)
{
	var _this = this;

	let div = _this.flagCanvasV.querySelector('#thread-cell-' + cell.threadIndex);
	
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
RendererCanvas.prototype.resumeThreadCell = function(cell)
{
	var _this = this;

	let div = _this.flagCanvasV.querySelector('#thread-cell-' + cell.threadIndex);
	
	if (!div)
	{
		new Warning.Other('Thread cell was not found!');
		return;
	}

	div.removeClass('paused');
};
