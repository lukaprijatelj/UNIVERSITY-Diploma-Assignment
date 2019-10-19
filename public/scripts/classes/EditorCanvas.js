/**
 * Canvas for admin
 */
function EditorCanvas()
{
	Interface.inherit(this, IDisposable);

	this.canvasV = document.getElementById('editor-canvas');
	this.resizeCanvas = EditorCanvas.resizeCanvas.bind(this);
}
Interface.inheritPrototype(EditorCanvas, IDisposable);

EditorCanvas.prototype.init = function()
{
	var _this = this;

	window.addEventListener('resize', _this.resizeCanvas, false);
};

EditorCanvas.prototype._dispose = function()
{
	var _this = this;

	window.removeEventListener('resize', _this.resizeCanvas);
};

/**
 * Watches window on resize.
 */
EditorCanvas.resizeCanvas = function()
{
	var _this = this;

	var interfaceV = document.querySelector('interface');
	var width = interfaceV.clientWidth;  
	var height = interfaceV.clientHeight; 

	var canvas = _this.canvasV;
	canvas.width = width;
	canvas.height = height;

	/*if (options)
	{
		options.CANVAS_WIDTH = width;
		options.CANVAS_HEIGHT = height;
	}*/
	
	if (globals.renderer)
	{
		globals.renderer.setSize(width, height);
		globals.camera.aspect = width / height;
		globals.camera.updateProjectionMatrix();
	}
	
	//var ctx = canvas.getContext('2d');
	//ctx.translate(width/2,height/2); // now 0,0 is the center of the canvas.
};