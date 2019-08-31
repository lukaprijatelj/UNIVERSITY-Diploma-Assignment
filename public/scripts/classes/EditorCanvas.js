function EditorCanvas()
{
	Interface.inherit(this, IDisposable);
	this.canvasV = document.getElementById('editor-canvas');
}
Interface.inheritPrototype(EditorCanvas, IDisposable);

EditorCanvas.prototype.init = function()
{
	var editorCanvas = this;

	window.addEventListener('resize', () =>
	{
		editorCanvas.resizeCanvas();
	}, false);
};

EditorCanvas.prototype.resizeCanvas = function()
{
	var editorCanvas = this;

	var interfaceV = document.querySelector('interface');
	var width = interfaceV.clientWidth;  
	var height = interfaceV.clientHeight; 

	var canvas = editorCanvas.canvasV;
	canvas.width = width;
	canvas.height = height;

	if (options)
	{
		options.CANVAS_WIDTH = width;
		options.CANVAS_HEIGHT = height;
	}
	
	if (WebPage.renderer)
	{
		WebPage.renderer.setSize(width, height);
		WebPage.camera.aspect = width/height;
		WebPage.camera.updateProjectionMatrix();
	}
	
	//var ctx = canvas.getContext('2d');
	//ctx.translate(width/2,height/2); // now 0,0 is the center of the canvas.
};