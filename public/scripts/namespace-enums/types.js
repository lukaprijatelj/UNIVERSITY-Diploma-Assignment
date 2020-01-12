var _this = this;
var isNodeJS = (typeof module !== 'undefined' && module.exports) ? true : false;

if (isNodeJS == true) 
{
    _this = global;
}

if (typeof _this.namespace == 'undefined')
{
    _this.namespace = new Object();
}

var namespace = _this.namespace;

if (typeof namespace.enums == 'undefined')
{
    namespace.enums = new Object();
}

namespace.enums.rendererType = new Enum(
{
	RAY_TRACING: 'ray-tracing',

	PATH_TRACING: 'path-tracing'
});

namespace.enums.layoutType = new Enum(
{
	NONE: 'none',
	
	GRID: 'grid',

	CANVAS: 'canvas'
});

namespace.enums.apiClientType = new Enum(
{
	RENDERER: 'renderer',

	ADMIN: 'admin'
});

namespace.enums.renderingServiceState = new Enum(
{
	IDLE: 'idle',

	RUNNING: 'running',

	PAUSED: 'pause',

	FINISHED: 'finished'
});