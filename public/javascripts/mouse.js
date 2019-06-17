var MOUSE =
{
	positionX: 0,

	positionY: 0,

	init: function()
	{
		document.addEventListener('mousemove', MOUSE.onMouseMove, false);
	},

	onMouseMove: function(event)
	{
		MOUSE.positionX = event.clientX;
		MOUSE.positionY = event.clientY;
	}
};

MOUSE.init();