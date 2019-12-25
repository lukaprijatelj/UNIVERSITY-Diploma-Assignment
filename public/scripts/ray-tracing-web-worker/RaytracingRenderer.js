/**
 * RaytracingRenderer renders by raytracing it's scene. However, it does not
 * compute the pixels itself but it hands off and coordinates the tasks for workers.
 * The worker compute the pixel values and this renderer simply paints it to the Canvas.
 *
 * @author erichlof / https://github.com/erichlof
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

	this.state = 'idle';

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

	this.onCellRendered = this.onCellRendered.bind(this);
	this.checkRenderingState = this.checkRenderingState.bind(this);

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
RaytracingRenderer.prototype.onCellRendered = function(thread, sharedCell)
{
	let _this = this;

	thread.isRendering = false;

	// remove rendering flag
	globals.rendererCanvas.hideThreadCell(thread);

	// -----------------------------
	// prepare SharedCell for sending to server
	// -----------------------------

	cache.cells[sharedCell.index] = sharedCell;
	_this.cellsDone.push(sharedCell);


	if (Array.isEmpty(_this.cellsWaiting) == false)
	{
		// work is not yet done - continue rendering next cell in queue
		_this._runThread(thread);

		return;
	}
	
	if (_this.areWorkersDone() == false)
	{
		return;
	}

	// last thread has finished rendering

	_this.cellsDone.sort((a, b) =>
	{
		if (a.index < b.index)
		{
			return -1;
		}
		else if (a.index > b.index)
		{
			return 1;
		}
		return 0;
	});

	ClientPage.onRendererDone(_this.cellsDone);	
};

/**
 * Checks if rendering state is running or paused.
 */
RaytracingRenderer.prototype.checkRenderingState = function(thread, data, resolve, reject)
{
	let _this = this;

	globals.rendererCanvas.updateThreadCellImage(data);

	if (API.renderingServiceState == namespace.enums.renderingServiceState.PAUSED)
	{
		thread.resolve = resolve;
		thread.reject = reject;

		globals.rendererCanvas.pauseThreadCell(thread);
	}
	else
	{
		resolve();
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

	_this.threads = new Array(options.MAX_THREADS);

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
		thread.cellId = 'thread-' + i + '-cell';
		thread.isRendering = false;		
		thread.cell = null;

		globals.rendererCanvas.addThreadCell(thread);

		thread.invoke('init', data);			
	}
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
		
		thread.invoke('worker.initScene', _this.sceneJSON);		
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
		
		thread.invoke('worker.initCamera', _this.cameraJSON);		
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
		
		thread.invoke('worker.initLights');
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
		new Exception.ArrayEmpty('There is no cells waiting to be rendered!');
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
RaytracingRenderer.prototype.clearOthersCells = function()
{
	let _this = this;	

	for (let i=0; i<cache.cells.length; i++)
	{
		let current = cache.cells[i];

		if (!current.socketIoClient)
		{
			continue;
		}
		
		if (current.progress == 100)
		{
			continue;
		}
		
		globals.rendererCanvas.removeOthersCell(current);
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

	let minLength = _this.threads.length;

	if (_this.cellsWaiting.length < _this.threads.length)
	{
		new Warning.Other('Max threads larger than number of waiting cells! Setting num of threads to be same as num of waiting cells.');
		minLength = _this.cellsWaiting.length;
	}

	for (let i=0; i<minLength; i++)
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

	_this.clearOthersCells();

	for (let i=0; i<_this.threads.length; i++)
	{
		let current = _this.threads[i];		
		
		current.isRendering = false;

		globals.rendererCanvas.removeThreadCell(current);

		current.terminate();
	};
};

/**
 * Stops rendering process.
 */
RaytracingRenderer.prototype.resumeRendering = function()
{
	let _this = this;	

	for (let i=0; i<_this.threads.length; i++)
	{
		let current = _this.threads[i];	
		
		globals.rendererCanvas.resumeThreadCell(current);

		if (current.resolve)
		{
			current.resolve();

			current.resolve = null;
			current.reject = null;
		}		
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

	let sharedCell = _this.cellsWaiting.shift();
	globals.rendererCanvas.removeWaitingCell(sharedCell);

	thread.cell = sharedCell;
	thread.invoke('worker.setCell', thread.cell);
	
	globals.rendererCanvas.showThreadCell(thread);	

	if (thread.index == 0 && options.AUTO_SCROLL_TO_RENDERING_AREA == true)
	{
		globals.rendererCanvas.scrollToCell(thread);	
	}
	
	thread.isRendering = true;
	thread.invoke('worker.startRendering');
};