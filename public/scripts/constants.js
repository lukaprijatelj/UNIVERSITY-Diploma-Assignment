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

_this.LIST_OF_BACKGROUND_IMAGES =  
[
	'images/skycube_black/',
	'images/skycube_white/',
	'images/skycube_car/',
	'images/skycube_lake/',
];

_this.RENDERED_IMAGE_FILEPATH = 'results/rendered-image.png';
_this.RENDERING_INFO_FILEPATH = 'results/rendering-info.html';