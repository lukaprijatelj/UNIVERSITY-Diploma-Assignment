importScripts('../constants.js');
importScripts('../../externals/namespace-core/namespace-core.js');

importScripts('../threejs/three.js');
importScripts('./RaytracingWorker.js');



// only accesible in web worker thread
var worker = null;
var canvasWidth = -1;
var canvasHeight = -1;
var cell = null;

var mainThread = new namespace.core.MainThread();

mainThread.onWorkerFunction('init', (data) =>
{
	worker = new RaytracingRendererWorker((workerIndex, buffer, cell, timeMs) =>
	{
		let data = 
		{
			workerIndex: workerIndex,
			buffer: buffer,
			cell: cell,
			timeMs: timeMs
		};
		mainThread.mainFunction('renderCell', data);
	}, data.workerIndex, data.near, data.far);
	worker.init(data.canvasWidth, data.canvasHeight);
});

mainThread.onWorkerFunction('setCell', (data) =>
{
	cell = data.cell;
	worker.setCell(cell);
});

mainThread.onWorkerFunction('initScene', (data) =>
{
	worker.initScene(data.sceneJSON, data.cameraJSON, data.materials);
});

mainThread.onWorkerFunction('startRendering', (data) =>
{
	worker.render();
});