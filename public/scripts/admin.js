'use strict';

var WebApplication = new namespace.core.WebApplication('UNIVERSITY-Diploma-Assignment');
var options = null;


var globals = new namespace.core.Globals();

/**
 * ThreeJS scene.
 */
globals.scene = null;

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
globals.lights = null;

/**
 * Canvas for editor aka preview.
 */
globals.editorCanvas = null;

/**
 * Is rendering service running.
 */
globals.renderingServiceState = namespace.enums.renderingServiceState.IDLE;





var cache = new namespace.core.Cache();

/**
 * Grid layout of cells that are rendered or are waiting for rendering.
 */
cache.cells = new Array();

/**
 * List of clients connected to server.
 */
cache.clients = new Array();



var AdminPage = new namespace.core.WebPage('Admin');

/**
 * Loader properties.
 */
AdminPage.loadingText = null;
AdminPage.loadingBar = null;
AdminPage.loadingCounter = null;

/**
 * Loader properties.
 */
AdminPage.renderingText = null;
AdminPage.renderingBar = null;
AdminPage.renderingCounter = null;

/**
 * Last animationFrame ID.
 */
AdminPage.animationFrameID = -1;

/**
 * Timeout ID for hiding loading layer.
 */
AdminPage.hideLoadingLayerTimeoutID = -1;


/**
 * Initializes page.
 */
AdminPage.init = function()
{	
	let loadingLayer = document.querySelector('layer#loading');

	globals.editorCanvas = new namespace.html.EditorCanvas();
	globals.editorCanvas.init();

	let wrapper = loadingLayer.querySelector('.centered-text wrapper_');

	let loadingTextElement = new namespace.html.Div();
	AdminPage.loadingText = new namespace.html.ObservableString(loadingTextElement);
	wrapper.appendChild(loadingTextElement);

	wrapper.appendChild('<divider-x-small></divider-x-small>');

	AdminPage.loadingBar = new namespace.html.LoadingBar();
	AdminPage.loadingCounter = new namespace.core.LoadingCounter(100, AdminPage.loadingBar);
	wrapper.appendChild(AdminPage.loadingBar);

	AdminPage.loadingText.setValue('Initializing ...');
	AdminPage.loadingCounter.setValue(0);



	let renderingLayer = document.querySelector('layer#rendering');
	let renderingContent = renderingLayer.querySelector('.centered-text wrapper_ .loading-section');
	let renderingTextElement = new namespace.html.Div();
	AdminPage.renderingText = new namespace.html.ObservableString(renderingTextElement);
	renderingContent.appendChild(renderingTextElement);

	renderingContent.appendChild('<divider-x-small></divider-x-small>');

	AdminPage.renderingBar = new namespace.html.LoadingBar();
	AdminPage.renderingCounter = new namespace.core.LoadingCounter(100, AdminPage.renderingBar);
	renderingContent.appendChild(AdminPage.renderingBar);

	AdminPage.renderingText.setValue('Rendering ...');
	AdminPage.renderingCounter.setValue(0);

	let downloadImageButton = document.getElementById('download-image');
	downloadImageButton.setAttribute('href', '/' + RENDERED_IMAGE_FILEPATH);

	let downloadInfoButton = document.getElementById('download-info');
	downloadInfoButton.setAttribute('href', '/' + RENDERING_INFO_FILEPATH);


	
	DEBUG.init();

	API.init(namespace.enums.apiClientType.ADMIN);	

	API.connect(AdminPage._onServerConnected, AdminPage._onServerDisconnect);
};


/**
 * Hides loading layer after a while so that blinking of showing/hiding is avoided.
 */
AdminPage._hideLoadingLayer = function()
{
	if (AdminPage.hideLoadingLayerTimeoutID == -1)
	{
		window.clearTimeout(AdminPage.hideLoadingLayerTimeoutID);
		AdminPage.hideLoadingLayerTimeoutID = -1;
	}

	AdminPage.hideLoadingLayerTimeoutID = window.setTimeout(() =>
	{
		let loadingLayer = document.querySelector('layer#loading');
		loadingLayer.hide();

		AdminPage.hideLoadingLayerTimeoutID = -1;
	}, 100);
};

/**
 * Opens scene and loads cameras and lights.
 */
