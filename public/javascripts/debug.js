var DEBUG =
{
	mouse:
	{
		positionX: document.querySelector('#debug-info .mouse .field:nth-child(1) .value'),
		positionY: document.querySelector('#debug-info .mouse .field:nth-child(2) .value'),
	},

	camera: 
	{
		positionX: document.querySelector('#debug-info .camera .field:nth-child(1) .value'),
		positionY: document.querySelector('#debug-info .camera .field:nth-child(2) .value'),
		positionZ: document.querySelector('#debug-info .camera .field:nth-child(3) .value')
	},


	init: function()
	{
		window.setInterval(DEBUG.onRefresh, 500);		
	},

	
	onRefresh: function()
	{
		DEBUG.camera.positionX.innerHTML = Math.roundToTwoDecimals(GLOBALS.camera.position.x);
		DEBUG.camera.positionY.innerHTML = Math.roundToTwoDecimals(GLOBALS.camera.position.y);
		DEBUG.camera.positionZ.innerHTML = Math.roundToTwoDecimals(GLOBALS.camera.position.z);

		DEBUG.mouse.positionX.innerHTML = Math.roundToTwoDecimals(MOUSE.positionX);
		DEBUG.mouse.positionY.innerHTML = Math.roundToTwoDecimals(MOUSE.positionY);
	}	
};

DEBUG.init();