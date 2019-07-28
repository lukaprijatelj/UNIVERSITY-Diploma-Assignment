var options = 
{
	//SCENE_FILEPATH: 'scenes/Castle/Sponza.gltf',
	SCENE_FILEPATH: 'scenes/Textured-box/BoxTextured.gltf',
	//SCENE_FILEPATH: 'scenes/Buggy/Buggy.gltf',

	RESOLUTION_WIDTH: 1280,
	RESOLUTION_HEIGHT: 720,

	CANVAS_WIDTH: 0,
	CANVAS_HEIGHT: 0,

	BLOCK_WIDTH: 50,
	BLOCK_HEIGHT: 50,

	CAMERA_POSITION_X: 0,
	CAMERA_POSITION_Y: 0,
	CAMERA_POSITION_Z: 0	
};


if (typeof module !== 'undefined' && module.exports)
{
	// export for nodeJS use
	module.exports = options;
}