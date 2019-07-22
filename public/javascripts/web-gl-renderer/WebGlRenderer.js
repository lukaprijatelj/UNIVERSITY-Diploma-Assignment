function WebGlRenderer()
{

}

WebGlRenderer.prototype.init = function()
{
	var renderer = this;

	var options = 
	{ 
		canvas: canvas 
	};
	renderer = new THREE.WebGLRenderer(options);
	
	renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);

	document.body.appendChild(renderer.domElement);	
};