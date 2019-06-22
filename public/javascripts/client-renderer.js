/** ----- NOTES: ----- */ 

// when exporting .obj scene from Cinema4D please use meters as a unit. 
// then use coverter command "obj2gltf -i input.obj -o output.gltf"

var io = io(HOSTING_URL, { query: "clientType=renderer" });

var GLOBALS =
{
	/**
	 * ThreeJS scene.
	 */
	scene: null,

	/**
	 * GLTF loader.
	 */
	loader: null,

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
	 * Socket io instance.
	 */
	io: null,

	/**
	 * Grid layout of cells that are rendered or are waiting for rendering.
	 */
	renderingCells: [],

	/**
	 * Current renderer type.
	 */
	rendererType: enums.rendererType.WEB_GL_RENDERER,

	
	init: function()
	{
		io.on('connect', GLOBALS._onServerConnected);	
		
		GLOBALS._initScene();
		GLOBALS._initCamera();
		GLOBALS._initLights();
		//GLOBALS._init3DObjectsForTestScene();
		GLOBALS._initRenderer();
		GLOBALS._initCameraControls();
		GLOBALS._initGltfLoader();

		//DEBUG.init();

		GLOBALS.startLoadingGltfModel();	
	},


	/**
	 * Ajax request to server.
	 * @async
	 */
	request: function(url, data)
	{
		data = data ? data : null;
		url = GLOBALS.apiUrl + '/request' + '/' + url;

		console.log('[Globals] Requesting ' + url);

		io.emit(url, data);
	},

	/**
	 * Ajax response from server.
	 */
	response: function(url, callback)
	{
		url = GLOBALS.apiUrl + '/response' + '/' + url;

		io.on(url, callback);
	},

	/**
	 * On server-client connection.
	 */
	_onServerConnected: function()
	{
		console.log('[Globals] Connected to server!');

		GLOBALS.response('renderingCells/layout', GLOBALS.onGetLayout);
		GLOBALS.response('renderingCells/cell', GLOBALS.onRequestCell);
		GLOBALS.response('renderingCells/updateProgress', GLOBALS._onUpdateProgress);

		GLOBALS.request('renderingCells/layout');
	},	

	/**
	 * Progress was updated.
	 */
	_onUpdateProgress: function(data)
	{
		var cell = data.cell;
		GLOBALS.drawOnCell(cell);
	},

	/**
	 * Initializes GLTF loader.
	 */
	_initGltfLoader: function()
	{
		console.log('[Globals] Initializing GLTF loader');

		GLOBALS.loader = new THREE.GLTFLoader();
	},

	startLoadingGltfModel: function(path)
	{
		console.log('[Globals] Requesting GLTF model');

		var loader = new GltfLoader();

		loader.path = 'Buggy/Buggy.gltf';
		loader.onSuccess = function(gltf) 
		{
			console.log('[glTF loader] Scene finished loading');

			GLOBALS.scene.add(gltf.scene);

			gltf.animations; // Array<THREE.AnimationClip>
			gltf.scene; // THREE.Scene
			gltf.scenes; // Array<THREE.Scene>
			gltf.cameras; // Array<THREE.Camera>
			gltf.asset; // Object
						
			GLOBALS.request('renderingCells/cell');
		};
		loader.start();	
	},

	/**
	 * Initializes scene.
	 */
	_initScene: function()
	{
		GLOBALS.scene = new THREE.Scene();
	},

	/**
	 * Intializes camera in the scene.
	 */
	_initCamera: function()
	{
		console.log('[Globals] Initializing camera');

		GLOBALS.camera = new THREE.PerspectiveCamera(45, CANVAS_WIDTH/CANVAS_HEIGHT, 1, 20000);
		/*GLOBALS.camera.position.x = 0.20;
		GLOBALS.camera.position.y = 0;
		GLOBALS.camera.position.z = 0;*/

		GLOBALS.camera.position.x = 6.52;
		GLOBALS.camera.position.y = 2.21;
		GLOBALS.camera.position.z = -0.65;
	},

	/**
	 * Initializes camera mouse controls, so that changing view is easier.
	 */
	_initCameraControls: function()
	{
		console.log('[Globals] Initializing camera controls');

		GLOBALS.controls = new THREE.OrbitControls(GLOBALS.camera, GLOBALS.renderer.domElement);
	},

	/**
	 * Initializes lights.
	 */
	_initLights: function()
	{
		console.log('[Globals] Initializing lights');

		var intensity = 70000;

		/*var light = new THREE.PointLight( 0xffaa55, intensity );
		light.position.set( - 200, 100, 100 );
		light.physicalAttenuation = true;
		GLOBALS.scene.add( light );

		/*var light = new THREE.PointLight( 0x55aaff, intensity );
		light.position.set( 200, 100, 100 );
		light.physicalAttenuation = true;
		GLOBALS.scene.add( light );

		var light = new THREE.PointLight( 0xffffff, intensity * 1.5 );
		light.position.set( 0, 0, 300 );
		light.physicalAttenuation = true;
		GLOBALS.scene.add( light );*/

		var light = new THREE.AmbientLight( 0x404040, 3 ); // soft white light
		GLOBALS.scene.add( light );
	},

	/**
	 * Initializes 3D objects and materials in the scene.
	 */
	_init3DObjectsForTestScene: function() 
	{
		console.log('[Globals] Initializing 3D objects for test scene');

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
	_initRenderer: function()
	{
		console.log('[Globals] Initialize renderer of type "' + GLOBALS.rendererType + '"');

		var renderer = null;
		var canvas = document.getElementById('rendering-canvas');
		var options = {};

		switch(GLOBALS.rendererType)
		{
			case enums.rendererType.WEB_GL_RENDERER:
				options = 
				{ 
					canvas: canvas 
				};
				renderer = new THREE.WebGLRenderer(options);
	
				renderer.setClearColor('#f4f4f4');				
				renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
	
				document.body.appendChild(renderer.domElement);	
				break;

			case enums.rendererType.RAY_TRACING:
				options = 
				{ 
					canvas: canvas, 
					updateFunction: GLOBALS.updateProgressAsync, 
					onCellRendered: GLOBALS.onCellRendered 
				};
				renderer = new THREE.RaytracingRenderer(options);
				break;

			case enums.rendererType.PATH_TRACING:

				break;
		}

		GLOBALS.renderer = renderer;
	},	

	/**
	 * Main rendering loop.
	 */
	onRenderFrame: function()
	{
		if (GLOBALS.rendererType == enums.rendererType.WEB_GL_RENDERER)
		{
			// will start loop for this function
			requestAnimationFrame(GLOBALS.onRenderFrame);
		}		

		// render current frame
		GLOBALS.renderer.render(GLOBALS.scene, GLOBALS.camera);
			
		if (GLOBALS.rendererType == enums.rendererType.WEB_GL_RENDERER)
		{
			if (GLOBALS.controls)
			{
				// update camera
				GLOBALS.controls.update();
			}
		}
	},

	/**
	 * Gets rendering grid layout. Layout is needed, so that images from other clients are displayed.
	 * @async
	 */
	onGetLayout: function(data)
	{
		GLOBALS.renderingCells = data;

		console.log('[Globals] Grid layout drawn');

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

		document.getElementById('loading-curtain').hide();
		document.getElementById('interface').show();
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
		console.log('[Globals] Rendering cell received');

		GLOBALS.renderingCells.currentRenderCell = cell;

		// must start new thread because socketIO will retry call if function is not finished in X num of miliseconds
		// heavy duty operation
		GLOBALS.startRendering();
	},

	startRendering: async function()
	{
		if (GLOBALS.rendererType != enums.rendererType.WEB_GL_RENDERER)
		{
			GLOBALS.renderer.setCell(GLOBALS.renderingCells.currentRenderCell);
		}

		// start rendering
		GLOBALS.onRenderFrame();
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