AdminPage.openScene = async function()
{
	let gltf = null;

	try
	{
		/**
		 * gltf.animations; // Array<THREE.AnimationClip>
		 * gltf.scene; // THREE.Scene
		 * gltf.scenes; // Array<THREE.Scene>
		 * gltf.cameras; // Array<THREE.Camera>
		 * gltf.asset; // Object
		 */
		gltf = await AdminPage._loadGltfModel();			
	}
	catch (err)
	{
		console.error(err.message);
		return;
	}	
	
	AdminPage._initScene(gltf.scene);

	await AdminPage._initSceneBackground(options.SKY_CUBE_FILEPATH, options.SKY_CUBE_IMAGES);

	AdminPage._initCamera(gltf.cameras);

	AdminPage._initLights();

	AdminPage._initRenderer();

	AdminPage._initCameraControls();	
	
	// start rendering
	AdminPage.onRenderFrame();
};

/**
 * On server-client connection.
 * @private
 */
AdminPage._onServerConnected = async function(socket)
{
	console.log('[AdminPage] Connected to server!');

	if (API.areListenersAttached == false)
	{
		API.areListenersAttached = true;

		API.listen('clients/add', 'AdminPage._onClientAdd');
		API.listen('clients/remove', 'AdminPage._onClientRemove');

		API.listen('rendering/finished', 'AdminPage._onRenderingFinished');
		API.listen('rendering/progress', 'AdminPage._onRenderingProgress');
	}

	let data;

	data = await API.request('clients/getAll');
	AdminPage._updateClients(data);

	data = await API.request('rendering/getOptions');
	AdminPage._updateOptions(data);

	data = await API.request('rendering/getState');
	AdminPage._updateRenderingServiceState(data);

	AdminPage.dispose();

	AdminPage.openScene();
};

/**
 * Client has disconnected from server.
 * @private
 */
AdminPage._onServerDisconnect = function()
{
	console.log('[AdminPage] Disconnected from server');
};

/**
 * Rendering has finished.
 * @private
 */
AdminPage._onRenderingFinished = function(thread, data)
{
	console.log('[AdminPage] Rendering has finished successfully');

	AdminPage._updateRenderingServiceState(data);
};

/**
 * Rendering progress was updated (some new cells finished rendering).
 * @private
 */
AdminPage._onRenderingProgress = function(thread, data, resolve, reject)
{
	let progress = data;

	console.log('[AdminPage] Rendering progress "' + progress + '%" updated');	

	if (globals.renderingServiceState == namespace.enums.renderingServiceState.FINISHED)
	{
		return;
	}

	if (globals.renderingServiceState == namespace.enums.renderingServiceState.PAUSED)
	{
		return;
	}

	AdminPage.renderingText.setValue('Rendered ' + progress + '%');
	AdminPage.renderingCounter.setValue(Math.roundToTwoDecimals(progress));
};

/**
 * Updates clients list.
 * @private
 */
AdminPage._updateClients = function(data)
{
	console.log('[AdminPage] Updating clients list');

	cache.clients = data;

	AdminPage._updateClientsLabel();
};

/**
 * Server has notified us that clients were updated.
 * @private
 */
AdminPage._onClientAdd = function(thread, data, resolve, reject)
{
	console.log('[AdminPage] Detected that new client has connected');

	cache.clients.push(data);
	
	AdminPage._updateClientsLabel();
};

/**
 * Client has removed.
 * @private
 */
AdminPage._onClientRemove = function(thread, data, resolve, reject)
{
	console.log('[AdminPage] Detected that client has disconnected');

	let sessionId = data;

	for (let i=0; i<cache.clients.length; i++)
	{
		let current = cache.clients[i];

		if (current.sessionId == sessionId)
		{
			Array.removeAtIndex(cache.clients, i);
			break;
		}
	}

	AdminPage._updateClientsLabel();
};

/**
 * Updated bottom left label for number of connected clients.
 * @private
 */
AdminPage._updateClientsLabel = function(data)
{
	var renderingClientsCount = cache.clients.filter(item => item.isAdmin == false).length;

	var clientsConnectedInput = document.querySelector('#num-clients-connected .value');
	clientsConnectedInput.innerHTML = renderingClientsCount;
};

/**
 * Updates options.
 * @private
 */
AdminPage._updateOptions = function(dataOptions)
{
	console.log('[AdminPage] Updating options');

	options = dataOptions;

	globals.editorCanvas.resize();
};

/**
 * Updates rendering service state.
 * @private
 */
AdminPage._updateRenderingServiceState = function(renderingServiceState)
{
	console.log('[AdminPage] Updating rendering service state');

	globals.renderingServiceState = renderingServiceState;

	AdminPage._updateRenderingState();
};

/**
 * Starts loading GLTF model.
 * @private
 */
