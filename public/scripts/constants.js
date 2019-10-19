// namespace
var _this = this;

if (typeof module !== 'undefined' && module.exports)
{
	// export for nodeJS use
	_this = global;
}


_this.IS_DEBUG_MODE = true;

_this.IS_CONSOLE_ENABLED = true;

_this.MAX_SOCKETIO_CLIENTS = 200;

/**
 * For API calls and HTTP access.
 */
_this.NODEJS_PORT = 30003;

/**
 * Internal socket IO port for all comunications between client and server.
 */
_this.SOCKETIO_PORT = 30004;