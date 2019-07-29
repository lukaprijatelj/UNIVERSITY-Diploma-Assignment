var isDebugMode = true;

// namespace
var constants = { };


if (typeof module !== 'undefined' && module.exports)
{
	// export for nodeJS use
	module.exports = constants;
}


constants.IS_DEBUG_MODE = isDebugMode;
constants.IS_CONSOLE_ENABLED = true;

constants.NODEJS_PORT = 30003;
constants.SOCKETIO_PORT = 30004;

if (isDebugMode == true)
{
	constants.HOSTING_URL = 'http://localhost:' + constants.NODEJS_PORT;
}
else
{
	//constants.HOSTING_URL = 'http://lukaprij.wwwnl1-ss11.a2hosted.com:' + constants.NODEJS_PORT;
	constants.HOSTING_URL = 'minecraft.fri.uni-lj.si:' + constants.NODEJS_PORT;
}