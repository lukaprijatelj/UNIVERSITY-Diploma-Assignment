/**
 * RaytracingRenderer renders by raytracing it's scene. However, it does not
 * compute the pixels itself but it hands off and coordinates the tasks for workers.
 * The workers compute the pixel values and this renderer simply paints it to the Canvas.
 *
 * @author zz85 / http://github.com/zz85
 */

THREE.RaytracingRenderer = function (canvasWidth, canvasHeight) 
{
	console.log('[THREE.RaytracingRenderer] Initializing renderer');

	this.cellV = null;
	this.context = null;

	var clearColor = new THREE.Color(0x000000);

	// data for blockWidth, blockHeight, startX, startY
	this.cell = null;

	this.renderering = false;
	
	this.webWorker = null;
	this.autoClear = true;

	this.setCell = function(cell)
	{
		this.cell = cell;
		this.cellV = document.getElementById('cell-' + cell._id);

		this.webWorker.postMessage({
			type: 'setCell',
			cell: cell
		});
	};

	/**
	 * Function is only for abstraction.
	 */
	this.setClearColor = function(color /*, alpha */) 
	{
		clearColor.set( color );
	};

	// probably to override parent functions
	this.clear = function () {};
	this.setPixelRatio = function () {};

	//

	var materials = {};
	var sceneJSON;
	var cameraJSON;

	// additional properties that were not serialize automatically

	var _annex = {
		mirror: 1,
		reflectivity: 1,
		refractionRatio: 1,
		glass: 1
	};

	this.serializeObject = function(o) 
	{
		var mat = o.material;

		if (!mat || mat.uuid in materials) return;

		var props = {};
		for ( var m in _annex ) 
		{
			if ( mat[ m ] !== undefined ) 
			{
				props[ m ] = mat[ m ];
			}
		}

		materials[mat.uuid] = props;
	};

	this.render = function(scene, camera) 
	{
		this.renderering = true;

		// update scene graph

		if ( scene.autoUpdate === true ) scene.updateMatrixWorld();

		// update camera matrices

		if ( camera.parent === null ) camera.updateMatrixWorld();

		sceneJSON = scene.toJSON();
		cameraJSON = camera.toJSON();

		scene.traverse(this.serializeObject);

		// cell gets background color, so that we know which cell is currently rendering
		this.cellV.style.background = '#FF4F49';

		this.webWorker.postMessage(
		{
			type: 'initScene',
			sceneJSON: sceneJSON,
			cameraJSON: cameraJSON,
			materials: materials
		});		
		this.webWorker.postMessage(
		{
			type: 'startRendering'
		});
	};

	this.init = function()
	{
		this.webWorker = new Worker('./javascripts/threejs/RayTracingWebWorker.js');
		this.webWorker.postMessage({
			type: 'init',
			canvasWidth: canvasWidth,
			canvasHeight: canvasHeight
		});
		this.webWorker.onmessage = (e) =>
		{
			var data = e.data;

			if (data.type != 'renderCell')
			{
				return;
			}

			var cell = this.cell;

			console.log('[THREE.RaytracingRenderer] Block done rendering (' + data.timeMs + ' ms)!');
	
			var imagedata = new ImageData(new Uint8ClampedArray(data.buffer), cell.width, cell.height);

			var canvas = document.createElement('canvas');
			canvas.width  = cell.width;
			canvas.height = cell.height;
			canvas.getContext('2d').putImageData(imagedata, 0, 0);

			cell.imageData = canvas.toDataURL('image/png');

			GLOBALS.drawOnCell(cell);

			GLOBALS.updateProgressAsync(cell, 100);
			GLOBALS.onCellRendered();
		};
	};
	this.init();
};

Object.assign(THREE.RaytracingRenderer.prototype, THREE.EventDispatcher.prototype);