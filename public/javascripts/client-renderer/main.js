var CANVAS_WIDTH = 1920;
var CANVAS_HEIGHT = 1080;



/** ----- NOTES: ----- */ 

// when exporting .obj scene from Cinema4D please use meters as a unit. 
// then use coverter command "obj2gltf -i input.obj -o output.gltf"

// if you use *.gltf model, then objects will not be rendered with rayTracing method because materials are MeshStandardMaterial type.
// this type of material does not render with RayTracing method. Not sure why though!


var MAIN =
{
	scene: new THREE.Scene(),
	renderer: null,
	controls: null,
	camera: null,


	/**
	 * Base url API access.
	 */
	apiUrl: '/api',

	/**
	 * Url where socketIO will be hosted.
	 */
	hostingUrl: 'http://localhost:80/',

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

	/**
	 * Flag indicating if screenshot should be captured on next frame render.
	 */
	getScreenshot: false,

	
	init: function()
	{
		MAIN.io = io(MAIN.hostingUrl, { query: "clientType=renderer" });
		MAIN.io.on('connect', MAIN.onServerConnected);

		MAIN.initCamera();
		MAIN.initLights();
		MAIN.init3DObjects();
	},


	/**
	 * On server-client connection.
	 */
	onServerConnected: function()
	{
		console.log('[Main] Connected to server!');

		MAIN.io.on(MAIN.apiUrl + 'response/renderingCells/layout', MAIN.onGetLayout);
		MAIN.io.on(MAIN.apiUrl + 'response/renderingCells/cell', MAIN.onRequestCell);

		MAIN.getLayoutAsync();
	},	

	initCamera: function()
	{
		MAIN.camera = new THREE.PerspectiveCamera(45, CANVAS_WIDTH/CANVAS_HEIGHT, 1, 20000);
		MAIN.camera.position.x = 0;
		MAIN.camera.position.y = 0;
		MAIN.camera.position.z = 600;
	},

	initCameraControls: function()
	{
		MAIN.controls = new THREE.OrbitControls(MAIN.camera, MAIN.renderer.domElement);
	},

	initLights: function()
	{
		// light

		var intensity = 70000;

		var light = new THREE.PointLight( 0xffaa55, intensity );
		light.position.set( - 200, 100, 100 );
		light.physicalAttenuation = true;
		MAIN.scene.add( light );

		var light = new THREE.PointLight( 0x55aaff, intensity );
		light.position.set( 200, 100, 100 );
		light.physicalAttenuation = true;
		MAIN.scene.add( light );

		var light = new THREE.PointLight( 0xffffff, intensity * 1.5 );
		light.position.set( 0, 0, 300 );
		light.physicalAttenuation = true;
		MAIN.scene.add( light );
	},

	init3DObjects: function() 
	{
		// materials

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
		MAIN.scene.add( group );

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
		MAIN.scene.add( glass );

		// bottom

		var plane = new THREE.Mesh( planeGeometry, phongMaterialBoxBottom );
		plane.position.set( 0, - 300 + 2.5, - 300 );
		plane.scale.multiplyScalar( 2 );
		MAIN.scene.add( plane );

		// top

		var plane = new THREE.Mesh( planeGeometry, phongMaterialBox );
		plane.position.set( 0, 300 - 2.5, - 300 );
		plane.scale.multiplyScalar( 2 );
		MAIN.scene.add( plane );

		// back

		var plane = new THREE.Mesh( planeGeometry, phongMaterialBox );
		plane.rotation.x = 1.57;
		plane.position.set( 0, 0, - 300 );
		MAIN.scene.add( plane );

		var plane = new THREE.Mesh( planeGeometry, mirrorMaterialFlatDark );
		plane.rotation.x = 1.57;
		plane.position.set( 0, 0, - 300 + 10 );
		plane.scale.multiplyScalar( 0.85 );
		MAIN.scene.add( plane );

		// left

		var plane = new THREE.Mesh( planeGeometry, phongMaterialBoxLeft );
		plane.rotation.z = 1.57;
		plane.scale.multiplyScalar( 2 );
		plane.position.set( - 300, 0, - 300 );
		MAIN.scene.add( plane );

		// right

		var plane = new THREE.Mesh( planeGeometry, phongMaterialBoxRight );
		plane.rotation.z = 1.57;
		plane.scale.multiplyScalar( 2 );
		plane.position.set( 300, 0, - 300 );
		MAIN.scene.add( plane );
	},

	/**
	 * Initializes renderer.
	 * @param {string} type - default, raytracing, pathrendering
	 */
	initRenderer: function(type)
	{
		console.log('[Main] Initialize renderer of type "' + type + '"');

		if (type == 'default')
		{
			MAIN.renderer = new THREE.WebGLRenderer();
		}
		else if (type == 'raytracing')
		{
			MAIN.renderer = new THREE.RaytracingRenderer(1, 384, 216, true);
		}

		MAIN.renderer.domElement.id = "rendering-canvas";
		MAIN.renderer.setClearColor('#f4f4f4');				
		MAIN.renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
		document.body.appendChild(MAIN.renderer.domElement);

		MAIN.initCameraControls();

		// start rendering
		MAIN.onRenderFrame();
	},	

	/**
	 * Capture screenshot of canvas.
	 */
	onScreenshot: function()
	{
		var canvas = HTML('#canvas-screenshot').elements[0];
		var ctx = canvas.getContext("2d");

		var renderCell = MAIN.renderingCells.currentRenderCell;
		var startX = renderCell.startX;
		var startY = renderCell.startY;
		var width = renderCell.width;
		var height = renderCell.height;

		throw 'missing imgData variable';
		ctx.putImageData(imgData, 0,0);
	},

	/**
	 * Main rendering loop.
	 */
	onRenderFrame: function()
	{
		// will start loop for this function
		//requestAnimationFrame(MAIN.onRenderFrame);

		// render current frame
		MAIN.renderer.render(MAIN.scene, MAIN.camera);

		/*if (MAIN.getScreenshot == true) 
		{
			// rendering must be captured before controls are updated

			MAIN.onScreenshot();
			MAIN.getScreenshot = false;
		}		

		if (MAIN.controls)
		{
			// update camera
			MAIN.controls.update();
		}*/
	},

	/**
	 * Gets rendering grid layout. Layout is needed, so that images from other clients are displayed.
	 * @async
	 */
	getLayoutAsync: function()
	{
		console.log('[Main] Layout requested');
		MAIN.io.emit(MAIN.apiUrl + 'request/renderingCells/layout', null);
	},
	onGetLayout: function(data)
	{
		MAIN.renderingCells = data;

		console.log('[Renderer] Grid layout drawn');

		var gridLayout = HTML('#grid-layout');

		gridLayout.empty();

		var prevCell = null;
		for (var i=0; i<data.length; i++)
		{
			var current = data[i];
	
			if (prevCell && prevCell.startX > current.startX)
			{
				gridLayout.append('<br>');
			}

			gridLayout.append('<div id="cell-' + current._id + '" class="render-cell" style="width: ' + current.width + 'px; height: ' + current.height + 'px;"></div>');
			prevCell = current;
		}				

		// Load a glTF resource
		MAIN.initRenderer('raytracing');

		MAIN.requestCellAsync();
	},

	requestCellAsync: function()
	{
		console.log('[Main] Cell requested');
		MAIN.io.emit(MAIN.apiUrl + 'request/renderingCells/cell', null);
	},
	onRequestCell: function(cell)
	{
		MAIN.renderingCells.currentRenderCell = cell;

		HTML('#cell-' + cell._id).addClass('active');

		console.log('[Main] Cell waiting to render received');
	},

	/**
	 * Notifies server how much has client already rendered.
	 * @async
	 */
	updateProgressAsync: function(progress, imageData)
	{
		var data = 
		{
			renderCellId: MAIN.renderingCells.currentRenderCell._id,
			progress: progress,
			imageData: imageData
		};

		MAIN.io.emit(MAIN.apiUrl + 'request/renderingCells/updateProgress', data);
	}
};



MAIN.init();