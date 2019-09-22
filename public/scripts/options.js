var options = 
{
	//SCENE_FILEPATH: 'scenes/Castle/Scene.gltf',
	SCENE_FILEPATH: 'scenes/Textured-box/Scene.gltf',
	//SCENE_FILEPATH: 'scenes/Buggy/Scene.gltf',
	//SCENE_FILEPATH: 'scenes/MetalRoughSpheres/Scene.gltf',

	RESOLUTION_FACTOR: 1,

	CANVAS_WIDTH: 1280,
	CANVAS_HEIGHT: 720,

	BLOCK_WIDTH: 30,
	BLOCK_HEIGHT: 30,
	NUM_OF_BLOCKS_IN_CHUNK: 5,

	CAMERA_POSITION_X: 0.81,
	CAMERA_POSITION_Y: -0.1,
	CAMERA_POSITION_Z: -2.47,

	CAMERA_FOV: 75,
	CAMERA_ASPECT: 2,  // the canvas default
	CAMERA_NEAR: 0.1,
	CAMERA_FAR: 10000
};


if (typeof module !== 'undefined' && module.exports)
{
	// export for nodeJS use
	module.exports = options;
}