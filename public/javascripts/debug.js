var DEBUG =
{
	mouse:
	{
		positionX: document.getElementById('mouse-x-input'),
		positionY: document.getElementById('mouse-y-input'),
	},

	camera: 
	{
		positionX: document.getElementById('camera-x-input'),
		positionY: document.getElementById('camera-y-input'),
		positionZ: document.getElementById('camera-z-input')
	},


	init: function()
	{
		window.setInterval(DEBUG.onRefresh, 500);		
	},

	
	onRefresh: function()
	{
		DEBUG.camera.positionX.value = Math.roundToTwoDecimals(GLOBALS.camera.position.x);
		DEBUG.camera.positionY.value = Math.roundToTwoDecimals(GLOBALS.camera.position.y);
		DEBUG.camera.positionZ.value = Math.roundToTwoDecimals(GLOBALS.camera.position.z);

		DEBUG.mouse.positionX.value = Math.roundToTwoDecimals(MOUSE.positionX);
		DEBUG.mouse.positionY.value = Math.roundToTwoDecimals(MOUSE.positionY);
	}	
};