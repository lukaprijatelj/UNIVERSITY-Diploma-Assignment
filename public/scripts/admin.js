var WebApplication = new namespace.core.WebApplication('UNIVERSITY-Diploma-Assignment');
var options = null;

var AdminPage = new namespace.core.WebPage('Admin');
var globals = new namespace.core.Globals();

/**
 * Grid layout of cells that are rendered or are waiting for rendering.
 */
globals.cells = new List();

/**
 * ThreeJS scene.
 */
globals.scene = null;

/**
 * GLTF loader.
 */
globals.loader = null;

/**
 * Camera controls affected by mouse movement.
 */
globals.controls = null;

/**
 * ThreeJS camera in the scene.
 */
globals.camera = null;

/**
 * Additional scene lights.
 */
globals.lights = [];

/**
 * Canvas for editor aka preview.
 */
globals.editorCanvas = null;

/**
 * Is rendering service running.
 */
globals.isRendering = false;

AdminPage.loadingText = null;
AdminPage.loadingBar = null;
AdminPage.loadingCounter = null;

/**
 * Initializes page.
 */
AdminPage.init = function()
{	
	globals.editorCanvas = new EditorCanvas();
	globals.editorCanvas.init();

	let loadingLayer = document.querySelector('layer#loading');
	let wrapper = loadingLayer.querySelector('.centered-text wrapper_');

	let loadingTextElement = new namespace.html.Div();
	AdminPage.loadingText = new namespace.html.ObservableString(loadingTextElement);
	wrapper.appendChild(loadingTextElement);

	wrapper.appendChild('<divider-x-small></divider-x-small>');

	AdminPage.loadingBar = new namespace.html.LoadingBar();
	AdminPage.loadingCounter = new namespace.core.LoadingCounter(100, AdminPage.loadingBar);
	wrapper.appendChild(AdminPage.loadingBar);
	
	DEBUG.init();

	API.init(enums.apiClientType.ADMIN);	

	API.connect(AdminPage._onServerConnected, AdminPage._onServerDisconnect);
};

/**
 * Opens scene and loads cameras and lights.
 */
AdminPage.openScene = async function()
{
	try
	{
		/**
		 * gltf.animations; // Array<THREE.AnimationClip>
		 * gltf.scene; // THREE.Scene
		 * gltf.scenes; // Array<THREE.Scene>
		 * gltf.cameras; // Array<THREE.Camera>
		 * gltf.asset; // Object
		 */
		var gltf = await AdminPage.startLoadingGltfModel();

		await AdminPage._initScene();
		globals.scene.add(gltf.scene);

		await AdminPage._initCamera(gltf.cameras);

		await AdminPage._initLights();
		
		await AdminPage._initRenderer();
	}
	catch (err)
	{
		console.error(err.message);
	}	
	
	AdminPage._initCameraControls();
				
	AdminPage.onRenderFrame();
};

/**
 * On server-client connection.
 * @private
 */
AdminPage._onServerConnected = async function(socket, data)
{
	console.log('[Main] Connected to server!');

	API.isConnected = true;

	API.listen('clients/updated', AdminPage._onClientsUpdated);

	let ddata = await API.request('admin/isRenderingServiceRunning');
	AdminPage._onCheckRendering(ddata);

	AdminPage.onLoaded();	
};

/**
 * Client has disconnected from server.
 */
AdminPage._onServerDisconnect = function()
{
	API.isConnected = false;
};

/**
 * Check is server rendering service is running.
 */
AdminPage._onCheckRendering = async function(data)
{
	globals.isRendering = data.isRenderingServiceRunning;

	options = data.options;

	globals.editorCanvas.resize();

	AdminPage.openScene();

	AdminPage._updateRenderingState();
};

/**
 * Starts loading GLTF model.
 */
AdminPage.startLoadingGltfModel = function()
{
	var onSuccess = (resolve, reject) =>
	{
		console.log('[AdminPage] Requesting GLTF model');	

		let loadingLayer = document.querySelector('layer#loading');
		loadingLayer.show();

		AdminPage.loadingText.setValue('Loading GLTF model ...');
		AdminPage.loadingCounter.setValue(0);

		var loader = new GltfLoader();
		loader.path = options.SCENE_FILEPATH;
		loader.onProgress = function(xhr)
		{
			// occurs when one of the files is done loading
			var percentage = xhr.loaded / xhr.total * 100;
		
			console.log('[AdminPage] GLTF model is ' + percentage + '% loaded');	

			AdminPage.loadingCounter.setValue(percentage);
		};
		loader.onSuccess = (gltf) =>
		{
			console.log('[glTF loader] Scene finished loading');
		
			loadingLayer.hide();

			resolve(gltf);
		};
		loader.start();	
	};
	return new Promise(onSuccess);
};