AdminPage._loadGltfModel = function()
{
	var onSuccess = (resolve, reject) =>
	{
		console.log('[AdminPage] Requesting GLTF model');	

		let loadingLayer = document.querySelector('layer#loading');
		loadingLayer.show();

		AdminPage.loadingText.setValue('Loading GLTF model ...');
		AdminPage.loadingCounter.setValue(0);
		
		let onProgress = function(xhr)
		{
			// occurs when one of the files is done loading
			var percentage = xhr.loaded / xhr.total * 100;
		
			console.log('[AdminPage] GLTF model is ' + percentage + '% loaded');	

			AdminPage.loadingCounter.setValue(percentage);
		};
		let onSuccess = (gltf) =>
		{
			console.log('[AdminPage] Scene finished loading');
		
			AdminPage._hideLoadingLayer();

			resolve(gltf);
		};

		var loader = new THREE.GLTFLoader();
		loader.load(options.SCENE_FILEPATH, onSuccess, onProgress, reject);
	};
	return new Promise(onSuccess);
};

/**
 * Initializes scene.
 * @private
 */
AdminPage._initScene = function(gltfScene)
{
	globals.scene = new THREE.Scene();
	globals.scene.add(gltfScene);
};

/**
 * Sets background for scene.
 * @private
 */
AdminPage._initSceneBackground = function(skyCubeFilePath, skyCubeImages)
{
	return new Promise((resolve, reject) =>
	{
		let loadingLayer = document.querySelector('layer#loading');
		loadingLayer.show();

		AdminPage.loadingText.setValue('Loading scene background ...');
		AdminPage.loadingCounter.setValue(0);

		let onProgress = function(xhr)
		{
			var percentage = xhr.loaded / xhr.total * 100;

			console.log('[AdminPage] Scene background is ' + percentage + '% loaded');	

			AdminPage.loadingCounter.setValue(percentage);
		};
		let onLoad = function()
		{
			console.log('[AdminPage] Scene background finished loading');	

			AdminPage._hideLoadingLayer();

			resolve();
		};

		if (skyCubeFilePath)
		{
			var loader = new THREE.CubeTextureLoader();
			loader.setPath(skyCubeFilePath);

			globals.scene.background = loader.load(skyCubeImages, onLoad, onProgress, reject);
		}	
		else
		{
			onProgress(100);
			onLoad();
		}	
	});
};

/**
 * Intializes camera in the scene.
 * @private
 */
AdminPage._initCamera = function(cameras)
{
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

		let existingCamera = Array.getFirst(cameras);
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
	AdminPage._hideLoadingLayer();
};

/**
 * Initializes camera mouse controls, so that changing view is easier.
 * @private
 */
AdminPage._initCameraControls = function()
{
	console.log('[AdminPage] Initializing camera controls');

	globals.controls = new THREE.OrbitControls(globals.camera, globals.renderer.domElement);
	globals.controls.screenSpacePanning = true;
};

/**
 * Initializes additional lights like ambient light.
 * @private
 */
AdminPage._initLights = function()
{
	console.log('[AdminPage] Initializing lights');

	let loadingLayer = document.querySelector('layer#loading');
	loadingLayer.show();

	AdminPage.loadingText.setValue('Loading lights ...');
	AdminPage.loadingCounter.setValue(0);

	globals.lights = new Array();

	var light = new THREE.AmbientLight(0x404040, 3);
	globals.scene.add(light);
	globals.lights.push(light);

	/*var intensity = 1;

	var light = new THREE.PointLight(0xffaa55, intensity);
	light.position.set( - 200, 100, 100 );
	globals.scene.add( light );
	globals.lights.push(light);

	var light = new THREE.PointLight(0x55aaff, intensity);
	light.position.set( 200, -100, 100 );
	globals.scene.add( light );
	globals.lights.push(light);

	var light = new THREE.PointLight(0xffffff, intensity);
	light.position.set( 0, 0, -300 );
	globals.scene.add( light );
	globals.lights.push(light);*/

	AdminPage.loadingCounter.setValue(100);
	AdminPage._hideLoadingLayer();
};

/**
 * Initializes renderer.
 * @private
 */
AdminPage._initRenderer = async function()
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
	AdminPage._hideLoadingLayer();
};

/**
 * Main rendering loop.
 */
AdminPage.onRenderFrame = function()
{	
	// will start loop for this function
	AdminPage.animationFrameID = requestAnimationFrame(AdminPage.onRenderFrame);	

	// render current frame
	globals.renderer.render(globals.scene, globals.camera);
		
	// update camera by reading control changes
	globals.controls.update();
};

