var DEBUG =
{
	mouse:
	{
		positionX: HTML('#debug-info .mouse .field:nth-child(1) .value'),
		positionY: HTML('#debug-info .mouse .field:nth-child(2) .value'),
	},

	camera: 
	{
		positionX: HTML('#debug-info .camera .field:nth-child(1) .value'),
		positionY: HTML('#debug-info .camera .field:nth-child(2) .value'),
		positionZ: HTML('#debug-info .camera .field:nth-child(3) .value')
	},


	init: function()
	{
		window.setInterval(DEBUG.onRefresh, 500);		
	},

	
	onRefresh: function()
	{
		DEBUG.camera.positionX.setHtml(Math.roundToTwoDecimals(MAIN.camera.position.x));
		DEBUG.camera.positionY.setHtml(Math.roundToTwoDecimals(MAIN.camera.position.y));
		DEBUG.camera.positionZ.setHtml(Math.roundToTwoDecimals(MAIN.camera.position.z));

		DEBUG.mouse.positionX.setHtml(Math.roundToTwoDecimals(MOUSE.positionX));
		DEBUG.mouse.positionY.setHtml(Math.roundToTwoDecimals(MOUSE.positionY));
	}	
};

DEBUG.init();