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
	this.cellsWaiting = null;
	
	/**
	 * Cells that are done rendering.
	 */
	this.cellsDone = null;

	this.threads = null;	

	/**
	 * Additional properties that were not serialize automatically
	 */
	this.scene = null;
	this.sceneJSON = null;

	/**
	 * Additional properties that were not serialize automatically
	 */
	this.camera = null;
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
RaytracingRenderer.prototype.onCellRendered = function(threadIndex, buffer, basicCell, timeMs)
{
	let _this = this;

	console.log('[RaytracingRenderer] Block done rendering (' + timeMs + ' ms)!');

	let thread = _this.threads[threadIndex];
	thread.isRendering = false;
	
	// remove rendering flag
	globals.rendererCanvas.hideThreadCell(thread.cell);


	// -----------------------------
	// prepare SharedCell for sending to server
	// -----------------------------

	let sharedCell = new namespace.database.SharedCell(basicCell.startX, basicCell.startY, basicCell.width, basicCell.height);

	// convert buffer data into PNG image data
	sharedCell.imageData = HTMLImageElement.toPNGString(buffer, basicCell.width, basicCell.height);

	// update image of the cell on the canvas
	ClientPage.tryUpdatingCell(sharedCell);

	_this.cellsDone.push(sharedCell);

	
	// -----------------------------
	// continue rendering next cell in queue
	// -----------------------------

	if (Array.isEmpty(_this.cellsWaiting) == false)
	{
		// work is not yet done
		_this._runThread(thread);

		return;
	}
	
	if (_this.areWorkersDone())
	{
		ClientPage.onRendererDone(_this.cellsDone);	
	}
};

/**
 * Sets threads.
 */
RaytracingRenderer.prototype.setWorkers = function() 
{
	let _this = this;

	if (options.MAX_THREADS < 1)
	{
		new Exception.ValueInvalid('Max threads option must be larger than 0!');
	}

	_this.threads = new StaticArray(options.MAX_THREADS);

	for (let i=0; i<_this.threads.length; i++)
	{
		let data = 
		{
			threadIndex: i,
			canvasWidth: options.CANVAS_WIDTH,
			canvasHeight: options.CANVAS_HEIGHT,
			options: options		
		};

		let thread = new namespace.core.Thread('./scripts/ray-tracing-web-worker/RaytracingWebWorker.js');
		_this.threads[i] = thread;

		thread.index = i;
		thread.isRendering = false;		

		thread.cell = new namespace.database.ThreadCell(thread.index);
		globals.rendererCanvas.addThreadCell(i);

		thread.workerFunction('init', data);			
	}
};

/**
 * Cell was rendered. It needs to be drawn too.
 * @static
 */
RaytracingRenderer.renderCell = function(data)
{
	let _this = this;
	_this.onCellRendered(data.threadIndex, data.buffer, data.cell, data.timeMs);
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
};

/**
 * Initializes scene.
 */
RaytracingRenderer.prototype.initScene = function()
{
	let _this = this;

	for (let i=0; i<_this.threads.length; i++)
	{
		let thread = _this.threads[i];
		
		thread.workerFunction('worker.initScene', _this.sceneJSON);		
	}	
};

/**
 * Initializes scene.
 */
RaytracingRenderer.prototype.initCamera = function()
{
	let _this = this;

	for (let i=0; i<_this.threads.length; i++)
	{
		let thread = _this.threads[i];
		
		thread.workerFunction('worker.initCamera', _this.cameraJSON);		
	}	
};

/**
 * Initializes scene.
 */
RaytracingRenderer.prototype.initLights = function()
{
	let _this = this;

	for (let i=0; i<_this.threads.length; i++)
	{
		let thread = _this.threads[i];
		
		thread.workerFunction('worker.initLights');
	}	
};

/**
 * Starts rendering.
 */
RaytracingRenderer.prototype.setWaitingCells = function(cellsWaiting) 
{
	let _this = this;

	if (!cellsWaiting)
	{
		new Exception.ValueUndefined('Waiting cells must be defined!');
	}

	if (Array.isEmpty(cellsWaiting))
	{
		new Exception.ArrayEmpty('There is cells waiting to be rendered!');
	}

	_this.cellsWaiting = cellsWaiting;	
	_this.cellsDone = new Array();

	for (let i=0; i<_this.cellsWaiting.length; i++)
	{
		let current = _this.cellsWaiting[i];

		globals.rendererCanvas.addWaitingCell(current);
	}
};

/**
 * Stops rendering process.
 */
RaytracingRenderer.prototype.clearWaitingCells = function()
{
	let _this = this;	

	if (!_this.cellsWaiting)
	{
		return;
	}

	for (let i=0; i<_this.cellsWaiting.length; i++)
	{
		let current = _this.cellsWaiting[i];

		globals.rendererCanvas.removeWaitingCell(current);
	}

	_this.cellsWaiting = null;
};

/**
 * Starts rendering.
 */
RaytracingRenderer.prototype.startRendering = function() 
{
	let _this = this;

	if (!_this.threads)
	{
		new Exception.ValueUndefined('There is no threads to run!');
	}

	if (Array.isEmpty(_this.threads))
	{
		new Exception.ArrayEmpty('There is no threads to run!');
	}

	for (let i=0; i<_this.threads.length; i++)
	{
		let current = _this.threads[i];
	
		_this._runThread(current);
	}	
};

/**
 * Stops rendering process.
 */
RaytracingRenderer.prototype.stopRendering = function()
{
	let _this = this;	

	_this.clearWaitingCells();

	for (let i=0; i<_this.threads.length; i++)
	{
		let current = _this.threads[i];		
		
		current.isRendering = false;

		if (current.cell)
		{
			globals.rendererCanvas.hideThreadCell(current.cell);
		}

		current.workerFunction('stopRendering');
		current.terminate();
	};
};

/**
 * Starts rendering.
 * @private
 */
RaytracingRenderer.prototype._runThread = function(thread)
{
	let _this = this;

	if (!_this.cellsWaiting)
	{
		new Exception.ValueUndefined('Waiting cells must be defined!');
	}

	if (Array.isEmpty(_this.cellsWaiting))
	{
		new Exception.ArrayEmpty('There is no cells waiting to be rendered!');
	}

	let basicCell = _this.cellsWaiting.shift();
	globals.rendererCanvas.removeWaitingCell(basicCell);

	let threadCell = thread.cell;
	threadCell.startX = basicCell.startX;
	threadCell.startY = basicCell.startY;
	threadCell.width = basicCell.width;
	threadCell.height = basicCell.height;
	thread.workerFunction('worker.setCell', threadCell);
	globals.rendererCanvas.showThreadCell(threadCell);	
	
	thread.isRendering = true;
	thread.workerFunction('worker.startRendering');
};