/**
 * Initializes scene.
 */
AdminPage._initScene = async function()
{
	var asyncCallback = async function(resolve, reject)
    {
		let loadingLayer = document.querySelector('layer#loading');
		loadingLayer.show();

		AdminPage.loadingText.setValue('Loading scene ...');
		AdminPage.loadingCounter.setValue(0);

		let onProgress = function(xhr)
		{
			var percentage = xhr.loaded / xhr.total * 100;

			console.log('[AdminPage] Scene is ' + percentage + '% loaded');	

			AdminPage.loadingCounter.setValue(percentage);
		};
		let onLoad = function()
		{
			loadingLayer.hide();
			resolve();
		};

        globals.scene = new THREE.Scene();

		if (options.SKY_CUBE_FILEPATH)
		{
			var loader = new THREE.CubeTextureLoader();
			loader.setPath(options.SKY_CUBE_FILEPATH);

			globals.scene.background = loader.load(options.SKY_CUBE_IMAGES, onLoad, onProgress, reject);
		}	
		else
		{
			onProgress(100);
			onLoad();
		}		
    };
	return new Promise(asyncCallback);
};

/**
 * Sets background for scene.
 */
AdminPage._setBackground = async function()
{

};

/**
 * Intializes camera in the scene.
 */
AdminPage._initCamera = async function(cameras)
{
	var asyncCallback = function(resolve, reject)
    {
		console.log('[AdminPage] Initializing camera');

		let loadingLayer = document.querySelector('layer#loading');
		loadingLayer.show();

		AdminPage.loadingText.setValue('Loading camera ...');
		AdminPage.loadingCounter.setValue(0);

		let CAMERA_FOV = 75;
		let CAMERA_ASPECT = 2;  // the canvas default
		let CAMERA_NEAR = 0.001;
		let CAMERA_FAR = 10000;

		globals.camera = new THREE.PerspectiveCamera(CAMERA_FOV, CAMERA_ASPECT, CAMERA_NEAR, CAMERA_FAR);

		if (cameras && cameras.length)
		{
			// model has camera included, so we will use it's position and rotation

			let existingCamera = cameras[0];
			globals.camera.position.x = existingCamera.parent.position.x;
			globals.camera.position.y = existingCamera.parent.position.y;
			globals.camera.position.z = existingCamera.parent.position.z;

			globals.camera.rotation.x = existingCamera.parent.rotation.x;
			globals.camera.rotation.y = existingCamera.parent.rotation.y;
			globals.camera.rotation.z = existingCamera.parent.rotation.z;
		}
		else
		{
			// set default position and rotation
			globals.camera.position.x = -1.55877021541765;
			globals.camera.position.y = 0.6214917314103046;
			globals.camera.position.z = 0.9543815583821418;
		}	

		AdminPage.loadingCounter.setValue(100);
		loadingLayer.hide();

		resolve();
	};
	return new Promise(asyncCallback);
};

/**
 * Initializes camera mouse controls, so that changing view is easier.
 */
AdminPage._initCameraControls = function()
{
	console.log('[AdminPage] Initializing camera controls');

	globals.controls = new THREE.OrbitControls(globals.camera, globals.renderer.domElement);
	globals.controls.screenSpacePanning = true;
};

/**
 * Initializes lights.
 */
AdminPage._initLights = async function()
{
	var asyncCallback = function(resolve, reject)
    {
		console.log('[AdminPage] Initializing lights');

		let loadingLayer = document.querySelector('layer#loading');
		loadingLayer.show();

		AdminPage.loadingText.setValue('Loading lights ...');
		AdminPage.loadingCounter.setValue(0);

		var light = new THREE.AmbientLight(0x404040, 3);
		globals.scene.add(light);
		globals.lights.push(light);

		/*var intensity = 1;

		var light = new THREE.PointLight(0xffaa55, intensity);
		light.position.set( - 200, 100, 100 );
		globals.scene.add( light );

		var light = new THREE.PointLight(0x55aaff, intensity);
		light.position.set( 200, -100, 100 );
		globals.scene.add( light );

		var light = new THREE.PointLight(0xffffff, intensity);
		light.position.set( 0, 0, -300 );
		globals.scene.add( light );*/

		AdminPage.loadingCounter.setValue(100);
		loadingLayer.hide();

		resolve();
	};
	return new Promise(asyncCallback);
};

