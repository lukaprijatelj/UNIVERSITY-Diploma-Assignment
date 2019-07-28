var DEBUG =
{
	timer: new Timer(1000),

	interface: document.getElementById('interface'),

	mouse:
	{
		positionX: document.getElementById('mouse-x-input'),
		positionY: document.getElementById('mouse-y-input'),
	},

	canvas:
	{
		width: document.getElementById('canvas-width-input'),
		height: document.getElementById('canvas-height-input'),
	},

	camera: 
	{
		positionX: document.getElementById('camera-x-input'),
		positionY: document.getElementById('camera-y-input'),
		positionZ: document.getElementById('camera-z-input')
	},


	init: function()
	{
		DEBUG.timer.callback = DEBUG.onRefresh;
		DEBUG.timer.enableLooping();
		DEBUG.timer.start();
	},

	
	onRefresh: function()
	{
		if (GLOBALS.camera && GLOBALS.camera.position)
		{		
			var vec = new THREE.Vector3();
			vec.copy(GLOBALS.controls.target);
			var position = GLOBALS.camera.getWorldPosition(vec);

			options.CAMERA_POSITION_X = Math.roundToTwoDecimals(position.x);
			options.CAMERA_POSITION_Y = Math.roundToTwoDecimals(position.y);
			options.CAMERA_POSITION_Z = Math.roundToTwoDecimals(position.z);

			DEBUG.camera.positionX.value = options.CAMERA_POSITION_X;
			DEBUG.camera.positionY.value = options.CAMERA_POSITION_Y;
			DEBUG.camera.positionZ.value = options.CAMERA_POSITION_Z;
		}
		
		DEBUG.mouse.positionX.value = Math.roundToTwoDecimals(MOUSE.positionX);
		DEBUG.mouse.positionY.value = Math.roundToTwoDecimals(MOUSE.positionY);

		DEBUG.canvas.width.value = DEBUG.interface.clientWidth;
		DEBUG.canvas.height.value =  DEBUG.interface.clientHeight;
	}	
};