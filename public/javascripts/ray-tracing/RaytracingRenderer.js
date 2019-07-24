/**
 * RaytracingRenderer renders by raytracing it's scene. However, it does not
 * compute the pixels itself but it hands off and coordinates the tasks for workers.
 * The workers compute the pixel values and this renderer simply paints it to the Canvas.
 *
 * @author zz85 / http://github.com/zz85
 */
var RaytracingRenderer = function() 
{
	console.log('[RaytracingRenderer] Initializing renderer');

	this.canvas = null;
	this.domElement = canvas; // do not delete, this is only for referencing

	this.context = null;

	var canvasWidth;
	var canvasHeight;
	var clearColor = new THREE.Color(0x000000);

	// data for blockWidth, blockHeight, startX, startY
	this.cell = null;

	this.renderering = false;
	this.worker = [];
	this.autoClear = true;
	this.updateFunction = Function.Empty;
	this.onCellRendered = Function.Empty;

	this.setCell = function(cell)
	{
		this.cell = cell;
		this.worker.setBlockSize(cell.width, cell.height);
	};

	this.drawOnCanvas = function(buffer, blockX, blockY, timeMs)
	{
		console.log('[RaytracingRenderer] Block done rendering (' + timeMs + ' ms)!');
		
		var imagedata = new ImageData(new Uint8ClampedArray(buffer), this.cell.width, this.cell.height);

		var canvas = document.createElement('canvas');
		canvas.width  = this.cell.width;
		canvas.height = this.cell.height;
		canvas.getContext('2d').putImageData(imagedata, 0, 0);

		this.cell.imageData = canvas.toDataURL('image/png');

		GLOBALS.tryUpdatingCell(this.cell);
		this.updateFunction(this.cell, 100);
		
		// completed
		this.onCellRendered();
	};

	this.setWorkers = function() 
	{
		var worker = new THREE.RaytracingRendererWorker(this.drawOnCanvas.bind(this));

		worker.color = new THREE.Color().setHSL(Math.random(), 0.8, 0.8 ).getHexString();

		this.worker = worker;
		this.updateSettings(worker);
	};

	/**
	 * Function is only for abstraction.
	 */
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


		GLOBALS.layout.flagRenderCell(this.cell);
		
		//this.context.fillRect(0, 0, this.cell.width, this.cell.height);

		this.tryRendering(this.cell.startX, this.cell.startY);
	};

	this.tryRendering = async function(startX, startY)
	{
		this.worker.startRendering(startX, startY);
	};

	this.init = function()
	{
		this.setWorkers();
		this.setSize(this.canvas.width, this.canvas.height);
	};
};

Object.assign(RaytracingRenderer.prototype, THREE.EventDispatcher.prototype);