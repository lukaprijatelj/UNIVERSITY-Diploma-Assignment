importScripts('./three.js');
importScripts('./RayTracingWorker.js');

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
			worker = new THREE.RaytracingRendererWorker((buffer, blockX, blockY, timeMs) =>
			{
				self.postMessage({
					type: 'renderCell',
					buffer: buffer,
					blockX: blockX,
					blockY: blockY,
					timeMs: timeMs,
					cell: cell
				});
			});
			canvasWidth = data.canvasWidth;
			canvasHeight = data.canvasHeight;
			worker.color = new THREE.Color().setHSL(Math.random(), 0.8, 0.8).getHexString();
			worker.init(canvasWidth, canvasHeight);
			break;

		case 'setCell':
			cell = data.cell;
			worker.setBlockSize(cell.width, cell.height);
			break;

		case 'initScene':
			worker.initScene(data.sceneJSON, data.cameraJSON, data.materials);
			break;

		case 'startRendering':
			worker.startRendering(cell.startX, cell.startY);
			break;
	}
};