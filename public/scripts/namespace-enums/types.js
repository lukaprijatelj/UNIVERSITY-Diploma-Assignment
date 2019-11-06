var enums = new Object();

enums.rendererType = new Enum(
{
	RAY_TRACING: 'ray-tracing',

	PATH_TRACING: 'path-tracing'
});

enums.layoutType = new Enum(
{
	NONE: 'none',
	
	GRID: 'grid',

	CANVAS: 'canvas'
});

enums.apiClientType = new Enum(
{
	RENDERER: 'renderer',

	ADMIN: 'admin'
});