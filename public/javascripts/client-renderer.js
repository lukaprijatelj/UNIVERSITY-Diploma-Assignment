var IS_DEBUG_MODE = true;

var CANVAS_WIDTH = 1920;
var CANVAS_HEIGHT = 1080;


/** ----- NOTES: ----- */ 

// when exporting .obj scene from Cinema4D please use meters as a unit. 
// then use coverter command "obj2gltf -i input.obj -o output.gltf"

// if you use *.gltf model, then objects will not be rendered with rayTracing method because materials are MeshStandardMaterial type.
// this type of material does not render with RayTracing method. Not sure why though!

    
var loader = new THREE.GLTFLoader();

var GLOBALS =
{
	/**
	 * ThreeJS scene.
	 */
	scene: new THREE.Scene(),

	/**
	 * Canvas renderer.
	 */
	renderer: null,

	/**
	 * Camera controls affected by mouse movement.
	 */
	controls: null,

	/**
	 * ThreeJS camera in the scene.
	 */
	camera: null,

	/**
	 * Base url API access.
	 */
	apiUrl: '/api',

	/**
	 * Url where socketIO will be hosted.
	 */
	hostingUrl: IS_DEBUG_MODE == true ? 'http://localhost:30003' : 'http://lukaprij.wwwnl1-ss11.a2hosted.com:30003',

	/**
	 * Socket io instance.
	 */
	io: null,

	/**
	 * Grid layout of cells that are rendered or are waiting for rendering.
	 */
	renderingCells: [],

	/**
	 * Current rendering grid.
	 */
	currentGridId: -1,

	rendererType: 'raytracing',
	
	init: function()
	{
		GLOBALS.io = io(GLOBALS.hostingUrl, { query: "clientType=renderer" });
		GLOBALS.io.on('connect', GLOBALS.onServerConnected);

		GLOBALS.initCamera();
		//GLOBALS.initLights();
		//GLOBALS.init3DObjects();

		var ambientLight = new THREE.AmbientLight(0xcccccc);
		GLOBALS.scene.add(ambientLight);

		GLOBALS.initRenderer();
		GLOBALS.initCameraControls();

		var onLoadingError = function(error) 
		{
			console.error('[glTF loader] Error while loading scene!');
			console.error(error);
		};
		var onLoadingProgress = function(xhr) 
		{
			// occurs when one of the files is done loading
			var percentage = xhr.loaded / xhr.total * 100;

			console.log('[glTF loader] Scene is ' + percentage + '% loaded');				
		};
		var onLoadFinished = function(gltf) 
		{
			console.log('[glTF loader] Scene finished loading');

			GLOBALS.scene.add(gltf.scene);

			gltf.animations; // Array<THREE.AnimationClip>
			gltf.scene; // THREE.Scene
			gltf.scenes; // Array<THREE.Scene>
			gltf.cameras; // Array<THREE.Camera>
			gltf.asset; // Object
			
			//MAIN.getScreenshot = true;		
			
			GLOBALS.request('renderingCells/cell');
		};

		loader.load('Red-box/Box.gltf', onLoadFinished, onLoadingProgress, onLoadingError);
	},


	/**
	 * Ajax request to server.
	 * @async
	 */
	request: function(url, data)
	{
		data = data ? data : null;
		url = GLOBALS.apiUrl + '/request' + '/' + url;

		console.log('[Main] Requesting ' + url);

		GLOBALS.io.emit(url, data);
	},

	/**
	 * Ajax response from server.
	 */
	response: function(url, callback)
	{
		url = GLOBALS.apiUrl + '/response' + '/' + url;

		GLOBALS.io.on(url, callback);
	},

	/**
	 * On server-client connection.
	 */
	onServerConnected: function()
	{
		console.log('[Main] Connected to server!');

		GLOBALS.response('renderingCells/layout', GLOBALS.onGetLayout);
		GLOBALS.response('renderingCells/cell', GLOBALS.onRequestCell);
		GLOBALS.response('renderingCells/updateProgress', GLOBALS._onUpdateProgress);

		GLOBALS.request('renderingCells/layout');
	},	

	_onUpdateProgress: function(data)
	{
		var cell = data.cell;
		GLOBALS.drawOnCell(cell);
	},

	/**
	 * Intializes camera in the scene.
	 */
	initCamera: function()
	{
		GLOBALS.camera = new THREE.PerspectiveCamera(45, CANVAS_WIDTH/CANVAS_HEIGHT, 1, 20000);

		// for raytracing
		/*GLOBALS.camera.position.x = 0;
		GLOBALS.camera.position.y = 0;
		GLOBALS.camera.position.z = 600;*/

		// for castle
		GLOBALS.camera.position.x = 6.52;
		GLOBALS.camera.position.y = 2.21;
		GLOBALS.camera.position.z = -0.65;
	},

	/**
	 * Initializes camera mouse controls, so that changing view is easier.
	 */
	initCameraControls: function()
	{
		GLOBALS.controls = new THREE.OrbitControls(GLOBALS.camera, GLOBALS.renderer.domElement);
	},

	/**
	 * Initializes lights.
	 */
	initLights: function()
	{
		var intensity = 70000;

		var light = new THREE.PointLight( 0xffaa55, intensity );
		light.position.set( - 200, 100, 100 );
		light.physicalAttenuation = true;
		GLOBALS.scene.add( light );

		var light = new THREE.PointLight( 0x55aaff, intensity );
		light.position.set( 200, 100, 100 );
		light.physicalAttenuation = true;
		GLOBALS.scene.add( light );

		var light = new THREE.PointLight( 0xffffff, intensity * 1.5 );
		light.position.set( 0, 0, 300 );
		light.physicalAttenuation = true;
		GLOBALS.scene.add( light );
	},

	/**
	 * Initializes 3D objects and materials in the scene.
	 */
	init3DObjects: function() 
	{
		var phongMaterial = new THREE.MeshPhongMaterial( {
			color: 0xffffff,
			specular: 0x222222,
			shininess: 150,
			vertexColors: THREE.NoColors,
			flatShading: false
		} );

		var phongMaterialBox = new THREE.MeshPhongMaterial( {
			color: 0xffffff,
			specular: 0x111111,
			shininess: 100,
			vertexColors: THREE.NoColors,
			flatShading: true
		} );

		var phongMaterialBoxBottom = new THREE.MeshPhongMaterial( {
			color: 0x666666,
			specular: 0x111111,
			shininess: 100,
			vertexColors: THREE.NoColors,
			flatShading: true
		} );

		var phongMaterialBoxLeft = new THREE.MeshPhongMaterial( {
			color: 0x990000,
			specular: 0x111111,
			shininess: 100,
			vertexColors: THREE.NoColors,
			flatShading: true
		} );

		var phongMaterialBoxRight = new THREE.MeshPhongMaterial( {
			color: 0x0066ff,
			specular: 0x111111,
			shininess: 100,
			vertexColors: THREE.NoColors,
			flatShading: true
		} );

		var mirrorMaterialFlat = new THREE.MeshPhongMaterial( {
			color: 0x000000,
			specular: 0xff8888,
			shininess: 10000,
			vertexColors: THREE.NoColors,
			flatShading: true
		} );
		mirrorMaterialFlat.mirror = true;
		mirrorMaterialFlat.reflectivity = 1;

		var mirrorMaterialFlatDark = new THREE.MeshPhongMaterial( {
			color: 0x000000,
			specular: 0xaaaaaa,
			shininess: 10000,
			vertexColors: THREE.NoColors,
			flatShading: true
		} );
		mirrorMaterialFlatDark.mirror = true;
		mirrorMaterialFlatDark.reflectivity = 1;

		var mirrorMaterialSmooth = new THREE.MeshPhongMaterial( {
			color: 0xffaa00,
			specular: 0x222222,
			shininess: 10000,
			vertexColors: THREE.NoColors,
			flatShading: false
		} );
		mirrorMaterialSmooth.mirror = true;
		mirrorMaterialSmooth.reflectivity = 0.3;

		var glassMaterialFlat = new THREE.MeshPhongMaterial( {
			color: 0x000000,
			specular: 0x00ff00,
			shininess: 10000,
			vertexColors: THREE.NoColors,
			flatShading: true
		} );
		glassMaterialFlat.glass = true;
		glassMaterialFlat.reflectivity = 0.5;

		var glassMaterialSmooth = new THREE.MeshPhongMaterial( {
			color: 0x000000,
			specular: 0xffaa55,
			shininess: 10000,
			vertexColors: THREE.NoColors,
			flatShading: false
		} );
		glassMaterialSmooth.glass = true;
		glassMaterialSmooth.reflectivity = 0.25;
		glassMaterialSmooth.refractionRatio = 0.6;

		//

		group = new THREE.Group();
		GLOBALS.scene.add( group );

		// geometries

		var sphereGeometry = new THREE.SphereBufferGeometry( 100, 16, 8 );
		var planeGeometry = new THREE.BoxBufferGeometry( 600, 5, 600 );
		var boxGeometry = new THREE.BoxBufferGeometry( 100, 100, 100 );

		// Sphere

		var sphere = new THREE.Mesh( sphereGeometry, phongMaterial );
		sphere.scale.multiplyScalar( 0.5 );
		sphere.position.set( - 50, - 250 + 5, - 50 );
		group.add( sphere );

		var sphere2 = new THREE.Mesh( sphereGeometry, mirrorMaterialSmooth );
		sphere2.scale.multiplyScalar( 0.5 );
		sphere2.position.set( 175, - 250 + 5, - 150 );
		group.add( sphere2 );

		// Box

		var box = new THREE.Mesh( boxGeometry, mirrorMaterialFlat );
		box.position.set( - 175, - 250 + 2.5, - 150 );
		box.rotation.y = 0.5;
		group.add( box );

		// Glass

		var glass = new THREE.Mesh( sphereGeometry, glassMaterialSmooth );
		glass.scale.multiplyScalar( 0.5 );
		glass.position.set( 75, - 250 + 5, - 75 );
		glass.rotation.y = 0.5;
		GLOBALS.scene.add( glass );

		// bottom

		var plane = new THREE.Mesh( planeGeometry, phongMaterialBoxBottom );
		plane.position.set( 0, - 300 + 2.5, - 300 );
		plane.scale.multiplyScalar( 2 );
		GLOBALS.scene.add( plane );

		// top

		var plane = new THREE.Mesh( planeGeometry, phongMaterialBox );
		plane.position.set( 0, 300 - 2.5, - 300 );
		plane.scale.multiplyScalar( 2 );
		GLOBALS.scene.add( plane );

		// back

		var plane = new THREE.Mesh( planeGeometry, phongMaterialBox );
		plane.rotation.x = 1.57;
		plane.position.set( 0, 0, - 300 );
		GLOBALS.scene.add( plane );

		var plane = new THREE.Mesh( planeGeometry, mirrorMaterialFlatDark );
		plane.rotation.x = 1.57;
		plane.position.set( 0, 0, - 300 + 10 );
		plane.scale.multiplyScalar( 0.85 );
		GLOBALS.scene.add( plane );

		// left

		var plane = new THREE.Mesh( planeGeometry, phongMaterialBoxLeft );
		plane.rotation.z = 1.57;
		plane.scale.multiplyScalar( 2 );
		plane.position.set( - 300, 0, - 300 );
		GLOBALS.scene.add( plane );

		// right

		var plane = new THREE.Mesh( planeGeometry, phongMaterialBoxRight );
		plane.rotation.z = 1.57;
		plane.scale.multiplyScalar( 2 );
		plane.position.set( 300, 0, - 300 );
		GLOBALS.scene.add( plane );
	},

	/**
	 * Initializes renderer.
	 */
	initRenderer: function()
	{
		console.log('[Main] Initialize renderer of type "' + GLOBALS.rendererType  + '"');

		var canvas = document.getElementById('rendering-canvas');
		var gridLayout = document.getElementById('grid-layout');
		
		if (GLOBALS.rendererType  == 'default')
		{
			canvas.show();
			gridLayout.hide();
			GLOBALS.renderer = new THREE.WebGLRenderer({ canvas: canvas });
		}
		else if (GLOBALS.rendererType  == 'raytracing')
		{	
			canvas.hide();
			gridLayout.show();		
			GLOBALS.renderer = new THREE.RaytracingRenderer(canvas, GLOBALS.updateProgressAsync, GLOBALS.onCellRendered);
		}
	
		GLOBALS.renderer.setClearColor('#f4f4f4');				
		GLOBALS.renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
		document.body.appendChild(GLOBALS.renderer.domElement);		
	},	

	/**
	 * Main rendering loop.
	 */
	onRenderFrame: function()
	{
		if (GLOBALS.rendererType == 'default')
		{
			// will start loop for this function
			requestAnimationFrame(GLOBALS.onRenderFrame);
		}		

		// render current frame
		GLOBALS.renderer.render(GLOBALS.scene, GLOBALS.camera);

		if (GLOBALS.rendererType == 'default')
		{
			// update camera
			GLOBALS.controls.update();
		}
	},

	/**
	 * Gets rendering grid layout. Layout is needed, so that images from other clients are displayed.
	 * @async
	 */
	onGetLayout: function(data)
	{
		GLOBALS.renderingCells = data;

		console.log('[Renderer] Grid layout drawn');

		var gridLayout = document.getElementById('grid-layout');
		gridLayout.innerHTML = '';

		var prevCell = null;
		for (var i=0; i<data.length; i++)
		{
			var current = data[i];

			if (prevCell && prevCell.startX > current.startX)
			{
				gridLayout.appendChild(HTMLElement.createElement('<br>'));
			}

			gridLayout.appendChild(HTMLElement.createElement('<div id="cell-' + current._id + '" class="render-cell" style="width:' + current.width + 'px; height:' + current.height + 'px;"></div>'));
			prevCell = current;
		}				

		for (var i=0; i<data.length; i++)
		{
			var current = data[i];

			GLOBALS.drawOnCell(current);
		}

		
	},

	drawOnCell: function(cell)
	{
		if (!cell.imageData)
		{
			return;
		}

		var divHolderV = document.getElementById("cell-" + cell._id);
		var imageV = HTMLElement.createElement('<img src="' + cell.imageData + '" id="cell-' + cell._id + '" class="render-cell" style="width:' + cell.width + 'px; height:' + cell.height + 'px;" />');

		divHolderV.parentNode.replaceChild(imageV, divHolderV);
	},


	onCellRendered: function()
	{
		GLOBALS.request('renderingCells/cell');
	},

	/**
	 * Cell waiting to be rendered is received.
	 */
	onRequestCell: function(cell)
	{
		console.log('[Main] Rendering cell received');

		GLOBALS.renderingCells.currentRenderCell = cell;

		// must start new thread because socketIO will retry call if function is not finished in X num of miliseconds
		// heavy duty operation
		window.setTimeout(function()
		{
			if (GLOBALS.rendererType == 'raytracing')
			{
				GLOBALS.renderer.setCell(GLOBALS.renderingCells.currentRenderCell);
			}
			
			// start rendering
			GLOBALS.onRenderFrame();
		 }, 0);
	},

	/**
	 * Notifies server how much has client already rendered.
	 * @async
	 */
	updateProgressAsync: function(cell, progress)
	{
		var data = 
		{
			cell: cell,
			progress: progress
		};

		GLOBALS.request('renderingCells/updateProgress', data);
	}
};



GLOBALS.init();