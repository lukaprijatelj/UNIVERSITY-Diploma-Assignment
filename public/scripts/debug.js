var DEBUG =
{
	timer: new namespace.core.Timer(1000),

	interface: document.querySelector('interface'),

	mouse: document.querySelector('#mouse-position .value'),

	canvas: document.querySelector('#canvas-size .value'),

	camera: 
	{
		
	},

	CAMERA_POSITION_X:0,
	CAMERA_POSITION_Y:0,
	CAMERA_POSITION_Z:0,
	CAMERA_ROTATION_X:0,
	CAMERA_ROTATION_Y:0,
	CAMERA_ROTATION_Z:0,


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

			DEBUG.CAMERA_POSITION_X = Math.roundToTwoDecimals(position.x);
			DEBUG.CAMERA_POSITION_Y = Math.roundToTwoDecimals(position.y);
			DEBUG.CAMERA_POSITION_Z = Math.roundToTwoDecimals(position.z);
			DEBUG.CAMERA_ROTATION_X = WebPage.camera.rotation.x;
			DEBUG.CAMERA_ROTATION_Y = WebPage.camera.rotation.y; 
			DEBUG.CAMERA_ROTATION_Z = WebPage.camera.rotation.z; 
		}
		
		let mouse = new namespace.core.Mouse();

		DEBUG.mouse.innerHTML = '(' + mouse.getPositionX() + ' x ' + mouse.getPositionY() + ')';
		DEBUG.canvas.innerHTML = '(' + DEBUG.interface.clientWidth + ' x ' + DEBUG.interface.clientHeight + ')';
	}	
};