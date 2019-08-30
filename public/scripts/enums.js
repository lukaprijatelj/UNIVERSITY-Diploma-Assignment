var enums = new Object();

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

enums.apiClientType = new Enum(
{
	RENDERING_OUTPUT: 'rendering-output',
	
	RENDERER: 'renderer',

	ADMIN: 'admin'
});