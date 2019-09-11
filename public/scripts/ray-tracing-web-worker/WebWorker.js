importScripts('../constants.js');
importScripts('../../externals/namespace-core/console.js');
importScripts('../../externals/namespace-core/Thread.js');

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
			type: 'renderCell',
			workerIndex: workerIndex,
			buffer: buffer,
			cell: cell,
			timeMs: timeMs
		};
		self.postMessage(data);
	}, data.workerIndex);
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