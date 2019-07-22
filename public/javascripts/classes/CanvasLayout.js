function CanvasLayout(layoutWrapperV)
{
	this.layoutWrapperV = layoutWrapperV;
	this.canvasV = null;


	this._init = function()
	{
		var gridLayout = this;

		gridLayout.layoutWrapperV.setAttribute('data-layout-type', enums.layoutType.CANVAS);
	};
	this._init();
};


CanvasLayout.prototype.dispose = function()
{
	var gridLayout = this;
	
	var layoutWrapperV = gridLayout.layoutWrapperV;
	layoutWrapperV.empty();
};


CanvasLayout.prototype.createLayout = function(cells)
{
	var gridLayout = this;

	var layoutWrapperV = gridLayout.layoutWrapperV;
	layoutWrapperV.empty();

	var canvasV = HTMLElement.createElement('<canvas id="rendering-canvas" class=""></canvas>');
	canvasV.width = CANVAS_WIDTH;
	canvasV.height = CANVAS_HEIGHT;
	gridLayout.canvasV = canvasV;
	layoutWrapperV.appendChild(canvasV);
};

CanvasLayout.prototype.updateCell = function(cell)
{
	var gridLayout = this;

	var myCanvas = gridLayout.canvasV;
	var ctx = myCanvas.getContext('2d');

	var img = new Image;
	img.onload = function()
	{
		ctx.drawImage(img, cell.startX, cell.startY); 
	};
	img.src = cell.imageData;
};

CanvasLayout.prototype.flagRenderCell = function(cell)
{
	var gridLayout = this;
	
	var myCanvas = gridLayout.canvasV;
	var ctx = myCanvas.getContext('2d');

	var borderWidth = 1;

	ctx.beginPath();
	ctx.lineWidth = String(borderWidth);
	ctx.strokeStyle = "red";
	ctx.rect(cell.startX + borderWidth, cell.startY + borderWidth, cell.width - borderWidth, cell.height - borderWidth);
	ctx.stroke();
};
