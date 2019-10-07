/**
 * RaytracingRenderer renders by raytracing it's scene. However, it does not
 * compute the pixels itself but it hands off and coordinates the tasks for workers.
 * The worker compute the pixel values and this renderer simply paints it to the Canvas.
 *
 * @author zz85 / http://github.com/zz85
 */
var RaytracingRenderer = function(canvas, scene, camera) 
{
	console.log('[RaytracingRenderer] Initializing renderer');

	this.canvas = canvas;
	this.domElement = canvas; // do not delete, this is only for referencing
	this.context = null;

	this.scene = scene;
	this.camera = camera;

	/**
	 * Cells that will be rendered.
	 */
	this.cellsWaiting = new Array();
	
	/**
	 * Cells that are done rendering.
	 */
	this.cellsDone = new Array();

	this.numOfWorkers = 1;
	this.workers = new StaticArray(this.numOfWorkers);

	/**
	 * Additional properties that were not serialize automatically
	 */
	this.sceneJSON;
	this.cameraJSON;

	/**
	 * Event handlers.
	 */
	this.renderCell = this.renderCell.bind(this);

	this.init();
};

Object.assign(RaytracingRenderer.prototype, THREE.EventDispatcher.prototype);


/**
 * Checks if renderer is done with work.
 */
RaytracingRenderer.prototype.areWorkersDone = function()
{
	let _this = this;

	for (let i=0; i<_this.workers.length; i++)
	{
		let current = _this.workers[i];

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
	let _this = this;

	console.log('[RaytracingRenderer] Block done rendering (' + timeMs + ' ms)!');

	let webWorker = _this.workers[workerIndex];
	webWorker.isRendering = false;
	webWorker.cell = null;
	
	// -----------------------------
	// convert buffer data into png image data
	// -----------------------------

	cell.imageData = Image.toPNGString(buffer, cell.width, cell.height);

	WebPage.tryUpdatingCell(cell);

	_this.cellsDone.push(cell);

	
	// -----------------------------
	// continue rendering next cell in queue
	// -----------------------------

	if (_this.cellsWaiting.isEmpty())
	{
		if (_this.areWorkersDone())
		{
			WebPage.onRendererDone(_this.cellsDone);	
				
			_this.cellsDone = new Array();
		}
	}
	else
	{
		_this._runWorker(webWorker);
	}		
};


/**
 * Sets workers.
 */
RaytracingRenderer.prototype.setWorkers = function() 
{
	let _this = this;

	for (let i=0; i<_this.numOfWorkers; i++)
	{
		let data = 
		{
			workerIndex: i,
			canvasWidth: _this.canvas.width,
			canvasHeight: _this.canvas.height		
		};

		let thread = new namespace.core.Thread('./scripts/ray-tracing-web-worker/WebWorker.js');
		thread.isRendering = false;
		thread.workerFunction('init', data);	
		_this.workers[i] = thread;
	}
};


RaytracingRenderer.prototype.renderCell = function(data)
{
	let _this = this;
	_this.onCellRendered(data.workerIndex, data.buffer, data.cell, data.timeMs);
};


RaytracingRenderer.prototype.stopRendering = function()
{
	let _this = this;	

	for (let i=0; i<_this.numOfWorkers; i++)
	{
		let thread = _this.workers[i];

		thread.isRendering = false;

		if (thread.cell)
		{
			WebPage.rendererCanvas.unflagRenderCell(thread.cell);
		}		

		thread.workerFunction('stopRendering');
		thread.terminate();
	};
};


/**
 * probably to override parent functions
 */
RaytracingRenderer.prototype.setPixelRatio = Function.empty;


/**
 * Starts rendering.
 */
RaytracingRenderer.prototype.prepareJsonData = function() 
{
	return new Promise((resolve, reject) =>
	{	
		let _this = this;

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

		let options = 
		{
			sceneJSON: _this.sceneJSON,
			cameraJSON: _this.cameraJSON
		};

		for (let i=0; i<_this.workers.length; i++)
		{
			let worker = _this.workers[i];
			
			worker.workerFunction('initScene', options);		
		}	

		resolve();
	});				
};


/**
 * Starts rendering.
 */
RaytracingRenderer.prototype.render = function(cellsWaiting) 
{
	let _this = this;

	_this.cellsWaiting = cellsWaiting;	

	for (let i=0; i<_this.workers.length; i++)
	{
		let worker = _this.workers[i];
	
		_this._runWorker(worker);
	}	
};


/**
 * Starts rendering.
 */
RaytracingRenderer.prototype._runWorker = function(worker)
{
	let _this = this;

	let cellToRender = _this.cellsWaiting.shift();

	worker.cell = cellToRender;
	WebPage.rendererCanvas.flagRenderCell(cellToRender);
	worker.workerFunction('setCell', { cell: cellToRender });
	
	worker.isRendering = true;

	worker.workerFunction('startRendering');
};


/**
 * Initializes object.
 */
RaytracingRenderer.prototype.init = function()
{
	let _this = this;

	_this.setWorkers();
};