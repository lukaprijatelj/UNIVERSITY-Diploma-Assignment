var WebApplication = new namespace.core.WebApplication('UNIVERSITY-Diploma-Assignment');
var options = null;

var WebPage = new namespace.core.WebPage('Admin');

/**
 * Grid layout of cells that are rendered or are waiting for rendering.
 */
WebPage.cells = new List();

/**
 * Socket io instance.
 */
WebPage.io = null;

/**
 * ThreeJS scene.
 */
WebPage.scene = null;

/**
 * GLTF loader.
 */
WebPage.loader = null;

/**
 * Camera controls affected by mouse movement.
 */
WebPage.controls = null;

/**
 * ThreeJS camera in the scene.
 */
WebPage.camera = null;

/**
 * Additional scene lights.
 */
WebPage.lights = [];

/**
 * Canvas for editor aka preview.
 */
WebPage.editorCanvas = null;

/**
 * Is rendering service running.
 */
WebPage.isRendering = false;


/**
 * Initializes page.
 */
WebPage.init = function()
{	
	API.init(enums.apiClientType.ADMIN);	

	API.connect(WebPage._onServerConnected, WebPage._onServerDisconnect);

	WebPage.editorCanvas = new EditorCanvas();
	WebPage.editorCanvas.init();
	
	DEBUG.init();
};

/**
 * Opens scene and loads cameras and lights.
 */
WebPage.openScene = async function()
{
	let loadingLayer = document.querySelector('layer#loading');
	loadingLayer.querySelector('.centered-text wrapper_').innerHTML = 'Loading...';
	loadingLayer.show();

	var gltf = await WebPage.startLoadingGltfModel();

	loadingLayer.hide();

	await WebPage._initScene();
	WebPage.scene.add(gltf.scene);

	WebPage._initCamera(gltf.cameras);
	WebPage._initLights();
	
	WebPage._initRenderer();
	WebPage._initCameraControls();

	gltf.animations; // Array<THREE.AnimationClip>
	gltf.scene; // THREE.Scene
	gltf.scenes; // Array<THREE.Scene>
	gltf.cameras; // Array<THREE.Camera>
	gltf.asset; // Object
				
	WebPage.onRenderFrame();
};

/**
 * On server-client connection.
 * @private
 */
WebPage._onServerConnected = function(socket, data)
{
	console.log('[Main] Connected to server!');

	API.isConnected = true;

	API.listen('clients/updated', WebPage._onClientsUpdated);

	API.request('rendering/checkAdmin', WebPage._onCheckRendering);	

	WebPage.onLoaded();
};

/**
 * Client has disconnected from server.
 */
WebPage._onServerDisconnect = function()
{
	API.isConnected = false;
};

/**
 * Check is server rendering service is running.
 */
WebPage._onCheckRendering = async function(data)
{
	WebPage.isRendering = data.isRenderingServiceRunning;

	options = data.options;
	WebPage.editorCanvas.resizeCanvas();

	WebPage.openScene();

	WebPage._updateRenderingState();
};

/**
 * Starts loading GLTF model.
 */
