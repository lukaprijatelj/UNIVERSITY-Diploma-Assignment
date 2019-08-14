/**
 * RaytracingRenderer renders by raytracing it's scene. However, it does not
 * compute the pixels itself but it hands off and coordinates the tasks for workers.
 * The worker compute the pixel values and this renderer simply paints it to the Canvas.
 *
 * @author zz85 / http://github.com/zz85
 */
var RaytracingRenderer = function(canvas) 
{
	console.log('[RaytracingRenderer] Initializing renderer');

	this.canvas = canvas;
	this.domElement = canvas; // do not delete, this is only for referencing
	this.context = null;

	this.scene = null;
	this.camera = null;

	/**
	 * Cells that will be rendered.
	 */
	this.cellsWaiting = [];
	
	/**
	 * Cells that are done rendering.
	 */
	this.cellsDone = [];

	this.workers = [];
	this.numOfWorkers = 1;

	/**
	 * Additional properties that were not serialize automatically
	 */
	this.materials = {};
	this.sceneJSON;
	this.cameraJSON;
	this.images = {};
	this._annex = 
	{
		mirror: 1,
		reflectivity: 1,
		refractionRatio: 1,
		glass: 1
	};	
};

Object.assign(RaytracingRenderer.prototype, THREE.EventDispatcher.prototype);


/**
 * Checks if renderer is done with work.
 */
RaytracingRenderer.prototype.areWorkersDone = function()
{
	for (let i=0; i<this.workers.length; i++)
	{
		var current = this.workers[i];

		if (current.isRendering)
		{
			return false;
		}
	}

	return true;
};


/**
 * Cell was calculated and now can be drawn on canvas.
 */
RaytracingRenderer.prototype.onCellRendered = function(workerIndex, buffer, cell, timeMs)
{
	var renderer = this;

	console.log('[RaytracingRenderer] Block done rendering (' + timeMs + ' ms)!');

	var webWorker = renderer.workers[workerIndex];
	webWorker.isRendering = false;
	
	// -----------------------------
	// convert buffer data into png image data
	// -----------------------------

	var imagedata = new ImageData(new Uint8ClampedArray(buffer), cell.width, cell.height);
	var canvas = document.createElement('canvas');
	canvas.width  = cell.width;
	canvas.height = cell.height;
	canvas.getContext('2d').putImageData(imagedata, 0, 0);
	cell.imageData = canvas.toDataURL('image/png');

	GLOBALS.tryUpdatingCell(cell);

	renderer.cellsDone.push(cell);

	
	// -----------------------------
	// continue rendering next cell in queue
	// -----------------------------

	if (renderer.cellsWaiting.isEmpty())
	{
		if (renderer.areWorkersDone())
		{
			GLOBALS.onRendererDone(renderer.cellsDone);	
				
			renderer.cellsDone = [];
		}
	}
	else
	{
		renderer._runWorker(webWorker);
	}		
};


/**
 * Sets workers.
 */
RaytracingRenderer.prototype.setWorkers = function() 
{
	var renderer = this;

	for (let i=0; i<renderer.numOfWorkers; i++)
	{
		var worker = new Worker('./javascripts/ray-tracing-web-worker/WebWorker.js');
		worker.isRendering = false;
		worker.postMessage({
			type: 'init',
			workerIndex: i,
			canvasWidth: renderer.canvas.width,
			canvasHeight: renderer.canvas.height
		});
	
		worker.onmessage = (e) =>
		{
			var data = e.data;
	
			if (data.type != 'renderCell')
			{
				return;
			}
	
			renderer.onCellRendered(data.workerIndex, data.buffer, data.cell, data.timeMs);
		};
	
		renderer.workers.push(worker);
	}
};

/**
 * probably to override parent functions
 */
RaytracingRenderer.prototype.clear = function () {};


/**
 * probably to override parent functions
 */
RaytracingRenderer.prototype.setPixelRatio = function () {};


/**
 * Serializes materials.
 */
RaytracingRenderer.prototype.serializeObject = function(o) 
{
	var mat = o.material;

	if (!mat || mat.uuid in this.materials) return;

	var props = {};

	for ( var m in this._annex ) 
	{
		if ( mat[ m ] !== undefined ) 
		{
			props[ m ] = mat[ m ];
		}
	}

	this.materials[mat.uuid] = props;
};


/**
 * Starts rendering.
 */
RaytracingRenderer.prototype.prepareJsonData = function(callback) 
{
	var _this = this;

	// update scene graph

	if (_this.scene.autoUpdate === true) 
	{
		_this.scene.updateMatrixWorld();
	}

	// update camera matrices

	if (_this.camera.parent === null) 
	{
		_this.camera.updateMatrixWorld();
	}

	_this.sceneJSON = _this.scene.toJSON();
	_this.cameraJSON = _this.camera.toJSON();	

	_this.scene.traverse(_this.serializeObject.bind(_this));

	_this.images = {};

	for (let i=0; i<_this.workers.length; i++)
	{
		var worker = _this.workers[i];
		
		worker.postMessage(
		{
			type: 'initScene',
			sceneJSON: _this.sceneJSON,
			cameraJSON: _this.cameraJSON,
			images: _this.images,
			materials: _this.materials
		});		
	}	

	callback();

	/*GltfLoader.loadTextures(_this.sceneJSON.images, _this.images, () =>
	{
		console.log('[GltfLoader] Textures loaded');

		for (let i=0; i<_this.workers.length; i++)
		{
			var worker = _this.workers[i];
			
			worker.postMessage(
			{
				type: 'initScene',
				sceneJSON: _this.sceneJSON,
				cameraJSON: _this.cameraJSON,
				images: _this.images,
				materials: _this.materials
			});		
		}	

		callback();
	});*/
};


/**
 * Starts rendering.
 */
RaytracingRenderer.prototype.render = function(cellsWaiting) 
{
	var _this = this;

	_this.cellsWaiting = cellsWaiting;	

	for (let i=0; i<_this.workers.length; i++)
	{
		var worker = _this.workers[i];
	
		_this._runWorker(worker);
	}	
};


/**
 * Starts rendering.
 */
RaytracingRenderer.prototype._runWorker = function(worker)
{
	var renderer = this;

	var cellToRender = renderer.cellsWaiting.pop();

	GLOBALS.rendererCanvas.flagRenderCell(cellToRender);

	worker.postMessage({ type: 'setCell', cell: cellToRender });
	
	worker.isRendering = true;
	worker.postMessage({ type: 'startRendering' });
};


/**
 * Initializes object.
 */
RaytracingRenderer.prototype.init = function()
{
	var renderer = this;

	renderer.setWorkers();
};