/**
 * Updates buttons and popups when rendering state is switched.
 * @private
 */
AdminPage._updateRenderingState = function()
{
	let startRenderingButtonV = document.getElementById('start-rendering-button');
	let stopRenderingButtonV = document.getElementById('stop-rendering-button');
	let pauseRenderingButtonV = document.getElementById('pause-rendering-button');
	var resumeRenderingButtonV = document.getElementById('resume-rendering-button');
	let interfaceV = document.querySelector('interface');
	let canvasV = document.getElementById('editor-canvas');
	let sceneButton = document.getElementById('scene-button');
	let optionsButton = document.getElementById('options-button');
	let backgroundButton = document.getElementById('background-button');
	//let newRendererButton = document.getElementById('new-renderer-button');

	let renderingLayer = document.querySelector('layer#rendering');

	let closeRenderingButtonV = document.getElementById('close-rendering-button');
	
	let finishedSection = renderingLayer.querySelector('.finished-section');
	let renderingSpacing = renderingLayer.querySelector('.loading-section divider-x-small');
	let renderingBar = renderingLayer.querySelector('.loading-section loadingbar');

	if (globals.renderingServiceState == namespace.enums.renderingServiceState.RUNNING)
	{
		renderingLayer.show();

		AdminPage.renderingText.setValue('Rendering ...');

		interfaceV.addClass('rendering');
		canvasV.disable();

		resumeRenderingButtonV.hide();
		closeRenderingButtonV.hide();
		finishedSection.hide();
		renderingSpacing.show();
		renderingBar.show();

		//newRendererButton.show();
		pauseRenderingButtonV.show();
		stopRenderingButtonV.show();
	}
	else if (globals.renderingServiceState == namespace.enums.renderingServiceState.PAUSED)
	{		
		renderingLayer.show();

		AdminPage.renderingText.setValue('Rendering paused!');

		interfaceV.addClass('rendering');
		canvasV.disable();

		closeRenderingButtonV.hide();
		finishedSection.hide();
		renderingSpacing.show();
		renderingBar.show();

		//newRendererButton.show();
		resumeRenderingButtonV.show();
		pauseRenderingButtonV.hide();
		stopRenderingButtonV.show();
	}
	else if (globals.renderingServiceState == namespace.enums.renderingServiceState.IDLE)
	{
		renderingLayer.hide();

		interfaceV.removeClass('rendering');
		canvasV.enable();

		closeRenderingButtonV.hide();
		finishedSection.hide();
		renderingSpacing.show();
		renderingBar.show();

		//newRendererButton.hide();
		pauseRenderingButtonV.hide();
		resumeRenderingButtonV.hide();
		stopRenderingButtonV.show();
	}
	else if (globals.renderingServiceState == namespace.enums.renderingServiceState.FINISHED)
	{
		renderingLayer.show();

		interfaceV.addClass('rendering');

		renderingBar.hide();
		renderingSpacing.hide();
		finishedSection.show();
		AdminPage.renderingText.setValue('Rendering done!');
		
		stopRenderingButtonV.hide();
		pauseRenderingButtonV.hide();
		resumeRenderingButtonV.hide();

		closeRenderingButtonV.show();	
	}
	else
	{
		new Exception.Other('Unknown rendering service type!');
	}
};

/**
 * Scene button od dropdown was clicked.
 * @private
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

	/*let uploadDiv = new namespace.html.Div();
	uploadDiv.id = 'upload-button';
	uploadDiv.addClass('entry');
	uploadDiv.setAttribute('onclick', 'AdminPage.onUploadSceneClick()');
	uploadDiv.appendChild('UPLOAD SCENE');
	wrapper.appendChild(uploadDiv);*/

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

/**
 * New renderer button was clicked, which will open new window.
 * @private
 */
AdminPage._onNewRendererClick = function()
{
	/*var a = document.createElement("a");    
	a.href = window.location.origin + '/client';    
	a.setAttribute('target', '_blank');
	var evt = document.createEvent("MouseEvents");   
	evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, true, false, false, false, 0, null);    
	a.dispatchEvent(evt);*/	

	if (options.OPEN_NEW_RENDERER_IN_WINDOW == true)
	{
		let width = options.CANVAS_WIDTH;
		let height = options.CANVAS_HEIGHT;

		window.open("/client", "", "width=" + width + ",height=" + height);
	}
	else
	{
		// opens in tab
		window.open("/client", "");
	}	
};

/**
 * Options button was clicked.
 * @private
 */
