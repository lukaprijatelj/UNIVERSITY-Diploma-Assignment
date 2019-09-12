function RendererCanvas()
{
	Interface.inherit(this, IDisposable);
	this.canvasV = document.getElementById('rendering-canvas');
};
Interface.inheritPrototype(RendererCanvas, IDisposable);

RendererCanvas.prototype.init = function()
{
	var gridLayout = this;
};

RendererCanvas.prototype.resizeCanvas = function()
{
	var gridLayout = this;

	/*var interfaceV = document.querySelector('interface');
	var width = interfaceV.clientWidth;  
	var height = interfaceV.clientHeight; */

	var canvas = gridLayout.canvasV;
	canvas.width = options.CANVAS_WIDTH * options.RESOLUTION_FACTOR;
	canvas.height = options.CANVAS_HEIGHT * options.RESOLUTION_FACTOR;

	//var ctx = canvas.getContext('2d');
	//ctx.translate(width/2,height/2); // now 0,0 is the center of the canvas.
};


RendererCanvas.prototype.createLayout = function(cells)
{
	var gridLayout = this;
};


RendererCanvas.prototype.updateCell = function(cell)
{
	var gridLayout = this;

	if (!cell || !cell.imageData)
	{
		new Exception.ValueUndefined();
	}

	var posX = cell.startX;
	var posY = cell.startY;
	
	var img = new Image;
	img.onload = function()
	{
		var canvas = gridLayout.canvasV;
		var ctx = canvas.getContext('2d');

		ctx.drawImage(img, posX, posY); 
	};
	img.src = cell.imageData;
};


RendererCanvas.prototype.flagRenderCell = function(cell)
{
	var gridLayout = this;
	
	var borderWidth = 0.3;
	var posX = cell.startX + borderWidth;
	var posY = cell.startY + borderWidth;
	var width = cell.width - borderWidth * 2;
	var height = cell.height - borderWidth * 2;

	var canvas = gridLayout.canvasV;
	var ctx = canvas.getContext('2d');
	ctx.beginPath();
	ctx.lineWidth = String(borderWidth);
	ctx.strokeStyle = "red";
	ctx.rect(posX, posY, width, height);
	ctx.stroke();
};
