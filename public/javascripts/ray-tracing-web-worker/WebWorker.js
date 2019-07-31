importScripts('../threejs/three.js');
importScripts('./RaytracingWorker.js');


// only accesible in web worker thread
var worker = null;
var canvasWidth = -1;
var canvasHeight = -1;
var cell = null;

self.onmessage = function(e) 
{
	var data = e.data;

	switch(data.type)
	{
		case 'init':
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
			//worker.color = new THREE.Color().setHSL(Math.random(), 0.8, 0.8).getHexString();
			worker.init(data.canvasWidth, data.canvasHeight);
			break;

		case 'setCell':
			cell = data.cell;
			worker.setCell(cell);
			break;

		case 'initScene':
			worker.initScene(data.sceneJSON, data.cameraJSON, data.images, data.materials);
			break;

		case 'startRendering':
			worker.startRendering();
			break;
	}
};