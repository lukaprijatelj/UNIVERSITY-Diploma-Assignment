var isDebugMode = true;

var constants = 
{
	IS_DEBUG_MODE: isDebugMode,

	CANVAS_WIDTH: 1920,
	CANVAS_HEIGHT: 1080,
	BLOCK_WIDTH: 80,
	BLOCK_HEIGHT: 80,
	
	HOSTING_URL: isDebugMode == true ? 'http://localhost:30003' : 'http://lukaprij.wwwnl1-ss11.a2hosted.com:30003'
};

module.exports = constants;