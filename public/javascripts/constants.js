// namespace
var constants = { };


if (typeof module !== 'undefined' && module.exports)
{
	// export for nodeJS use
	module.exports = constants;
}


var isDebugMode = true;

constants.IS_DEBUG_MODE = isDebugMode;
constants.IS_CONSOLE_ENABLED = true;

if (isDebugMode == true)
{
	constants.HOSTING_URL = 'http://localhost';
}
else
{
	//constants.HOSTING_URL = 'http://lukaprij.wwwnl1-ss11.a2hosted.com';
	constants.HOSTING_URL = 'minecraft.fri.uni-lj.si';
}

constants.NODEJS_PORT = 30003;
constants.SOCKETIO_PORT = 30004;
