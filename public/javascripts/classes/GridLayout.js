function GridLayout(layoutWrapperV)
{
	this.layoutWrapperV = layoutWrapperV;


	this._init = function()
	{
		var gridLayout = this;

		gridLayout.layoutWrapperV.setAttribute('data-layout-type', enums.layoutType.GRID);
	};
	this._init();
};


GridLayout.prototype.dispose = function()
{
	var gridLayout = this;

	var layoutWrapperV = gridLayout.layoutWrapperV;
	layoutWrapperV.empty();
};


GridLayout.prototype.createLayout = function(cells)
{
	var gridLayout = this;

	var layoutWrapperV = gridLayout.layoutWrapperV;
	layoutWrapperV.empty();

	var prevCell = null;

	for (var i=0; i<cells.length; i++)
	{
		var current = cells[i];

		if (prevCell && prevCell.startX > current.startX)
		{
			var dividerV = HTMLElement.createElement('<br>');
			layoutWrapperV.appendChild(dividerV);
		}

		var id = 'cell-' + current.startX + '-' + current.startY;
		var cellV = HTMLElement.createElement('<div id="' + id + '" class="render-cell" style="width:' + current.width + 'px; height:' + current.height + 'px;"></div>');
		layoutWrapperV.appendChild(cellV);
		
		prevCell = current;
	}
};

GridLayout.prototype.updateCell = function(cell)
{
	var gridLayout = this;
	
	var id = 'cell-' + cell.startX + '-' + cell.startY;
	var divHolderV = document.getElementById(id);

	var imageV = HTMLElement.createElement('<img src="' + cell.imageData + '" id="' + id + '" class="render-cell" style="width:' + cell.width + 'px; height:' + cell.height + 'px;" />');

	divHolderV.parentNode.replaceChild(imageV, divHolderV);
};

GridLayout.prototype.flagRenderCell = function(cell)
{
	var gridLayout = this;
	
	var id = 'cell-' + cell.startX + '-' + cell.startY;
	var divHolderV = document.getElementById(id);
	divHolderV.style.background = '#FF4F49';
};