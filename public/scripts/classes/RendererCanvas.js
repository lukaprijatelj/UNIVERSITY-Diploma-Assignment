/**
 * Rendering canvas.
 */
function RendererCanvas()
{
	Interface.inherit(this, IDisposable);

	this.canvasV = null;
	this.flagCanvasV = null;

	this._onImageLoaded = RendererCanvas._onImageLoaded.bind(this);
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

/**
 * Creates cells layout.
 */
RendererCanvas.prototype.createLayout = function(cells)
{
	var _this = this;
};

/**
 * Updates cell image.
 */
RendererCanvas.prototype.updateCellImage = function(cell)
{
	var _this = this;

	if (!cell || !cell.imageData)
	{
		new Exception.ValueUndefined();
	}
	
	var img = new Image();
	img.onload = _this._onImageLoaded.bind(null, img, cell);
	img.src = cell.imageData;
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
RendererCanvas.prototype.addRenderCell = function(cell)
{
	var _this = this;	

	let flagCanvas = _this.flagCanvasV;
	
	let div = new namespace.html.Div();
	div.id = cell._id;
	div.addClass('flag-cell');

	var borderWidth = 0.3;
	var posX = cell.startX + borderWidth;
	var posY = cell.startY + borderWidth;
	var width = cell.width - borderWidth * 2;
	var height = cell.height - borderWidth * 2;

	let unit = 'px';
	div.style.width = width + unit;
	div.style.height = height + unit;
	div.style.left = posX + unit;
	div.style.top = posY + unit;
	div.style.borderWidth = borderWidth + unit;

	flagCanvas.appendChild(div);
};

/**
 * Adds cell to flag-canvas (usually cell that are waiting to be rendered).
 */
RendererCanvas.prototype.addWorkerCell = function(cell)
{
	var _this = this;	

	let flagCanvas = _this.flagCanvasV;
	
	let div = new namespace.html.Div();
	div.id = cell._id;
	div.addClass('flag-cell');

	var borderWidth = 0.3;
	var posX = cell.startX + borderWidth;
	var posY = cell.startY + borderWidth;
	var width = cell.width - borderWidth * 2;
	var height = cell.height - borderWidth * 2;

	let unit = 'px';
	div.style.width = width + unit;
	div.style.height = height + unit;
	div.style.left = posX + unit;
	div.style.top = posY + unit;
	div.style.borderWidth = borderWidth + unit;

	flagCanvas.appendChild(div);
};

/**
 * Flags area where this cell is currently rendering.
 */
RendererCanvas.prototype.addWorkerCell = function(workerIndex)
{
	var _this = this;
	let flagCanvas = _this.flagCanvasV;
	
	let div = new namespace.html.Div();
	div.id = 'cell-thread-' + workerIndex;
	div.hide();
	div.addClass('flag-cell');
	div.addClass('active');
		
	flagCanvas.appendChild(div);
};

/**
 * Flags area where this cell is currently rendering.
 */
RendererCanvas.prototype.setWorkerCell = function(cell)
{
	var _this = this;
	let flagCanvas = _this.flagCanvasV;
	
	let div = flagCanvas.querySelector('#cell-thread-' + cell.workerIndex);
	div.show();
	
	if (!div)
	{
		new Warning.Other('Thread cell was not found!');
		return;
	}

	var borderWidth = 2;
	var posX = cell.startX - borderWidth;
	var posY = cell.startY - borderWidth;
	var width = cell.width;
	var height = cell.height;

	let unit = 'px';
	div.style.width = width + unit;
	div.style.height = height + unit;
	div.style.left = posX + unit;
	div.style.top = posY + unit;
	div.style.borderWidth = borderWidth + unit;
};

/**
 * Flags area where this cell is currently rendering.
 */
RendererCanvas.prototype.unsetWorkerCell = function(cell)
{
	var _this = this;
	let flagCanvas = _this.flagCanvasV;
	
	let div = flagCanvas.querySelector('#cell-thread-' + cell.workerIndex);
	
	if (!div)
	{
		new Warning.Other('Thread cell was not found!');
		return;
	}

	div.hide();
};

/**
 * Removes cell from flag-canvas.
 */
RendererCanvas.prototype.removeRenderCell = function(cell)
{
	var _this = this;
	let flagCanvas = _this.flagCanvasV;
	
	let div = flagCanvas.querySelector('#' + cell._id);

	if (!div)
	{
		new Warning.Other('Rendering cell was not found!');
		return;
	}

	div.remove();
};