var options = 
{
	//SCENE_FILEPATH: 'scenes/Castle/Scene.gltf',
	SCENE_FILEPATH: 'scenes/Textured-box/Scene.gltf',
	//SCENE_FILEPATH: 'scenes/Buggy/Scene.gltf',
	//SCENE_FILEPATH: 'scenes/MetalRoughSpheres/Scene.gltf',
	//SCENE_FILEPATH: 'scenes/boomBox/Scene.gltf',

	//SKY_CUBE_FILEPATH: 'images/skycube_lake/',
	SKY_CUBE_FILEPATH: 'images/skycube_car/',
	//SKY_CUBE_FILEPATH: 'images/skycube_black/',
	//SKY_CUBE_FILEPATH: 'images/skycube_building/',
	SKY_CUBE_IMAGES: 
	[
		'posX.png', 'negX.png',
		'posY.png', 'negY.png',
		'posZ.png', 'negZ.png'
	],

	RENDERER_TYPE: 'ray-tracing',
	
	RESOLUTION_FACTOR: 1,
	
	ANTIALIASING_FACTOR: 1,

	CANVAS_WIDTH: 1280,
	CANVAS_HEIGHT: 720,

	BLOCK_WIDTH: 25,
	BLOCK_HEIGHT: 25,
	NUM_OF_BLOCKS_IN_CHUNK: 10,

	MAX_RECURSION_DEPTH: 2,
	MAX_THREADS: 2,

	CAMERA: null,

	LIGHTS: [],

	DRAW_PROGRESS_OF_INDIVIDUAL_PIXELS: false
};


if (typeof module !== 'undefined' && module.exports)
{
	// export for nodeJS use
	module.exports = options;
}