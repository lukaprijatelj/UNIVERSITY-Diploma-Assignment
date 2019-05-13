/**
 * RaytracingRenderer renders by raytracing it's scene. However, it does not
 * compute the pixels itself but it hands off and coordinates the tasks for workers.
 * The workers compute the pixel values and this renderer simply paints it to the Canvas.
 *
 * @author zz85 / http://github.com/zz85
 */

THREE.RaytracingRenderer = function (numOfWorkers, blockWidth, blockHeight, shouldRandomize, alpha) 
{
	console.log('THREE.RaytracingRenderer', THREE.REVISION);

	var canvas = document.createElement('canvas');
	this.context = canvas.getContext('2d', 
	{
		alpha: alpha === true
	});

	var canvasWidth;
	var canvasHeight;
	var clearColor = new THREE.Color(0x000000);

	this.renderering = false;
	this.pool = [];
	this.domElement = canvas;
	this.autoClear = true;
	this.workers = numOfWorkers;
	this.blockWidth = blockWidth || 64;
	this.blockHeight = blockHeight || 64;
	this.randomize = shouldRandomize;

	var toRender = [];
	var workerId = 0;
	var sceneId = 0;

	console.log('%cSpinning off ' + this.workers + ' Workers ', 'font-size: 20px; background: black; color: white; font-family: monospace;');

	this.setWorkers = function(w) 
	{
		this.workers = w || navigator.hardwareConcurrency || 4;

		while (this.pool.length < this.workers) 
		{
			var worker = new THREE.RaytracingRendererWorker(this.blockWidth, this.blockHeight, this.context);
			worker.id = workerId ++;

			worker.color = new THREE.Color().setHSL( Math.random(), 0.8, 0.8 ).getHexString();
			this.pool.push(worker);

			this.updateSettings(worker);

			if (this.renderering) 
			{
				worker.initScene(sceneJSON, cameraJSON, materials, sceneId);
				this.renderNext(worker);
			}
		}

		if (!this.renderering) 
		{
			while (this.pool.length > this.workers) 
			{
				this.pool.pop().terminate();
			}
		}
	};

	this.setClearColor = function ( color /*, alpha */ ) 
	{
		clearColor.set( color );
	};

	// probably to override parent functions
	this.clear = function () {};
	this.setPixelRatio = function () {};

	this.updateSettings = function(worker) 
	{
		worker.init(canvasWidth, canvasHeight, worker.id);
	};

	this.setSize = function (width, height) 
	{
		canvas.width = width;
		canvas.height = height;

		canvasWidth = canvas.width;
		canvasHeight = canvas.height;

		this.context.fillStyle = 'white';

		for (var i=0; i<this.pool.length; i++)
		{
			var workerObj = this.pool[i];

			this.updateSettings(workerObj);
		}
	};

	//

	var xblocks;
	var yblocks;	

	this.renderNext = function(worker) 
	{
		if (!toRender.length) 
		{
			this.renderering = false;
			return this.dispatchEvent( { type: "complete" } );
		}

		var current = toRender.pop();
		var blockX = ( current % xblocks ) * this.blockWidth;
		var blockY = ( current / xblocks | 0 ) * this.blockHeight;

		this.context.fillStyle = '#' + worker.color;
		this.context.fillRect(blockX, blockY, this.blockWidth, this.blockHeight);

		worker.startRendering(blockX, blockY);		
	};

	var materials = {};
	var sceneJSON;
	var cameraJSON;

	// additional properties that were not serialize automatically

	var _annex = {
		mirror: 1,
		reflectivity: 1,
		refractionRatio: 1,
		glass: 1
	};

	this.serializeObject = function(o) 
	{
		var mat = o.material;

		if (!mat || mat.uuid in materials) return;

		var props = {};
		for ( var m in _annex ) 
		{
			if ( mat[ m ] !== undefined ) 
			{
				props[ m ] = mat[ m ];
			}
		}

		materials[mat.uuid] = props;
	};

	this.render = function(scene, camera) 
	{
		this.renderering = true;

		// update scene graph

		if ( scene.autoUpdate === true ) scene.updateMatrixWorld();

		// update camera matrices

		if ( camera.parent === null ) camera.updateMatrixWorld();

		sceneJSON = scene.toJSON();
		cameraJSON = camera.toJSON();
		++ sceneId;

		scene.traverse(this.serializeObject);

		for(var i=0; i<this.pool.length; i++)
		{
			var workerObj = this.pool[i];
			workerObj.initScene(sceneJSON, cameraJSON, materials, sceneId);
		}

		this.context.clearRect(0, 0, canvasWidth, canvasHeight);

		xblocks = Math.ceil(canvasWidth / this.blockWidth);
		yblocks = Math.ceil(canvasHeight / this.blockHeight);
		var totalBlocks = xblocks * yblocks;

		toRender = [];

		for (var i = 0; i < totalBlocks; i++) 
		{
			toRender.push( i );
		}

		// Randomize painting :)

		if (this.randomize) 
		{
			for (var i = 0; i < totalBlocks; i++) 
			{
				var swap = Math.random() * totalBlocks | 0;
				var tmp = toRender[ swap ];
				toRender[ swap ] = toRender[ i ];
				toRender[ i ] = tmp;
			}
		}

		for (var i=0; i<this.pool.length; i++)
		{
			var workerObj = this.pool[i];

			this.renderNext(workerObj);
		}
	};

	this.init = function()
	{
		this.setWorkers(this.workers);
		this.setSize(canvas.width, canvas.height);
	};
	this.init();
};

Object.assign( THREE.RaytracingRenderer.prototype, THREE.EventDispatcher.prototype );
