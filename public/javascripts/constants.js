// namespace
var constants = { };


if (typeof module !== 'undefined' && module.exports)
{
	// export for nodeJS use
	module.exports = constants;
}


constants.IS_DEBUG_MODE = true;
constants.IS_CONSOLE_ENABLED = true;

constants.NODEJS_PORT = 30003;
constants.SOCKETIO_PORT = 30004;
