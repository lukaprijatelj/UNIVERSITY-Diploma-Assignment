/**
 * RaytracingRenderer renders by raytracing it's scene. However, it does not
 * compute the pixels itself but it hands off and coordinates the tasks for workers.
 * The workers compute the pixel values and this renderer simply paints it to the Canvas.
 *
 * @author zz85 / http://github.com/zz85
 */
var RaytracingRenderer = function(canvas) 
{
	console.log('[RaytracingRenderer] Initializing renderer');

	this.canvas = canvas;
	this.domElement = canvas; // do not delete, this is only for referencing

	this.context = null;

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
		var renderer = this;

		console.log('[RaytracingRenderer] Block done rendering (' + timeMs + ' ms)!');
		
		var imagedata = new ImageData(new Uint8ClampedArray(buffer), renderer.cell.width, renderer.cell.height);

		var canvas = document.createElement('canvas');
		canvas.width  = renderer.cell.width;
		canvas.height = renderer.cell.height;
		canvas.getContext('2d').putImageData(imagedata, 0, 0);


		renderer.cell.imageData = canvas.toDataURL('image/png');

		

		GLOBALS.tryUpdatingCell(renderer.cell);
		renderer.updateFunction(renderer.cell, 100);
		
		// completed
		renderer.onCellRendered();
	};

	this.setWorkers = function() 
	{
		var renderer = this;

		var worker = new THREE.RaytracingRendererWorker(renderer.drawOnCanvas.bind(renderer));

		worker.color = new THREE.Color().setHSL(Math.random(), 0.8, 0.8).getHexString();

		renderer.worker = worker;
		renderer.updateSettings(worker);
	};

	/**
	 * Function is only for abstraction.
	 */
	this.setClearColor = function(color /*, alpha */ ) 
	{
		clearColor.set(color);
	};

	// probably to override parent functions
	this.clear = function () {};
	this.setPixelRatio = function () {};

	this.updateSettings = function(worker) 
	{
		var renderer = this;

		worker.init(renderer.canvas.width, renderer.canvas.height);
	};

	this.setSize = function () 
	{
		var renderer = this;

		renderer.updateSettings(this.worker);
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
		var renderer = this;

		renderer.renderering = true;

		// update scene graph

		if ( scene.autoUpdate === true ) scene.updateMatrixWorld();

		// update camera matrices

		if ( camera.parent === null ) camera.updateMatrixWorld();

		sceneJSON = scene.toJSON();
		cameraJSON = camera.toJSON();

		scene.traverse(renderer.serializeObject);

		renderer.worker.initScene(sceneJSON, cameraJSON, materials);		


		GLOBALS.rendererCanvas.flagRenderCell(renderer.cell);
		
		//this.context.fillRect(0, 0, this.cell.width, this.cell.height);

		renderer.tryRendering(renderer.cell.startX, renderer.cell.startY);
	};

	this.tryRendering = async function(startX, startY)
	{
		var renderer = this;

		renderer.worker.startRendering(startX, startY);
	};

	this.init = function()
	{
		var renderer = this;
		
		renderer.setWorkers();
		renderer.setSize();
	};
};

Object.assign(RaytracingRenderer.prototype, THREE.EventDispatcher.prototype);