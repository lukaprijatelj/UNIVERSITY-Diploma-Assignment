/**
 * RaytracingRenderer renders by raytracing it's scene. However, it does not
 * compute the pixels itself but it hands off and coordinates the tasks for workers.
 * The worker compute the pixel values and this renderer simply paints it to the Canvas.
 *
 * @author zz85 / http://github.com/zz85
 * @author lukaprijatelj / http://github.com/lukaprijatelj 
 */
var RaytracingRenderer = function() 
{
	console.log('[RaytracingRenderer] Initializing renderer');

	this.context = null;

	/**
	 * Cells that will be rendered.
	 */
	this.cellsWaiting = new Array();
	
	/**
	 * Cells that will be rendered.
	 */
	this.cellsRendering = new Array();

	/**
	 * Cells that are done rendering.
	 */
	this.cellsDone = new Array();

	this.threads = null;

	this.scene = null;
	this.camera = null;

	/**
	 * Additional properties that were not serialize automatically
	 */
	this.sceneJSON = null;
	this.cameraJSON = null;

	/**
	 * Event handlers.
	 */
	this.renderCell = RaytracingRenderer.renderCell.bind(this);

	this._init();
};

Object.assign(RaytracingRenderer.prototype, THREE.EventDispatcher.prototype);


/**
 * Initializes object.
 * @private
 */
RaytracingRenderer.prototype._init = function()
{
	let _this = this;

	_this.scene = globals.scene;
	_this.camera = globals.camera;

	_this.setWorkers();
};

/**
 * Checks if renderer is done with work.
 */
RaytracingRenderer.prototype.areWorkersDone = function()
{
	let _this = this;

	for (let i=0; i<_this.threads.length; i++)
	{
		let current = _this.threads[i];

		if (current.isRendering == true)
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

	let webWorker = _this.threads[workerIndex];
	webWorker.isRendering = false;
	webWorker.cell = null;
	
	// -----------------------------
	// convert buffer data into png image data
	// -----------------------------

	cell.imageData = HTMLImageElement.toPNGString(buffer, cell.width, cell.height);

	// update image of the cell on the canvas
	ClientPage.tryUpdatingCell(cell);

	// remove rendering flag
	globals.rendererCanvas.unsetWorkerCell(cell);

	//_this.cellsRendering = Array.remove(_this.cellsRendering, cell);
	_this.cellsDone.push(cell);

	
	// -----------------------------
	// continue rendering next cell in queue
	// -----------------------------

	if (Array.isEmpty(_this.cellsWaiting) == false)
	{
		// work is not yet done
		_this._runWorker(webWorker);

		return;
	}
	
	if (_this.areWorkersDone())
	//if (Array.isEmpty(_this.cellsRendering))
	{
		ClientPage.onRendererDone(_this.cellsDone);	
			
		_this.cellsDone = new Array();
	}
};

/**
 * Sets threads.
 */
RaytracingRenderer.prototype.setWorkers = function() 
{
	let _this = this;

	_this.threads = new StaticArray(options.NUM_OF_WORKERS);

	for (let i=0; i<_this.threads.length; i++)
	{
		let data = 
		{
			workerIndex: i,
			canvasWidth: options.CANVAS_WIDTH,
			canvasHeight: options.CANVAS_HEIGHT,
			options: options		
		};

		let thread = new namespace.core.Thread('./scripts/ray-tracing-web-worker/RaytracingWebWorker.js');
		thread.isRendering = false;
		thread.workerIndex = i;
		thread.workerFunction('init', data);	

		globals.rendererCanvas.addWorkerCell(i);

		_this.threads[i] = thread;
	}
};

/**
 * Cell was rendered. It needs to be drawn too.
 * @static
 */
RaytracingRenderer.renderCell = function(data)
{
	let _this = this;
	_this.onCellRendered(data.workerIndex, data.buffer, data.cell, data.timeMs);
};

/**
 * Stops rendering process.
 */
RaytracingRenderer.prototype.stopRendering = function()
{
	let _this = this;	

	for (let i=0; i<_this.cellsWaiting.length; i++)
	{
		let current = _this.cellsWaiting[i];

		globals.rendererCanvas.removeRenderCell(current);
	}

	for (let i=0; i<_this.threads.length; i++)
	{
		let current = _this.threads[i];		
		
		current.isRendering = false;

		if (current.cell)
		{
			globals.rendererCanvas.removeRenderCell(current.cell);
		}

		current.workerFunction('stopRendering');
		current.terminate();
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

		for (let i=0; i<_this.threads.length; i++)
		{
			let thread = _this.threads[i];
			
			thread.workerFunction('initScene', options);		
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

	for (let i=0; i<_this.cellsWaiting.length; i++)
	{
		let current = _this.cellsWaiting[i];

		globals.rendererCanvas.addRenderCell(current);
	}

	for (let i=0; i<_this.threads.length; i++)
	{
		let current = _this.threads[i];
	
		_this._runWorker(current);
	}	
};

/**
 * Starts rendering.
 * @private
 */
RaytracingRenderer.prototype._runWorker = function(thread)
{
	let _this = this;

	let threadCell = _this.cellsWaiting.shift();

	//_this.cellsRendering.push(threadCell);

	threadCell.workerIndex = thread.workerIndex;
	thread.cell = threadCell;
	globals.rendererCanvas.setWorkerCell(threadCell);

	thread.workerFunction('setCell', { cell: threadCell });
	
	thread.isRendering = true;

	thread.workerFunction('startRendering');
};