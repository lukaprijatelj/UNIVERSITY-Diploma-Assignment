var options = 
{
	//SCENE_FILEPATH: 'scenes/Castle/Scene.gltf',
	//SCENE_FILEPATH: 'scenes/Textured-box/Scene.gltf',
	//SCENE_FILEPATH: 'scenes/Buggy/Scene.gltf',
	//SCENE_FILEPATH: 'scenes/MetalRoughSpheres/Scene.gltf',
	SCENE_FILEPATH: 'scenes/boomBox/Scene.gltf',

	//SKY_CUBE_FILEPATH: 'images/sor_lake1/',
	//SKY_CUBE_FILEPATH: 'images/skycube_2/',
	SKY_CUBE_FILEPATH: 'images/black/',


	RESOLUTION_FACTOR: 1,
	CANVAS_WIDTH: 1280,
	CANVAS_HEIGHT: 720,
	BLOCK_WIDTH: 25,
	BLOCK_HEIGHT: 25,
	NUM_OF_BLOCKS_IN_CHUNK: 10,

	CAMERA: null,

	LIGHTS: []
};


if (typeof module !== 'undefined' && module.exports)
{
	// export for nodeJS use
	module.exports = options;
}