/**
 * Initializes renderer.
 */
AdminPage._initRenderer = async function()
{
	var asyncCallback = function(resolve, reject)
    {
		console.log('[AdminPage] Initialize editor renderer');

		let loadingLayer = document.querySelector('layer#loading');
		loadingLayer.show();

		AdminPage.loadingText.setValue('Loading renderer ...');
		AdminPage.loadingCounter.setValue(0);
	
		var canvas = document.getElementById('editor-canvas');
		var options = 
		{ 
			canvas: canvas,
			antialias: true 
		};
		globals.renderer = new THREE.WebGLRenderer(options);
		globals.renderer.setSize(options.CANVAS_WIDTH, options.CANVAS_HEIGHT);

		globals.editorCanvas.resize();

		AdminPage.loadingCounter.setValue(100);
		loadingLayer.hide();

		resolve();
	};
	return new Promise(asyncCallback);
};

/**
 * Main rendering loop.
 */
AdminPage.onRenderFrame = function()
{
	// will start loop for this function
	requestAnimationFrame(AdminPage.onRenderFrame);	

	// render current frame
	globals.renderer.render(globals.scene, globals.camera);
		
	// update camera by reading control changes
	globals.controls.update();
};

/**
 * Clears scene.
 */
AdminPage.clearScene = function()
{
	let scene = globals.scene;

	while(scene.children.length > 0)
	{ 
		scene.remove(scene.children[0]); 
	}
};

/**
 * Server has notified us that clients were updated.
 */
AdminPage._onClientsUpdated = function(data)
{
	var clients = data;
	var renderingClientsCount = clients.filter(item => item.isAdmin == false).length;

	var clientsConnectedInput = document.querySelector('#num-clients-connected .value');
	clientsConnectedInput.innerHTML = renderingClientsCount;
};

/**
 * Updates buttons and popups when rendering state is switched.
 */
AdminPage._updateRenderingState = function()
{
	var startRenderingButtonV = document.getElementById('render-button');

	if (globals.isRendering == true)
	{
		var interfaceV = document.querySelector('interface');
		interfaceV.addClass('rendering');

		var canvasV = document.getElementById('editor-canvas');
		canvasV.disable();

		let sceneButton = document.getElementById('scene-button');
		sceneButton.disable();

		let optionsButton = document.getElementById('options-button');
		optionsButton.disable();

		//let outputButton = document.getElementById('output-button');
		//outputButton.show();

		let newRendererButton = document.getElementById('new-renderer-button');
		newRendererButton.show();
			
		startRenderingButtonV.addClass('selected');
		startRenderingButtonV.innerHTML = 'DISABLE RENDERING';

		startRenderingButtonV.enable();
	}
	else
	{
		var interfaceV = document.querySelector('interface');
		interfaceV.removeClass('rendering');

		var canvasV = document.getElementById('editor-canvas');
		canvasV.enable();

		let sceneButton = document.getElementById('scene-button');
		sceneButton.enable();

		let optionsButton = document.getElementById('options-button');
		optionsButton.enable();

		//let outputButton = document.getElementById('output-button');
		//outputButton.hide();

		let newRendererButton = document.getElementById('new-renderer-button');
		newRendererButton.hide();

		startRenderingButtonV.removeClass('selected');
		startRenderingButtonV.innerHTML = 'ENABLE RENDERING';

		startRenderingButtonV.enable();
	}
};

/**
 * Initial data is loaded.
 * Remove skeleton screens by removing 'loading' class from elements.
 */
AdminPage.onLoaded = function()
{
	// -----------------------------
	// remove .loading flag
	// -----------------------------

	document.querySelector('interface').removeClass('loading');
};

