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


/**
 * Initializes page.
 */
AdminPage.init = function()
{	
	API.init(enums.apiClientType.ADMIN);	

	API.connect(AdminPage._onServerConnected, AdminPage._onServerDisconnect);

	globals.editorCanvas = new EditorCanvas();
	globals.editorCanvas.init();
	
	DEBUG.init();
};

/**
 * Opens scene and loads cameras and lights.
 */
AdminPage.openScene = async function()
{
	let loadingLayer = document.querySelector('layer#loading');
	loadingLayer.querySelector('.centered-text wrapper_').innerHTML = 'Loading...';
	loadingLayer.show();

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

	AdminPage._initCamera(gltf.cameras);
	AdminPage._initLights();
	
	AdminPage._initRenderer();
	AdminPage._initCameraControls();	

	loadingLayer.hide();
				
	AdminPage.onRenderFrame();
};

/**
 * On server-client connection.
 * @private
 */
AdminPage._onServerConnected = function(socket, data)
{
	console.log('[Main] Connected to server!');

	API.isConnected = true;

	API.listen('clients/updated', AdminPage._onClientsUpdated);

	API.request('rendering/checkAdmin', AdminPage._onCheckRendering);	

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
	globals.editorCanvas.resizeCanvas();

	AdminPage.openScene();

	AdminPage._updateRenderingState();
};

/**
 * Starts loading GLTF model.
 */
AdminPage.startLoadingGltfModel = function()
{
	console.log('[AdminPage] Requesting GLTF model');	

	var onSuccess = (resolve, reject) =>
	{
		var loader = new GltfLoader();
		loader.path = options.SCENE_FILEPATH;
		loader.onSuccess = (gltf) =>
		{
			console.log('[glTF loader] Scene finished loading');
		
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
        globals.scene = new THREE.Scene();

		if (options.SKY_CUBE_FILEPATH)
		{
			var skyImages = 
			[
				'posX.png',
				'negX.png',
				'posY.png',
				'negY.png',
				'posZ.png',
				'negZ.png'
			];
				
			globals.scene.background = new THREE.CubeTextureLoader().setPath(options.SKY_CUBE_FILEPATH).load(skyImages, resolve);
		}	
		else
		{
			resolve();
		}		
    };
	return new Promise(asyncCallback);
};

/**
 * Intializes camera in the scene.
 */
AdminPage._initCamera = function(cameras)
{
	console.log('[AdminPage] Initializing camera');

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
AdminPage._initLights = function()
{
	console.log('[AdminPage] Initializing lights');

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
};

/**
 * Initializes renderer.
 */
AdminPage._initRenderer = function()
{
	console.log('[AdminPage] Initialize editor renderer');

	var canvas = document.getElementById('editor-canvas');

	var options = 
	{ 
		canvas: canvas,
		antialias: true 
	};
	globals.renderer = new THREE.WebGLRenderer(options);
	globals.renderer.setSize(options.CANVAS_WIDTH, options.CANVAS_HEIGHT);

	globals.editorCanvas.resizeCanvas();
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
		
	if (globals.controls)
	{
		// update camera
		globals.controls.update();
	}
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
	var renderingClientsCount = clients.filter(item => item.admin == false).length;

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

	let top = Unit.add(new Unit('1px'), button.getOuterHeight());
	anchor.setCenter(top, new Unit());

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
	let ajaxCall = new namespace.core.Ajax('html/options-dropdown.html');
	ajaxCall.method = 'GET';
	let xhrCall = await ajaxCall.send();


	// -----------------------------
	// calculate position of the dropdown
	// -----------------------------
	
	let dropdown = new namespace.html.Dropdown();
	dropdown.setAttribute('id', 'options-dropdown');
	dropdown.appendChild(xhrCall.responseText);
	
	// -----------------------------
	// set default values
	// -----------------------------

	dropdown.querySelector('#camera-x-input').value = DEBUG.CAMERA_POSITION_X;
	dropdown.querySelector('#camera-y-input').value = DEBUG.CAMERA_POSITION_Y;
	dropdown.querySelector('#camera-z-input').value = DEBUG.CAMERA_POSITION_Z;

	var canvasWidthInput = dropdown.querySelector('#canvas-width-input');
	canvasWidthInput.value = options.CANVAS_WIDTH;

	var canvasHeightInput = dropdown.querySelector('#canvas-height-input');
	canvasHeightInput.value = options.CANVAS_HEIGHT;

	var resolutionFactorInput = dropdown.querySelector('#resolution-factor-input');
	resolutionFactorInput.value = options.RESOLUTION_FACTOR;

	var blockWidthV = dropdown.querySelector('#block-width-input');
	blockWidthV.value = options.BLOCK_WIDTH;

	var blockHeightV = dropdown.querySelector('#block-height-input');
	blockHeightV.value = options.BLOCK_HEIGHT;


	let anchor = new namespace.html.Anchor(dropdown);
	anchor.setTarget(button);

	let top = Unit.add(button.getOuterHeight(), new Unit('1px'));
	anchor.setCenter(top, new Unit());

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
AdminPage._onStartStopRenderingClick = function()
{
	var startRenderingButtonV = document.getElementById('render-button');
	startRenderingButtonV.disable();

	var data = new Object();

	if (startRenderingButtonV.hasClass('selected'))
	{
		API.request('rendering/stop', () =>
		{
			globals.isRendering = false;
			AdminPage._updateRenderingState();
		}, data);
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

		API.request('rendering/start', () =>
		{
			globals.isRendering = true;
			AdminPage._updateRenderingState();
		}, data);
	}
};

AdminPage._onCanvasWidthChange = function(val)
{
	options.CANVAS_WIDTH = Number(val);
};

AdminPage._onCanvasHeightChange = function(val)
{
	options.CANVAS_HEIGHT = Number(val);
};

AdminPage._onResolutionFactorChange = function(val)
{
	options.RESOLUTION_FACTOR = Number(val);
};

AdminPage._onBlockWidthChange = function(val)
{
	options.BLOCK_WIDTH = Number(val);
};

AdminPage._onBlockHeightChange = function(val)
{
	options.BLOCK_HEIGHT = Number(val);
};

AdminPage._onOpenOutputClick = function()
{
	let width = (options.CANVAS_WIDTH * options.RESOLUTION_FACTOR);
	let height = (options.CANVAS_HEIGHT * options.RESOLUTION_FACTOR);

	// open rendering output window
	window.open("/renderingOutput", "", "width=" + width + ",height=" + height);
};