AdminPage._onOptionsButtonClick = async function(button)
{
	let dropdown = new namespace.html.OptionsDropdown();

	// -----------------------------
	// set position of the dropdown
	// -----------------------------

	let anchor = new namespace.html.Anchor(dropdown);
	anchor.setTarget(button);

	let top = button.getOuterHeight();
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

	AdminPage.dispose();

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

/**
 * File has done uploading.
 */
AdminPage.onFileUploadDone = function()
{
	AdminPage.resetFilesInput();

	AdminPage._hideLoadingLayer();
};

/**
 * Resets input field for file upload.
 */
AdminPage.resetFilesInput = function()
{
	var input = document.getElementById('upload-file-input');

	// reset input files so that onChange event will properly work when reselecting same files
	input.value = String();
};

/**
 * Upload scene button was clicked.
 */
AdminPage.onUploadSceneClick = function()
{
	document.getElementById('upload-file-input').click();
};

/**
 * Dropdown curtain was clicked, which means we must hide/cancel dropdown.
 */
AdminPage.onDropdownsCurtainClick = function(event)
{
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
 * Start/stop/pause/resume button was clicked.
 * @private
 */
AdminPage._onRenderButtonClick = function(type)
{
	AdminPage._changeRenderingState(type);
};

/**
 * Sends request to recalculate grid layout.
 * @private
 */
AdminPage._changeRenderingState = async function(type)
{
	let renderingLayer = document.querySelector('layer#rendering');
	
	let stopRenderingButtonV = document.getElementById('stop-rendering-button');
	let pauseRenderingButtonV = document.getElementById('pause-rendering-button');
	let startRenderingButtonV = document.getElementById('start-rendering-button');
	let resumeRenderingButtonV = document.getElementById('resume-rendering-button');
	
	startRenderingButtonV.disable();
	pauseRenderingButtonV.disable();
	resumeRenderingButtonV.disable();

	let data;

	if (type == 'stop')
	{
		renderingLayer.hide();
		data = await API.request('rendering/stop');	
	}
	else if (type == 'pause')
	{
		data = await API.request('rendering/pause');
	}
	else if (type == 'resume')
	{
		data = await API.request('rendering/resume');	
	}
	else if (type == 'start')
	{
		AdminPage.renderingText.setValue('Rendering ...');
		AdminPage.renderingCounter.setValue(0);

		options.CAMERA = globals.camera.toJSON();
	
		options.LIGHTS = [];

		for (let i=0; i<globals.lights.length; i++)
		{			
			options.LIGHTS.push(globals.lights[i].toJSON());
		}
		
		await API.request('rendering/setOptions', options);

		data = await API.request('rendering/start');				
	}
	else
	{
		new Exception.Other('Unknown rendering type!');
	}

	globals.renderingServiceState = data;
	
	startRenderingButtonV.enable();
	pauseRenderingButtonV.enable();
	resumeRenderingButtonV.enable();

	AdminPage._updateRenderingState();
};

/**
 * Background button was clicked.
 * @private
 */
AdminPage._onBackgroundButtonClick = function(button)
{
	let onSelect = function()
	{
		let _this = this;
		options.SKY_CUBE_FILEPATH = _this.getAttribute('dir');

		AdminPage._initSceneBackground(options.SKY_CUBE_FILEPATH, options.SKY_CUBE_IMAGES);
		AdminPage.hideLastDropdown();
	};
	let dropdown = new namespace.html.BackgroundDropdown(LIST_OF_BACKGROUND_IMAGES, onSelect);

	// -----------------------------
	// set position of the dropdown
	// -----------------------------

	let anchor = new namespace.html.Anchor(dropdown);
	anchor.setTarget(button);

	let top = button.getOuterHeight();
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
 * Disposes of the current rendering, scene, cameras, etc.
 */
AdminPage.dispose = function()
{
	if (AdminPage.animationFrameID >= 0)
	{
		cancelAnimationFrame(AdminPage.animationFrameID);
		AdminPage.animationFrameID = -1;
	}
	
	if (globals.renderer)
	{		
		globals.renderer.dispose();
		globals.renderer = null;
	}

	if (globals.scene)
	{
		let scene = globals.scene;

		while(scene.children.length > 0)
		{ 
			scene.remove(scene.children[0]); 
		}		

		globals.scene = null;
	}
	
	if (globals.camera)
	{
		globals.camera = null;
	}

	if (globals.controls)
	{
		globals.controls = null;
	}

	if (globals.lights)
	{
		globals.lights = null;
	}
};