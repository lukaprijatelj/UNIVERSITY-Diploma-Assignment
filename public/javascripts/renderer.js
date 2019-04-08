var loader = new THREE.GLTFLoader();
var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(45, 1920 / 1080, 1, 20000 );
camera.position.x = -5;
camera.position.y = 1;

var renderer = new THREE.WebGLRenderer();
renderer.domElement.id = "rendering-canvas";
renderer.setClearColor('#f4f4f4');

var controls = new THREE.OrbitControls(camera, renderer.domElement); 
	
var ambientLight = new THREE.AmbientLight( 0xcccccc );
scene.add( ambientLight );

renderer.setSize(1920, 1080);
document.body.appendChild(renderer.domElement);


var mouseX, mouseY;
function onDocumentMouseMove( event ) 
{
	mouseX = event.clientX;
	mouseY = event.clientY;
}

var RENDERER =
{
	/**
	 * Is client connected to server.
	 */
	isConnected: false,

	/**
	 * Socket io instance.
	 */
	io: null,

	getScreenshot: false,

	init: function()
	{
		RENDERER.io = io('http://localhost:80/', { reconnect: true });

		// when exporting .obj scene from Cinema4D please use meters as a unit. 
		// then use coverter command "obj2gltf -i input.obj -o output.gltf"


		// Load a glTF resource
		loader.load(
			// resource URL
			'fileUploads/Scene.gltf',
			// called when the resource is loaded
			function ( gltf ) {

				scene.add( gltf.scene );

				gltf.animations; // Array<THREE.AnimationClip>
				gltf.scene; // THREE.Scene
				gltf.scenes; // Array<THREE.Scene>
				gltf.cameras; // Array<THREE.Camera>
				gltf.asset; // Object
				

				// refresh camera (if not then color of the pixels is incorrect)
				controls.update();

				RENDERER.getScreenshot = true;				
			},
			// called while loading is progressing
			function ( xhr ) {
				console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );				
			},
			// called when loading has errors
			function ( error ) {
				console.log( 'An error happened' );
			}
		);
		
		RENDERER.io.on('connect', RENDERER.onServerConnected);

		//document.addEventListener( 'mousemove', onDocumentMouseMove, false );

		// start rendering
		RENDERER.onRenderFrame();
	},

	/**
	 * Capture screenshot of canvas.
	 */
	onScreenshot: function()
	{
		var gl = renderer.getContext();

		var pixelValues = new Uint8Array(384 * 216 * 4);
		gl.readPixels(0, 648, 384, 216, gl.RGBA, gl.UNSIGNED_BYTE, pixelValues);

		/*
		var pixelValues = new Float32Array(384 * 216 * 4);
		renderer.readRenderTargetPixels(0, 500, 384, 216, pixelValues);
		*/

		var c = document.getElementById('canvas-screenshot');
		var ctx = c.getContext("2d");
		var imgData = ctx.createImageData(384, 216);


		var newCell = 384*216*4;

		// must invert colors by X axis
		newCell -= 384*4;
		var cell = 0;
		for (var j=0; j<216;j++)
		{
			for (var i=0; i<384; i++)
			{
				for (var k=0; k<4; k++)
				{
					
					imgData.data[newCell] = pixelValues[cell];

					cell++;
					newCell++;

					/*var red = pixelValues[j];
					j++;
		
					var g = pixelValues[j];
					j++;
		
					var b = pixelValues[j];
					j++;
		
					var a = pixelValues[j];
					j++;
		
					imgData.data[r] = red;
					r++;
		
					imgData.data[r] = g;
					r++;
		
					imgData.data[r] = b;
					r++;
					
					imgData.data[r] = a;
					r++;	*/
				}
			}
			newCell -= (384*4*2);		
		}


/*
		for (var i=0; i<imgData.data.length;)
		{
			imgData.data[i] = pixelValues[i];
			i++;
			
			imgData.data[i] = pixelValues[i];
			i++;

			imgData.data[i] = pixelValues[i];
			i++;

			imgData.data[i] = pixelValues[i];
			i++;
		}
		*/

		ctx.putImageData(imgData, 0,0);
	},

	/**
	 * Main rendering loop.
	 */
	onRenderFrame: function()
	{
		// will start loop for this function
		requestAnimationFrame(RENDERER.onRenderFrame);

		// render current frame
		renderer.render(scene, camera);

		if (RENDERER.getScreenshot == true) 
		{
			RENDERER.onScreenshot();
			RENDERER.getScreenshot = false;
		}		

		// update camera
		controls.update();
	},

	/**
	 * On server-client connection.
	 */
	onServerConnected: function()
	{
		RENDERER.isConnected = true;

		console.log('Connected!');

		RENDERER.io.on('gridLayouts', RENDERER.onGridLayout);
		//RENDERER.notifyProgressUpdate(100);
	},

	onGridLayout: function(data)
	{
		var gridLayout = document.getElementById('grid-layout');

		// clear element
		gridLayout.innerHTML = '';

		for (var i=0; i<data.length; i++)
		{
			var current = data[i];
	
			if (i > 0 && data[i - 1].row != current.row)
			{
				gridLayout.innerHTML += '<br>';
			}

			/*if (i == 6)
			{
				gridLayout.innerHTML += '<canvas class="render-cell active" style="width: ' + current.width + 'px; height: ' + current.height + 'px;"></canvas>';
			}
			else*/
			{
				gridLayout.innerHTML += '<div class="render-cell" style="width: ' + current.width + 'px; height: ' + current.height + 'px;"></div>';
			}
			
		}
	},

	/**
	 * Gets rendering grid layout. Layout is needed, so that images from other clients are displayed.
	 * @async
	 */
	getGridLayout: function()
	{

	},

	/**
	 * Gets render job info.
	 * @async
	 */
	getRenderJob: function()
	{

	},

	getScreenshot: function()
	{
		//var dataURL = canvas.toDataURL();
	},

	/**
	 * Notifies server how much has client already rendered.
	 * @async
	 */
	notifyProgressUpdate: function(value)
	{
		if (typeof value === 'undefined')
		{
			return;
		}

		RENDERER.io.emit('progressUpdate', value.toString());
	}
};

RENDERER.init();