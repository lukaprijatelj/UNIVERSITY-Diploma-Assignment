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

function init(data)
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
		mainThread.mainFunction('WebPage.renderer.renderCell', data);
	}, data.workerIndex);
	worker.init(data.canvasWidth, data.canvasHeight);
}

function setCell(data)
{
	cell = data.cell;
	worker.setCell(cell);
}

function initScene(data)
{
	worker.initScene(data.sceneJSON, data.cameraJSON);
}

function startRendering(data)
{
	worker.render();
}

function stopRendering(data)
{
	worker.render();
}