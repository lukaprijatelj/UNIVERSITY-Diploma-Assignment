var DEBUG =
{
	timer: new namespace.core.Timer(1000),

	interface: document.getElementById('interface'),

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
		if (GLOBALS.isRendering == true)
		{
			// no need to update values if rendering is enabled
			return;
		}

		if (GLOBALS.camera && GLOBALS.camera.position)
		{		
			var vec = new THREE.Vector3();
			vec.copy(GLOBALS.controls.target);
			var position = GLOBALS.camera.getWorldPosition(vec);

			options.CAMERA_POSITION_X = Math.roundToTwoDecimals(position.x);
			options.CAMERA_POSITION_Y = Math.roundToTwoDecimals(position.y);
			options.CAMERA_POSITION_Z = Math.roundToTwoDecimals(position.z);
		}
		
		let mouse = new namespace.core.Mouse();

		DEBUG.mouse.innerHTML = '(' + mouse.getPositionX() + ' x ' + Math.roundToTwoDecimals(mouse.getPositionY()) + ')';
		DEBUG.canvas.innerHTML = '(' + DEBUG.interface.clientWidth + ' x ' + DEBUG.interface.clientHeight + ')';
	}	
};