function EditorCanvas()
{
	this.canvasV = document.getElementById('editor-canvas');
}

EditorCanvas.prototype.init = function()
{
	var editorCanvas = this;

	window.addEventListener('resize', () =>
	{
		editorCanvas.resizeCanvas();
	}, false);

	editorCanvas.resizeCanvas();
};

EditorCanvas.prototype.resizeCanvas = function()
{
	var editorCanvas = this;

	var interfaceV = document.getElementById('interface');
	var width = interfaceV.clientWidth;  
	var height = interfaceV.clientHeight; 

	var canvas = editorCanvas.canvasV;
	canvas.width = width;
	canvas.height = height;

	if (GLOBALS.renderer)
	{
		GLOBALS.renderer.setSize(width, height);
		GLOBALS.camera.aspect = width/height;
		GLOBALS.camera.updateProjectionMatrix();
	}
	
	//var ctx = canvas.getContext('2d');
	//ctx.translate(width/2,height/2); // now 0,0 is the center of the canvas.
};