/**
 * Scene button od dropdown was clicked.
*/
AdminPage._onSceneButtonClick = async function(button)
{
	let ajaxCall = new namespace.core.Ajax('api/listScenes');
	let xhrCall = await ajaxCall.send();
	var scenes = JSON.parse(xhrCall.responseText);	

	let wrapper = new namespace.html.Wrapper();	

	for (let i=0; i<scenes.length; i++)
	{
		let div = new namespace.html.Div();
		div.addClass('entry');
		div.setAttribute('onclick', 'AdminPage.onPreloadedSceneClick(this)');

		let divText = scenes[i] + '/' + 'Scene.gltf';
		div.appendChild(divText);
		wrapper.appendChild(div);
	}

	let uploadDiv = new namespace.html.Div();
	uploadDiv.id = 'upload-button';
	uploadDiv.addClass('entry');
	uploadDiv.setAttribute('onclick', 'AdminPage.onUploadSceneClick()');
	uploadDiv.appendChild('UPLOAD SCENE');
	wrapper.appendChild(uploadDiv);

	let dropdown = new namespace.html.Dropdown();
	dropdown.setAttribute('id', 'scene-dropdown');
	dropdown.appendChild(wrapper);

	let anchor = new namespace.html.Anchor(dropdown);
	anchor.setTarget(button);

	let top = button.getOuterHeight();
	anchor.setCenter(top, 0);

	let curtain = new namespace.html.Curtain();
	curtain.onClick(AdminPage.hideLastDropdown);
	curtain.show();
	
	let layer = document.querySelector('layer#dropdowns');
	layer.appendChild(curtain);
	layer.appendChild(dropdown);
	layer.show();
};

AdminPage._onNewRendererClick = function()
{
	/*var a = document.createElement("a");    
	a.href = window.location.origin + '/client';    
	a.setAttribute('target', '_blank');
	var evt = document.createEvent("MouseEvents");   
	evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, true, false, false, false, 0, null);    
	a.dispatchEvent(evt);*/

	let width = (options.CANVAS_WIDTH * options.RESOLUTION_FACTOR);
	let height = (options.CANVAS_HEIGHT * options.RESOLUTION_FACTOR);

	window.open("/client", "", "width=" + width + ",height=" + height);
};

