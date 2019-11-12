var options = { };

//options.SCENE_FILEPATH = 'scenes/Castle/Scene.gltf';
options.SCENE_FILEPATH = 'scenes/Textured-box/Scene.gltf';
//options.SCENE_FILEPATH = 'scenes/Buggy/Scene.gltf';
//options.SCENE_FILEPATH = 'scenes/MetalRoughSpheres/Scene.gltf';
//options.SCENE_FILEPATH = 'scenes/boomBox/Scene.gltf';

//options.SKY_CUBE_FILEPATH = 'images/skycube_lake/';
options.SKY_CUBE_FILEPATH = 'images/skycube_car/';
//options.SKY_CUBE_FILEPATH = 'images/skycube_black/';
//options.SKY_CUBE_FILEPATH = 'images/skycube_building/';
options.SKY_CUBE_IMAGES = 
[
	'posX.png', 'negX.png',
	'posY.png', 'negY.png',
	'posZ.png', 'negZ.png'
];

options.RENDERER_TYPE = 'path-tracing';

options.RESOLUTION_FACTOR = 1;
options.ANTIALIASING_FACTOR = 1;

options.CANVAS_WIDTH = 1280;
options.CANVAS_HEIGHT = 720;

options.BLOCK_WIDTH = 25;
options.BLOCK_HEIGHT = 25;
options.NUM_OF_BLOCKS_IN_CHUNK = 3;

options.MAX_RECURSION_DEPTH = 5;
options.MAX_THREADS = 2;

options.CAMERA = null;

options.LIGHTS = [];

// should client autoscroll to current rendering area
options.AUTO_SCROLL_TO_RENDERING_AREA = false;

// should clicking on "new client" button open client in new window or tab
options.OPEN_NEW_RENDERER_IN_WINDOW = true;

// check every 500ms if rendering-service is still running on server
options.CHECK_RENDERING_SERVICE_STATE = 500;


if (typeof module !== 'undefined' && module.exports)
{
	// export for nodeJS use
	module.exports = options;
}