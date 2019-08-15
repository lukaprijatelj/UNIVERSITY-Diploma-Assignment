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

constants.NODEJS_PORT = 30003;
constants.SOCKETIO_PORT = 30004;