AdminPage._onOptionsButtonClick = async function(button)
{
	// -----------------------------
	// calculate position of the dropdown
	// -----------------------------
	
	let dropdown = new namespace.html.Dropdown();
	dropdown.setAttribute('id', 'options-dropdown');
	
	let wrapper = new namespace.html.Wrapper();
	dropdown.appendChild(wrapper);


	// -----------------------------
	// camera options
	// -----------------------------

	let cameraSection = new namespace.html.Section();
	wrapper.appendChild(cameraSection);

	let cameraLabel = new namespace.html.Label();
	cameraLabel.innerHTML = 'CAMERA POSITIONS (x, y, z)';
	cameraSection.appendChild(cameraLabel);

	cameraSection.appendChild('<divider-x-small></divider-x-small>');

	let cameraFlex = new namespace.html.Flex();
	cameraSection.appendChild(cameraFlex);

	let cameraXInput = new namespace.html.NumberInput();
	cameraXInput.id = 'camera-x-input';
	cameraXInput.value = DEBUG.CAMERA_POSITION_X;
	cameraXInput.disable();
	cameraFlex.appendChild(cameraXInput);

	cameraFlex.appendChild('<divider-y-small></divider-y-small>');

	let cameraYInput = new namespace.html.NumberInput();
	cameraYInput.id = 'camera-y-input';
	cameraYInput.value = DEBUG.CAMERA_POSITION_Y;
	cameraYInput.disable();
	cameraFlex.appendChild(cameraYInput);

	cameraFlex.appendChild('<divider-y-small></divider-y-small>');

	let cameraZInput = new namespace.html.NumberInput();
	cameraZInput.id = 'camera-z-input';
	cameraZInput.value = DEBUG.CAMERA_POSITION_Z;
	cameraZInput.disable();
	cameraFlex.appendChild(cameraZInput);
	
	wrapper.appendChild('<divider-x-small></divider-x-small>');
	wrapper.appendChild('<divider-x-small></divider-x-small>');


	// -----------------------------
	// canvas options
	// -----------------------------

	let canvasSection = new namespace.html.Section();
	wrapper.appendChild(canvasSection);

	let canvasLabel = new namespace.html.Label();
	canvasLabel.innerHTML = 'CANVAS (width, height)';
	canvasSection.appendChild(canvasLabel);

	canvasSection.appendChild('<divider-x-small></divider-x-small>');

	let canvasFlex = new namespace.html.Flex();
	canvasSection.appendChild(canvasFlex);

	let canvasWidthInput = new namespace.html.NumberInput();
	canvasWidthInput.id = 'canvas-width-input';
	canvasWidthInput.value = options.CANVAS_WIDTH;
	canvasWidthInput.onchange = () =>
	{
		options.CANVAS_WIDTH = Number(canvasWidthInput.value);
	};
	canvasFlex.appendChild(canvasWidthInput);

	canvasFlex.appendChild('<divider-y-small></divider-y-small>');

	let canvasHeightInput = new namespace.html.NumberInput();
	canvasHeightInput.id = 'canvas-height-input';
	canvasHeightInput.value = options.CANVAS_HEIGHT;
	canvasHeightInput.onchange = () =>
	{
		options.CANVAS_HEIGHT = Number(canvasHeightInput.value);
	};
	canvasFlex.appendChild(canvasHeightInput);

	wrapper.appendChild('<divider-x-small></divider-x-small>');


	// -----------------------------
	// resolution options
	// -----------------------------

	let resolutionSection = new namespace.html.Section();
	wrapper.appendChild(resolutionSection);

	let resolutionLabel = new namespace.html.Label();
	resolutionLabel.innerHTML = 'RESOLUTION (factor)';
	resolutionSection.appendChild(resolutionLabel);

	resolutionSection.appendChild('<divider-x-small></divider-x-small>');

	let resolutionInput = new namespace.html.NumberInput();
	resolutionInput.id = 'resolution-factor-input';
	resolutionInput.value = options.RESOLUTION_FACTOR;
	resolutionInput.onchange = () =>
	{
		options.RESOLUTION_FACTOR = Number(resolutionInput.value);
	};
	resolutionSection.appendChild(resolutionInput);

	wrapper.appendChild('<divider-x-small></divider-x-small>');


	// -----------------------------
	// antialiasing options
	// -----------------------------

	let antialiasingSection = new namespace.html.Section();
	wrapper.appendChild(antialiasingSection);

	let antialiasingLabel = new namespace.html.Label();
	antialiasingLabel.innerHTML = 'ANTIALIASING (factor)';
	antialiasingSection.appendChild(antialiasingLabel);

	antialiasingSection.appendChild('<divider-x-small></divider-x-small>');

	let antialiasingInput = new namespace.html.NumberInput();
	antialiasingInput.id = 'antialiasing-factor-input';
	antialiasingInput.value = options.ANTIALIASING_FACTOR;
	antialiasingInput.onchange = () =>
	{
		options.ANTIALIASING_FACTOR = Number(antialiasingInput.value);
	};
	antialiasingSection.appendChild(antialiasingInput);

	wrapper.appendChild('<divider-x-small></divider-x-small>');


	// -----------------------------
	// threads options
	// -----------------------------

	let threadsSection = new namespace.html.Section();
	wrapper.appendChild(threadsSection);

	let threadsLabel = new namespace.html.Label();
	threadsLabel.innerHTML = 'THREADS (max number)';
	threadsSection.appendChild(threadsLabel);

	threadsSection.appendChild('<divider-x-small></divider-x-small>');

	let threadsInput = new namespace.html.NumberInput();
	threadsInput.id = 'threads-max-number-input';
	threadsInput.value = options.MAX_THREADS;
	threadsInput.onchange = () =>
	{
		options.MAX_THREADS = Number(threadsInput.value);
	};
	threadsSection.appendChild(threadsInput);

	wrapper.appendChild('<divider-x-small></divider-x-small>');


	// -----------------------------
	// block options
	// -----------------------------

	let blockSection = new namespace.html.Section();
	wrapper.appendChild(blockSection);

	let blockLabel = new namespace.html.Label();
	blockLabel.innerHTML = 'BLOCK SIZE (width, height)';
	blockSection.appendChild(blockLabel);

	blockSection.appendChild('<divider-x-small></divider-x-small>');

	let blockFlex = new namespace.html.Flex();
	blockSection.appendChild(blockFlex);

	let blockWidthInput = new namespace.html.NumberInput();
	blockWidthInput.id = 'block-width-input';
	blockWidthInput.value = options.BLOCK_WIDTH;
	blockWidthInput.onchange = () =>
	{
		options.BLOCK_WIDTH = Number(blockWidthInput.value);
	};
	blockFlex.appendChild(blockWidthInput);

	blockFlex.appendChild('<divider-y-small></divider-y-small>');

	let blockHeightInput = new namespace.html.NumberInput();
	blockHeightInput.id = 'block-height-input';
	blockHeightInput.value = options.BLOCK_HEIGHT;
	blockHeightInput.onchange = () =>
	{
		options.BLOCK_HEIGHT = Number(blockHeightInput.value);
	};
	blockFlex.appendChild(blockHeightInput);

	wrapper.appendChild('<divider-x-small></divider-x-small>');


	// -----------------------------
	// blocks options
	// -----------------------------

	let numBlocksSection = new namespace.html.Section();
	wrapper.appendChild(numBlocksSection);

	let numBlockLabel = new namespace.html.Label();
	numBlockLabel.innerHTML = 'NUMBER OF BLOCKS';
	numBlocksSection.appendChild(numBlockLabel);

	numBlocksSection.appendChild('<divider-x-small></divider-x-small>');

	let numBlocksInput = new namespace.html.NumberInput();
	numBlocksInput.id = 'antialiasing-factor-input';
	numBlocksInput.value = options.NUM_OF_BLOCKS_IN_CHUNK;
	numBlocksInput.onchange = () =>
	{
		options.NUM_OF_BLOCKS_IN_CHUNK = Number(numBlocksInput.value);
	};
	numBlocksSection.appendChild(numBlocksInput);	


	// -----------------------------
	// set position of the dropdown
	// -----------------------------

	let anchor = new namespace.html.Anchor(dropdown);
	anchor.setTarget(button);

	let top = Unit.add(button.getOuterHeight(), '1px');
	anchor.setCenter(top, '0px');


	// -----------------------------
	// show dropdown
	// -----------------------------

	let curtain = new namespace.html.Curtain();
	curtain.onClick(AdminPage.hideLastDropdown);
	curtain.show();

	let layer = document.querySelector('layer#dropdowns');
	layer.appendChild(curtain);
	layer.appendChild(dropdown);
	layer.show();
};

