var DEBUG =
{
	timer: new namespace.core.Timer(1000),

	interface: document.querySelector('interface'),

	mouse: document.querySelector('#mouse-position .value'),

	canvas: document.querySelector('#canvas-size .value'),

	camera: 
	{
		
	},


	init: function()
	{
		DEBUG.timer.callback = DEBUG.onRefresh;
		DEBUG.timer.enableLooping();
		DEBUG.timer.start();
	},

	
	onRefresh: function()
	{
		if (WebPage.isRendering == true)
		{
			// no need to update values if rendering is enabled
			return;
		}

		if (WebPage.camera && WebPage.camera.position)
		{		
			var vec = new THREE.Vector3();
			vec.copy(WebPage.controls.target);
			var position = WebPage.camera.getWorldPosition(vec);

			options.CAMERA_POSITION_X = Math.roundToTwoDecimals(position.x);
			options.CAMERA_POSITION_Y = Math.roundToTwoDecimals(position.y);
			options.CAMERA_POSITION_Z = Math.roundToTwoDecimals(position.z);
		}
		
		let mouse = new namespace.core.Mouse();

		DEBUG.mouse.innerHTML = '(' + mouse.getPositionX() + ' x ' + mouse.getPositionY() + ')';
		DEBUG.canvas.innerHTML = '(' + DEBUG.interface.clientWidth + ' x ' + DEBUG.interface.clientHeight + ')';
	}	
};