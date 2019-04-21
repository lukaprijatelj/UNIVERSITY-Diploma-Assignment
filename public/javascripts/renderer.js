var mouseX, mouseY;
function onDocumentMouseMove(event) 
{
	mouseX = event.clientX;
	mouseY = event.clientY;
}


var loader = new THREE.GLTFLoader();
var scene;
var renderer;
var camera;
var controls;

var hash = location.hash ? location.hash.substring( 1 ) : '3';

var WORKERS = + hash || navigator.hardwareConcurrency || 3;

document.body.addEventListener("wheel", wheelCallback);

direction = 'x';
function wheelCallback() 
{
	const delta = Math.sign(event.deltaY);

	var value = delta > 0 ? 0.5 : -0.5;

	if (direction == 'x')
	{
		camera.position.x += value;
	}
	else if (direction == 'y')
	{
		camera.position.y += value;
	}
	else if (direction == 'z')
	{
		camera.position.z += value;
	}

	RENDERER.onRenderFrame();
}


var RENDERER =
{
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

		scene = new THREE.Scene();
		scene.background = new THREE.Color( 0xf0f0f0 );

		camera = new THREE.PerspectiveCamera(45, 1920 / 1080, 1, 20000);
		/*camera.position.x = -10.6;
		camera.position.y = 12.6;
		camera.position.z = -13.6;*/
		camera.position.x = 0;
		camera.position.y = 5.5;
		camera.position.z = 32;
		//scene.add(camera);
	


		RENDERER.io = io(RENDERER.hostingUrl, { reconnect: true });

		// when exporting .obj scene from Cinema4D please use meters as a unit. 
		// then use coverter command "obj2gltf -i input.obj -o output.gltf"
		
		RENDERER.io.on('connect', RENDERER.onServerConnected);

		document.addEventListener('mousemove', onDocumentMouseMove, false);
	},


	/**
	 * On server-client connection.
	 */
	onServerConnected: function()
	{
		console.log('[SocketIO] Connected to server!');

		RENDERER.io.on(RENDERER.apiUrl + 'response/renderingCells/layout', RENDERER.onGetLayout);
		RENDERER.io.on(RENDERER.apiUrl + 'response/renderingCells/cell', RENDERER.onRequestCell);

		RENDERER.getLayoutAsync();
	},

	/**
	 * Starts loading 3D GTLF scene from server.
	 */
	startLoadingGltfModel: function(filepath)
	{
		var onLoadingError = function(error) 
		{
			console.error('[glTF loader] Error while loading scene!');
			console.error(error);
		};
		var onLoadingProgress = function(xhr) 
		{
			// occurs when one of the files is done loading
			console.log((xhr.loaded / xhr.total * 100) + '% loaded');				
		};
		var onLoadFinished = function(gltf) 
		{
			console.log('[glTF loader] Scene finished loading');
			
			

			scene.add(gltf.scene);
			//scene = gltf.scene;

			scene.background = new THREE.Color( 0xf0f0f0 );
			var ambientLight = new THREE.AmbientLight(0xcccccc);
		scene.add(ambientLight);

		/*var intensity = 7000000000;

				var light = new THREE.PointLight( 0xffaa55, intensity );
				light.position.set( - 200, 100, 100 );
				light.physicalAttenuation = true;
				scene.add( light );

				var light = new THREE.PointLight( 0x55aaff, intensity );
				light.position.set( 200, 100, 100 );
				light.physicalAttenuation = true;
				scene.add( light );

				var light = new THREE.PointLight( 0xffffff, intensity * 1.5 );
				light.position.set( 0, 0, 300 );
				light.physicalAttenuation = true;
				scene.add( light );*/
			/*for (var i=0; i<gltf.scene.children.length; i++)
			{
				var current = gltf.scene.children[i].material;

				if (!current)
				{
					continue;
				}

				current.color= 0x666666;
				current.specular= 0x111111;
				current.shininess= 100;
				current.vertexColors= THREE.NoColors;
				current.flatShading= true;
			}*/

			/*renderer = new THREE.WebGLRenderer();*/
			renderer = new THREE.RaytracingRenderer( {
				workers: WORKERS,
				workerPath: 'javascripts/threejs/RaytracingWorker.js',
				randomize: true,
				blockSize: 64
			} );

			renderer.domElement.id = "rendering-canvas";
			renderer.setSize(1920, 1080);
			renderer.clear();
			renderer.setClearColor('#f4f4f4');
			//controls = new THREE.OrbitControls(camera, renderer.domElement); 
			
		document.body.appendChild(renderer.domElement);

			gltf.animations; // Array<THREE.AnimationClip>
			gltf.scene; // THREE.Scene
			gltf.scenes; // Array<THREE.Scene>
			gltf.cameras; // Array<THREE.Camera>
			gltf.asset; // Object
			
// start rendering
RENDERER.onRenderFrame();

			// refresh camera (if not then color of the pixels is incorrect)
			//controls.update();


			//RENDERER.getScreenshot = true;	
		};

		loader.load(filepath, onLoadFinished, onLoadingProgress, onLoadingError);
	},

	/**
	 * Capture screenshot of canvas.
	 */
	onScreenshot: function()
	{
		var canvas = HTML('#canvas-screenshot').elements[0];
		var ctx = canvas.getContext("2d");

		var renderCell = RENDERER.renderingCells.currentRenderCell;
		var startX = renderCell.startX;
		var startY = renderCell.startY;
		var width = renderCell.width;
		var height = renderCell.height;

		var imgData = RENDERER.readCanvasPixels_Deprecated(renderer, ctx, startX, startY, width, height);
		//RENDERER.updateProgressAsync(20, imgData);

		ctx.putImageData(imgData, 0,0);
	},

	/**
	 * this function is deprecated, because is uses linear reading of the pixels instead of using graphics card API.
	 * Linear pixels reading is very slow !
	 */
	readCanvasPixels_Deprecated: function(renderer, context2d, startX, startY, width, height)
	{
		var gl = renderer.getContext();

		// red, green, blue, alpha
		var NUM_OF_VERTICES = 4;

		var verticesLength = width * height * NUM_OF_VERTICES;
		var pixelValues = new Uint8Array(verticesLength);
		gl.readPixels(startX, startY, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixelValues);

		/*
		var pixelValues = new Float32Array(verticesLength);
		renderer.readRenderTargetPixels(startX, startY, width, height, pixelValues);
		*/

		var imgData = context2d.createImageData(width, height);
		var newCell = verticesLength;

		// must invert pixels by X axis
		newCell -= width*NUM_OF_VERTICES;
		var cell = 0;

		for (var j=0; j<height;j++)
		{
			for (var i=0; i<width; i++)
			{
				for (var k=0; k<NUM_OF_VERTICES; k++)
				{					
					imgData.data[newCell] = pixelValues[cell];

					cell++;
					newCell++;
				}
			}
			newCell -= (width*NUM_OF_VERTICES*2);		
		}

		return imgData;
	},

	/**
	 * Main rendering loop.
	 */
	onRenderFrame: function()
	{
		// will start loop for this function
		//requestAnimationFrame(RENDERER.onRenderFrame);

		// render current frame
		renderer.render(scene, camera);

		if (RENDERER.getScreenshot == true) 
		{
			// rendering must be captured before controls are updated

			RENDERER.onScreenshot();
			RENDERER.getScreenshot = false;
		}		

		// update camera
		if (controls)
		{
			controls.update();
			console.log(camera.position.x + ',' + camera.position.y + ', ' + camera.position.z);
		}
		
	},

	onGetLayout: function(data)
	{
		RENDERER.renderingCells = data;

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
		//RENDERER.startLoadingGltfModel('files/castle/Sponza.gltf');
		RENDERER.startLoadingGltfModel('files/Scene.gltf');

		RENDERER.requestCellAsync();
	},

	/**
	 * Gets rendering grid layout. Layout is needed, so that images from other clients are displayed.
	 * @async
	 */
	getLayoutAsync: function()
	{
		RENDERER.io.emit(RENDERER.apiUrl + 'request/renderingCells/layout', null);
	},

	requestCellAsync: function()
	{
		RENDERER.io.emit(RENDERER.apiUrl + 'request/renderingCells/cell', null);
	},

	onRequestCell: function(cell)
	{
		RENDERER.renderingCells.currentRenderCell = cell;

		HTML('#cell-' + cell._id).addClass('active');

		console.log('[SocketIo] Cell waiting to render received');
	},

	/**
	 * Notifies server how much has client already rendered.
	 * @async
	 */
	updateProgressAsync: function(progress, imageData)
	{
		var data = 
		{
			renderCellId: RENDERER.renderingCells.currentRenderCell._id,
			progress: progress,
			imageData: imageData
		};

		RENDERER.io.emit(RENDERER.apiUrl + 'request/renderingCells/updateProgress', data);
	}
};

RENDERER.init();