function CanvasLayout(layoutWrapperV)
{
	this.layoutWrapperV = null;
	this.canvasV = null;


	this._init = function()
	{
		var gridLayout = this;

		if (!layoutWrapperV)
		{
			new Exception.ValueUndefined();
		}

		gridLayout.layoutWrapperV = layoutWrapperV;
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

	if (!cell || !cell.imageData)
	{
		new Exception.ValueUndefined();
	}

	var posX = cell.startX;
	var posY = cell.startY;
	
	var img = new Image;
	img.onload = function()
	{
		var myCanvas = gridLayout.canvasV;
		var ctx = myCanvas.getContext('2d');

		ctx.drawImage(img, posX, posY); 
	};
	img.src = cell.imageData;
};


CanvasLayout.prototype.flagRenderCell = function(cell)
{
	var gridLayout = this;
	
	var borderWidth = 1;
	var posX = cell.startX + borderWidth;
	var posY = cell.startY + borderWidth;
	var width = cell.width - borderWidth;
	var height = cell.height - borderWidth;

	var myCanvas = gridLayout.canvasV;
	var ctx = myCanvas.getContext('2d');
	ctx.beginPath();
	ctx.lineWidth = String(borderWidth);
	ctx.strokeStyle = "red";
	ctx.rect(posX, posY, width, height);
	ctx.stroke();
};
