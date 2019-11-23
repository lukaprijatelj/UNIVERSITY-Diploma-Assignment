var DEBUG =
{
	timer: new Timer(1000),

	interface: document.querySelector('interface'),

	mouse: document.querySelector('#mouse-position .value'),

	canvas: document.querySelector('#canvas-size .value'),

	CAMERA_POSITION_X:0,
	CAMERA_POSITION_Y:0,
	CAMERA_POSITION_Z:0,
	CAMERA_ROTATION_X:0,
	CAMERA_ROTATION_Y:0,
	CAMERA_ROTATION_Z:0,


	init: function()
	{
		DEBUG.timer.callback = DEBUG.onRefresh;
		DEBUG.timer.loop = true;
		DEBUG.timer.start();
	},

	
	onRefresh: function()
	{
		if (globals.renderingServiceState == namespace.enums.renderingServiceState.RUNNING)
		{
			// no need to update values if rendering is enabled
			return;
		}

		if (globals.camera && globals.camera.position)
		{		
			var vec = new THREE.Vector3();
			vec.copy(globals.controls.target);
			var position = globals.camera.getWorldPosition(vec);

			DEBUG.CAMERA_POSITION_X = Math.roundToTwoDecimals(position.x);
			DEBUG.CAMERA_POSITION_Y = Math.roundToTwoDecimals(position.y);
			DEBUG.CAMERA_POSITION_Z = Math.roundToTwoDecimals(position.z);
			DEBUG.CAMERA_ROTATION_X = globals.camera.rotation.x;
			DEBUG.CAMERA_ROTATION_Y = globals.camera.rotation.y; 
			DEBUG.CAMERA_ROTATION_Z = globals.camera.rotation.z; 
		}
		
		DEBUG.mouse.innerHTML = '(' + mouse.getPositionX() + ' x ' + mouse.getPositionY() + ')';
		DEBUG.canvas.innerHTML = '(' + DEBUG.interface.clientWidth + ' x ' + DEBUG.interface.clientHeight + ')';
	}	
};