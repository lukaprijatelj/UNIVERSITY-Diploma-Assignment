var isDebugMode = false;

var constants = 
{
	IS_DEBUG_MODE: isDebugMode,
	IS_CONSOLE_ENABLED: true,
	
	//HOSTING_URL: isDebugMode == true ? 'http://localhost:30003' : 'http://lukaprij.wwwnl1-ss11.a2hosted.com:30003'
	HOSTING_URL: isDebugMode == true ? 'http://localhost:30003' : 'minecraft.fri.uni-lj.si:30003'
};


if (typeof module !== 'undefined' && module.exports)
{
	// export for nodeJS use
	module.exports = constants;
}