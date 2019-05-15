/**
 * RaytracingRenderer renders by raytracing it's scene. However, it does not
 * compute the pixels itself but it hands off and coordinates the tasks for workers.
 * The workers compute the pixel values and this renderer simply paints it to the Canvas.
 *
 * @author zz85 / http://github.com/zz85
 */

THREE.RaytracingRenderer = function (canvas, cell, shouldRandomize, alpha) 
{
	console.log('[THREE.RaytracingRenderer] Initializing renderer');

	this.canvas = canvas;
	this.domElement = canvas; // do not delete, this is only for referencing
	this.context = canvas.getContext('2d', {
		alpha: alpha === true
	});

	var canvasWidth;
	var canvasHeight;
	var clearColor = new THREE.Color(0x000000);

	// data for blockWidth, blockHeight, startX, startY
	this.cell = cell;

	this.renderering = false;
	this.worker = [];
	this.autoClear = true;
	this.randomize = shouldRandomize;

	this.drawOnCanvas = function(buffer, blockX, blockY, timeMs)
	{
		console.log('[THREE.RaytracingRenderer] Block done rendering (' + timeMs + ' ms)!');
		
		var imagedata = new ImageData(new Uint8ClampedArray(buffer), this.cell.width, this.cell.height);

		var cellCanvasV = HTML('#cell-' + this.cell._id);
		var cellCanvasContext = cellCanvasV.elements[0].getContext('2d', { alpha: alpha === true });
		cellCanvasContext.putImageData(imagedata, blockX, blockY);

		cellCanvasV.removeClass('active');

		// completed

		//renderNext( this );
	};

	this.setWorkers = function() 
	{
		var worker = new THREE.RaytracingRendererWorker(this.cell.width, this.cell.height, this.drawOnCanvas.bind(this));

		worker.color = new THREE.Color().setHSL( Math.random(), 0.8, 0.8 ).getHexString();

		this.worker = worker;
		this.updateSettings(worker);
	};

	this.setClearColor = function(color /*, alpha */ ) 
	{
		clearColor.set( color );
	};

	// probably to override parent functions
	this.clear = function () {};
	this.setPixelRatio = function () {};

	this.updateSettings = function(worker) 
	{
		worker.init(canvasWidth, canvasHeight);
	};

	this.setSize = function (width, height) 
	{
		this.canvas.width = width;
		this.canvas.height = height;

		canvasWidth = this.canvas.width;
		canvasHeight = this.canvas.height;

		this.context.fillStyle = 'white';
		this.updateSettings(this.worker);
	};

	//

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

		scene.traverse(this.serializeObject);

		this.worker.initScene(sceneJSON, cameraJSON, materials);
		this.context.clearRect(0, 0, canvasWidth, canvasHeight);
	
		this.context.fillStyle = '#' + this.worker.color;
		this.context.fillRect(this.cell.startX, this.cell.startY, this.cell.width, this.cell.height);
		var bindedRender = function()
		{ 
			this.worker.startRendering(this.cell.startX, this.cell.startY)
		};

		window.setTimeout(bindedRender.bind(this),0);
	};

	this.init = function()
	{
		this.setWorkers();
		this.setSize(this.canvas.width, this.canvas.height);
	};
	this.init();
};

Object.assign(THREE.RaytracingRenderer.prototype, THREE.EventDispatcher.prototype);