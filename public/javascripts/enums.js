var enums = {};

enums.rendererType = new Enum(
{
	WEB_GL_RENDERER: 'web-gl-renderer',

	RAY_TRACING: 'ray-tracing',

	PATH_TRACING: 'path-tracing'
});

enums.layoutType = new Enum(
{
	NONE: 'none',
	
	GRID: 'grid',

	CANVAS: 'canvas'
});