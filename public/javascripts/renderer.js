var loader = new THREE.GLTFLoader();

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 20000 );

var renderer = new THREE.WebGLRenderer();
renderer.setClearColor( 0xC5C5C3 );
 // Load the Orbitcontroller
 var controls = new THREE.OrbitControls( camera, renderer.domElement ); 
	
 var ambientLight = new THREE.AmbientLight( 0xcccccc );
scene.add( ambientLight );

renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

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


	init: function()
	{
		RENDERER.io = io('http://localhost:80/', { reconnect: true });

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

				camera.position.z = 5;
				camera.position.y = 1;

				var geometry = new THREE.BoxGeometry( 1, 1, 1 );
var material = new THREE.MeshBasicMaterial( { color: 'red' } );
var cube = new THREE.Mesh( geometry, material );
scene.add( cube );

				function animate() {
					requestAnimationFrame( animate );
					renderer.render( scene, camera );
				}
				animate();

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

			if (i == 6)
			{
				gridLayout.innerHTML += '<canvas class="render-cell active" style="width: ' + current.width + 'px; height: ' + current.height + 'px;"></canvas>';
			}
			else
			{
				gridLayout.innerHTML += '<div class="render-cell" style="width: ' + current.width + 'px; height: ' + current.height + 'px;"></div>';
			}
			
		}
	},

	drawGridLayout: function()
	{
		var gridLayout = document.getElementById('grid-layout');


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