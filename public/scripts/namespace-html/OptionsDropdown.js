var _this = this;

if (typeof _this.namespace == 'undefined')
{
    _this.namespace = new Object();
}

if (typeof namespace.html == 'undefined')
{
    namespace.html = new Object();
}

namespace.html.OptionsDropdown = (() =>
{
	var OptionsDropdown = function()
	{
		// -----------------------------
		// calculate position of the dropdown
		// -----------------------------
		
		let dropdown = new namespace.html.Dropdown();
		dropdown.setAttribute('id', 'options-dropdown');
		
		let wrapper = new namespace.html.Wrapper();
		dropdown.appendChild(wrapper);


		// -----------------------------
		// camera options
		// -----------------------------

		let cameraSection = new namespace.html.Section();
		wrapper.appendChild(cameraSection);

		let cameraLabel = new namespace.html.Label();
		cameraLabel.innerHTML = 'CAMERA POSITIONS (x, y, z)';
		cameraSection.appendChild(cameraLabel);

		cameraSection.appendChild('<divider-x-small></divider-x-small>');

		let cameraFlex = new namespace.html.Flex();
		cameraSection.appendChild(cameraFlex);

		let cameraXInput = new namespace.html.NumberInput();
		cameraXInput.id = 'camera-x-input';
		cameraXInput.value = DEBUG.CAMERA_POSITION_X;
		cameraXInput.disable();
		cameraFlex.appendChild(cameraXInput);

		cameraFlex.appendChild('<divider-y-small></divider-y-small>');

		let cameraYInput = new namespace.html.NumberInput();
		cameraYInput.id = 'camera-y-input';
		cameraYInput.value = DEBUG.CAMERA_POSITION_Y;
		cameraYInput.disable();
		cameraFlex.appendChild(cameraYInput);

		cameraFlex.appendChild('<divider-y-small></divider-y-small>');

		let cameraZInput = new namespace.html.NumberInput();
		cameraZInput.id = 'camera-z-input';
		cameraZInput.value = DEBUG.CAMERA_POSITION_Z;
		cameraZInput.disable();
		cameraFlex.appendChild(cameraZInput);
		
		wrapper.appendChild('<divider-x-small></divider-x-small>');
		wrapper.appendChild('<divider-x-small></divider-x-small>');


		// -----------------------------
		// canvas options
		// -----------------------------

		let canvasSection = new namespace.html.Section();
		wrapper.appendChild(canvasSection);

		let canvasLabel = new namespace.html.Label();
		canvasLabel.innerHTML = 'CANVAS (width, height)';
		canvasSection.appendChild(canvasLabel);

		canvasSection.appendChild('<divider-x-small></divider-x-small>');

		let canvasFlex = new namespace.html.Flex();
		canvasSection.appendChild(canvasFlex);

		let canvasWidthInput = new namespace.html.NumberInput();
		canvasWidthInput.id = 'canvas-width-input';
		canvasWidthInput.value = options.CANVAS_WIDTH;
		canvasWidthInput.onchange = () =>
		{
			options.CANVAS_WIDTH = Number(canvasWidthInput.value);
		};
		canvasFlex.appendChild(canvasWidthInput);

		canvasFlex.appendChild('<divider-y-small></divider-y-small>');

		let canvasHeightInput = new namespace.html.NumberInput();
		canvasHeightInput.id = 'canvas-height-input';
		canvasHeightInput.value = options.CANVAS_HEIGHT;
		canvasHeightInput.onchange = () =>
		{
			options.CANVAS_HEIGHT = Number(canvasHeightInput.value);
		};
		canvasFlex.appendChild(canvasHeightInput);

		wrapper.appendChild('<divider-x-small></divider-x-small>');


		// -----------------------------
		// resolution options
		// -----------------------------

		/*let resolutionSection = new namespace.html.Section();
		wrapper.appendChild(resolutionSection);

		let resolutionLabel = new namespace.html.Label();
		resolutionLabel.innerHTML = 'RESOLUTION (factor)';
		resolutionSection.appendChild(resolutionLabel);

		resolutionSection.appendChild('<divider-x-small></divider-x-small>');

		let resolutionInput = new namespace.html.NumberInput();
		resolutionInput.id = 'resolution-factor-input';
		resolutionInput.value = options.RESOLUTION_FACTOR;
		resolutionInput.onchange = () =>
		{
			options.RESOLUTION_FACTOR = Number(resolutionInput.value);
		};
		resolutionSection.appendChild(resolutionInput);

		wrapper.appendChild('<divider-x-small></divider-x-small>');*/


		// -----------------------------
		// antialiasing options
		// -----------------------------

		let antialiasingSection = new namespace.html.Section();
		wrapper.appendChild(antialiasingSection);

		let antialiasingLabel = new namespace.html.Label();
		antialiasingLabel.innerHTML = 'ANTIALIASING (factor)';
		antialiasingSection.appendChild(antialiasingLabel);

		antialiasingSection.appendChild('<divider-x-small></divider-x-small>');

		let antialiasingInput = new namespace.html.NumberInput();
		antialiasingInput.id = 'antialiasing-factor-input';
		antialiasingInput.value = options.MULTISAMPLING_FACTOR;
		antialiasingInput.onchange = () =>
		{
			options.MULTISAMPLING_FACTOR = Number(antialiasingInput.value);
		};
		antialiasingSection.appendChild(antialiasingInput);

		wrapper.appendChild('<divider-x-small></divider-x-small>');


		// -----------------------------
		// threads options
		// -----------------------------

		let threadsSection = new namespace.html.Section();
		wrapper.appendChild(threadsSection);

		let threadsLabel = new namespace.html.Label();
		threadsLabel.innerHTML = 'THREADS (max number)';
		threadsSection.appendChild(threadsLabel);

		threadsSection.appendChild('<divider-x-small></divider-x-small>');

		let threadsInput = new namespace.html.NumberInput();
		threadsInput.id = 'threads-max-number-input';
		threadsInput.value = options.MAX_THREADS;
		threadsInput.onchange = () =>
		{
			options.MAX_THREADS = Number(threadsInput.value);
		};
		threadsSection.appendChild(threadsInput);

		wrapper.appendChild('<divider-x-small></divider-x-small>');


		// -----------------------------
		// block options
		// -----------------------------

		let blockSection = new namespace.html.Section();
		wrapper.appendChild(blockSection);

		let blockLabel = new namespace.html.Label();
		blockLabel.innerHTML = 'BLOCK SIZE (width, height)';
		blockSection.appendChild(blockLabel);

		blockSection.appendChild('<divider-x-small></divider-x-small>');

		let blockFlex = new namespace.html.Flex();
		blockSection.appendChild(blockFlex);

		let blockWidthInput = new namespace.html.NumberInput();
		blockWidthInput.id = 'block-width-input';
		blockWidthInput.value = options.BLOCK_WIDTH;
		blockWidthInput.onchange = () =>
		{
			options.BLOCK_WIDTH = Number(blockWidthInput.value);
		};
		blockFlex.appendChild(blockWidthInput);

		blockFlex.appendChild('<divider-y-small></divider-y-small>');

		let blockHeightInput = new namespace.html.NumberInput();
		blockHeightInput.id = 'block-height-input';
		blockHeightInput.value = options.BLOCK_HEIGHT;
		blockHeightInput.onchange = () =>
		{
			options.BLOCK_HEIGHT = Number(blockHeightInput.value);
		};
		blockFlex.appendChild(blockHeightInput);

		wrapper.appendChild('<divider-x-small></divider-x-small>');


		// -----------------------------
		// blocks options
		// -----------------------------

		let numBlocksSection = new namespace.html.Section();
		wrapper.appendChild(numBlocksSection);

		let numBlockLabel = new namespace.html.Label();
		numBlockLabel.innerHTML = 'NUMBER OF BLOCKS';
		numBlocksSection.appendChild(numBlockLabel);

		numBlocksSection.appendChild('<divider-x-small></divider-x-small>');

		let numBlocksInput = new namespace.html.NumberInput();
		numBlocksInput.id = 'antialiasing-factor-input';
		numBlocksInput.value = options.NUM_OF_BLOCKS_IN_CHUNK;
		numBlocksInput.onchange = () =>
		{
			options.NUM_OF_BLOCKS_IN_CHUNK = Number(numBlocksInput.value);
		};
		numBlocksSection.appendChild(numBlocksInput);
		
		return dropdown;
	};

	return OptionsDropdown;
})();