/**
 * User choose different scene.
 */
AdminPage.onPreloadedSceneClick = async function(element)
{
	options.SCENE_FILEPATH = 'scenes/' + element.innerHTML;

	AdminPage.openScene();

	AdminPage.onDropdownsCurtainClick();
};

/**
 * User picked file/folder with 3D scene.
 */
AdminPage.onFileUploadChange = async function(event)
{
	AdminPage.onDropdownsCurtainClick();

	let loadingLayer = document.querySelector('layer#loading');
	loadingLayer.querySelector('.centered-text wrapper_').innerHTML = 'Uploading...';
	loadingLayer.show();

	var form = document.getElementById("scene-upload-form");
	var formData = new FormData(form);

	var ajaxCall = new namespace.core.Ajax('/api/uploadScene');	
	ajaxCall.skipJsonStringify = true;	
	await ajaxCall.send(formData);

	AdminPage.onFileUploadDone();
};

AdminPage.onFileUploadDone = function()
{
	AdminPage.resetFilesInput();

	let loadingLayer = document.querySelector('layer#loading');
	loadingLayer.hide();
};

AdminPage.resetFilesInput = function()
{
	var input = document.getElementById('upload-file-input');

	// reset input files so that onChange event will properly work when reselecting same files
	input.value = String();
};

AdminPage.onUploadSceneClick = function()
{
	document.getElementById('upload-file-input').click();
};

AdminPage.onDropdownsCurtainClick = function(event)
{
	let mouse = new namespace.core.Mouse(event);
	let list = document.querySelector('layer#dropdowns');
	
	if (event && mouse.isTarget(list) == false)
	{
		return;
	}

	list.empty();
};

/**
 * Hides popups layer.
 */
AdminPage.hideLastDropdown = function()
{
	let popup = document.querySelector('layer#dropdowns > *:last-child');

	// removes curtain
	popup.previousSibling.remove();
	popup.remove();
};

/**
 * Sends request to recalculate grid layout.
 * @private
 */
AdminPage._onStartStopRenderingClick = async function()
{
	var startRenderingButtonV = document.getElementById('render-button');
	startRenderingButtonV.disable();

	var data = new Object();

	if (startRenderingButtonV.hasClass('selected'))
	{
		await API.request('rendering/stop', data);

		globals.isRendering = false;
	}
	else
	{
		options.CAMERA = globals.camera.toJSON();
	
		for (let i=0; i<globals.lights.length; i++)
		{
			options.LIGHTS = [];
			options.LIGHTS.push(globals.lights[i].toJSON());
		}
		
		data.options = options;

		await API.request('rendering/start', data);

		globals.isRendering = true;		
	}

	AdminPage._updateRenderingState();
};

AdminPage._onOpenOutputClick = function()
{
	let width = (options.CANVAS_WIDTH * options.RESOLUTION_FACTOR);
	let height = (options.CANVAS_HEIGHT * options.RESOLUTION_FACTOR);

	// open rendering output window
	window.open("/renderingOutput", "", "width=" + width + ",height=" + height);
};