WebPage.startLoadingGltfModel = function()
{
	console.log('[WebPage] Requesting GLTF model');	

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
WebPage._initScene = async function()
{
	var asyncCallback = async function(resolve, reject)
    {
        WebPage.scene = new THREE.Scene();

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
				
			WebPage.scene.background = new THREE.CubeTextureLoader().setPath(options.SKY_CUBE_FILEPATH).load(skyImages, resolve);
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
WebPage._initCamera = function(cameras)
{
	console.log('[WebPage] Initializing camera');

	let CAMERA_FOV = 75;
	let CAMERA_ASPECT = 2;  // the canvas default
	let CAMERA_NEAR = 0.001;
	let CAMERA_FAR = 10000;

	WebPage.camera = new THREE.PerspectiveCamera(CAMERA_FOV, CAMERA_ASPECT, CAMERA_NEAR, CAMERA_FAR);

	if (cameras && cameras.length)
	{
		// model has camera included, so we will use it's position and rotation

		let existingCamera = cameras[0];
		WebPage.camera.position.x = existingCamera.parent.position.x;
		WebPage.camera.position.y = existingCamera.parent.position.y;
		WebPage.camera.position.z = existingCamera.parent.position.z;
		WebPage.camera.rotation.x = existingCamera.parent.rotation.x;
		WebPage.camera.rotation.y = existingCamera.parent.rotation.y;
		WebPage.camera.rotation.z = existingCamera.parent.rotation.z;
	}
	else
	{
		// set default position and rotation
		WebPage.camera.position.x = -1.55877021541765;
		WebPage.camera.position.y = 0.6214917314103046;
		WebPage.camera.position.z = 0.9543815583821418;
	}	
};

/**
 * Initializes camera mouse controls, so that changing view is easier.
 */
WebPage._initCameraControls = function()
{
	console.log('[WebPage] Initializing camera controls');

	WebPage.controls = new THREE.OrbitControls(WebPage.camera, WebPage.renderer.domElement);
	WebPage.controls.screenSpacePanning = true;
};

/**
 * Initializes lights.
 */
WebPage._initLights = function()
{
	console.log('[WebPage] Initializing lights');

	var light = new THREE.AmbientLight(0x404040, 1);
	WebPage.scene.add(light);
	WebPage.lights.push(light);

	/*var intensity = 1;

	var light = new THREE.PointLight(0xffaa55, intensity);
	light.position.set( - 200, 100, 100 );
	WebPage.scene.add( light );

	var light = new THREE.PointLight(0x55aaff, intensity);
	light.position.set( 200, -100, 100 );
	WebPage.scene.add( light );

	var light = new THREE.PointLight(0xffffff, intensity);
	light.position.set( 0, 0, -300 );
	WebPage.scene.add( light );*/
};

/**
 * Initializes renderer.
 */
WebPage._initRenderer = function()
{
	console.log('[WebPage] Initialize editor renderer');

	var canvas = document.getElementById('editor-canvas');

	var options = 
	{ 
		canvas: canvas,
		antialias: true 
	};
	WebPage.renderer = new THREE.WebGLRenderer(options);
	WebPage.renderer.setSize(options.CANVAS_WIDTH, options.CANVAS_HEIGHT);

	WebPage.editorCanvas.resizeCanvas();
};

/**
 * Main rendering loop.
 */
WebPage.onRenderFrame = function()
{
	// will start loop for this function
	requestAnimationFrame(WebPage.onRenderFrame);	

	// render current frame
	WebPage.renderer.render(WebPage.scene, WebPage.camera);
		
	if (WebPage.controls)
	{
		// update camera
		WebPage.controls.update();
	}
};

/**
 * Clears scene.
 */
WebPage.clearScene = function()
{
	let scene = WebPage.scene;

	while(scene.children.length > 0)
	{ 
		scene.remove(scene.children[0]); 
	}
};

/**
 * Server has notified us that clients were updated.
 */
WebPage._onClientsUpdated = function(data)
{
	var clients = data;
	var renderingClientsCount = clients.filter(item => item.admin == false).length;

	var clientsConnectedInput = document.querySelector('#num-clients-connected .value');
	clientsConnectedInput.innerHTML = renderingClientsCount;
};

/**
 * Updates buttons and popups when rendering state is switched.
 */
WebPage._updateRenderingState = function()
{
	var startRenderingButtonV = document.getElementById('render-button');

	if (WebPage.isRendering == true)
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
WebPage.onLoaded = function()
{
	// -----------------------------
	// remove .loading flag
	// -----------------------------

	document.querySelector('interface').removeClass('loading');
};

/**
 * Scene button od dropdown was clicked.
*/
WebPage._onSceneButtonClick = async function(button)
{
	let ajaxCall = new namespace.core.Ajax('api/listScenes');
	let xhrCall = await ajaxCall.send();
	var scenes = JSON.parse(xhrCall.responseText);	

	let wrapper = new namespace.html.Wrapper();	

	for (let i=0; i<scenes.length; i++)
	{
		let div = new namespace.html.Div();
		div.addClass('entry');
		div.setAttribute('onclick', 'WebPage.onPreloadedSceneClick(this)');

		let divText = scenes[i] + '/' + 'Scene.gltf';
		div.appendChild(divText);
		wrapper.appendChild(div);
	}

	let uploadDiv = new namespace.html.Div();
	uploadDiv.id = 'upload-button';
	uploadDiv.addClass('entry');
	uploadDiv.setAttribute('onclick', 'WebPage.onUploadSceneClick()');
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
	curtain.onClick(WebPage.hideLastDropdown);
	curtain.show();
	
	let layer = document.querySelector('layer#dropdowns');
	layer.appendChild(curtain);
	layer.appendChild(dropdown);
	layer.show();
};

WebPage._onNewRendererClick = function()
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

WebPage._onOptionsButtonClick = async function(button)
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
	curtain.onClick(WebPage.hideLastDropdown);
	curtain.show();

	let layer = document.querySelector('layer#dropdowns');
	layer.appendChild(curtain);
	layer.appendChild(dropdown);
	layer.show();
};

/**
 * User choose different scene.
 */
WebPage.onPreloadedSceneClick = async function(element)
{
	options.SCENE_FILEPATH = 'scenes/' + element.innerHTML;

	WebPage.openScene();

	WebPage.onDropdownsCurtainClick();
};

/**
 * User picked file/folder with 3D scene.
 */
WebPage.onFileUploadChange = async function(event)
{
	WebPage.onDropdownsCurtainClick();

	let loadingLayer = document.querySelector('layer#loading');
	loadingLayer.querySelector('.centered-text wrapper_').innerHTML = 'Uploading...';
	loadingLayer.show();

	var form = document.getElementById("scene-upload-form");
	var formData = new FormData(form);

	var ajaxCall = new namespace.core.Ajax('/api/uploadScene');	
	ajaxCall.skipJsonStringify = true;	
	await ajaxCall.send(formData);

	WebPage.onFileUploadDone();
};

WebPage.onFileUploadDone = function()
{
	WebPage.resetFilesInput();

	let loadingLayer = document.querySelector('layer#loading');
	loadingLayer.hide();
};

WebPage.resetFilesInput = function()
{
	var input = document.getElementById('upload-file-input');

	// reset input files so that onChange event will properly work when reselecting same files
	input.value = String();
};

WebPage.onUploadSceneClick = function()
{
	document.getElementById('upload-file-input').click();
};

WebPage.onDropdownsCurtainClick = function(event)
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
WebPage.hideLastDropdown = function()
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
WebPage._onStartStopRenderingClick = function()
{
	var startRenderingButtonV = document.getElementById('render-button');
	startRenderingButtonV.disable();

	var data = new Object();

	if (startRenderingButtonV.hasClass('selected'))
	{
		API.request('rendering/stop', () =>
		{
			WebPage.isRendering = false;
			WebPage._updateRenderingState();
		}, data);
	}
	else
	{
		options.CAMERA = WebPage.camera.toJSON();
	
		for (let i=0; i<WebPage.lights.length; i++)
		{
			options.LIGHTS = [];
			options.LIGHTS.push(WebPage.lights[i].toJSON());
		}
		
		data.options = options;

		API.request('rendering/start', () =>
		{
			WebPage.isRendering = true;
			WebPage._updateRenderingState();
		}, data);
	}
};

WebPage._onCanvasWidthChange = function(val)
{
	options.CANVAS_WIDTH = Number(val);
};

WebPage._onCanvasHeightChange = function(val)
{
	options.CANVAS_HEIGHT = Number(val);
};

WebPage._onResolutionFactorChange = function(val)
{
	options.RESOLUTION_FACTOR = Number(val);
};

WebPage._onBlockWidthChange = function(val)
{
	options.BLOCK_WIDTH = Number(val);
};

WebPage._onBlockHeightChange = function(val)
{
	options.BLOCK_HEIGHT = Number(val);
};

WebPage._onOpenOutputClick = function()
{
	let width = (options.CANVAS_WIDTH * options.RESOLUTION_FACTOR);
	let height = (options.CANVAS_HEIGHT * options.RESOLUTION_FACTOR);

	// open rendering output window
	window.open("/renderingOutput", "", "width=" + width + ",height=" + height);
};