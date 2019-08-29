var options = 
{
	//SCENE_FILEPATH: 'scenes/Castle/Sponza.gltf',
	SCENE_FILEPATH: 'scenes/Textured-box/Scene.gltf',
	//SCENE_FILEPATH: 'scenes/Buggy/Buggy.gltf',

	RESOLUTION_WIDTH: 1280,
	RESOLUTION_HEIGHT: 720,

	CANVAS_WIDTH: 0,
	CANVAS_HEIGHT: 0,

	BLOCK_WIDTH: 30,
	BLOCK_HEIGHT: 30,
	NUM_OF_BLOCKS_IN_CHUNK: 5,

	CAMERA_POSITION_X: 0.81,
	CAMERA_POSITION_Y: -0.1,
	CAMERA_POSITION_Z: -2.47	
};


if (typeof module !== 'undefined' && module.exports)
{
	// export for nodeJS use
	module.exports = options;
}