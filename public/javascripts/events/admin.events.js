var EVENTS =
{
	_onSceneButtonClick: async function(button)
	{
		let ajaxCall = new namespace.core.Ajax('html/scene-dropdown.html');
		let xhrCall = await ajaxCall.send();
		
		let offset = button.getOffset();
		let offsetTop = new namespace.core.Unit(offset.top);
		let left = new namespace.core.Unit(offset.left);
		let top = namespace.core.Unit.add(offsetTop, button.getOuterHeight());
		top = namespace.core.Unit.add(top, new namespace.core.Unit('1px'));

		let sceneDropdown = HTMLElement.createElement(xhrCall.responseText);
		sceneDropdown.style.top = top.toString();
		sceneDropdown.style.left = left.toString();

		let list = document.querySelector('layer#dropdowns>list');
		list.appendChild(sceneDropdown);

		let layer = document.querySelector('layer#dropdowns');
		layer.show();
	},

	_onNewRendererClick: function()
	{
		/*var a = document.createElement("a");    
		a.href = window.location.origin + '/client';    
		a.setAttribute('target', '_blank');
		var evt = document.createEvent("MouseEvents");   
		evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, true, false, false, false, 0, null);    
		a.dispatchEvent(evt);*/

		window.open("/client", "", "width=" + options.RESOLUTION_WIDTH + ",height=" + options.RESOLUTION_HEIGHT);
	},

	_onOptionsButtonClick: async function(button)
	{
		let ajaxCall = new namespace.core.Ajax('html/options-dropdown.html');
		let xhrCall = await ajaxCall.send();


		// -----------------------------
		// calculate position of the dropdown
		// -----------------------------
		
		let offset = button.getOffset();
		let offsetTop = new namespace.core.Unit(offset.top);
		let left = new namespace.core.Unit(offset.left);
		let top = namespace.core.Unit.add(offsetTop, button.getOuterHeight());
		top = namespace.core.Unit.add(top, new namespace.core.Unit('1px'));

		let dropdown = HTMLElement.createElement(xhrCall.responseText);
		dropdown.style.top = top.toString();
		dropdown.style.left = left.toString();

		let list = document.querySelector('layer#dropdowns>list');
		list.appendChild(dropdown);


		// -----------------------------
		// set default values
		// -----------------------------

		document.getElementById('camera-x-input').value = options.CAMERA_POSITION_X;
		document.getElementById('camera-y-input').value = options.CAMERA_POSITION_Y;
		document.getElementById('camera-z-input').value = options.CAMERA_POSITION_Z;

		var resolutionWidthInput = document.getElementById('resolution-width-input');
		resolutionWidthInput.value = options.RESOLUTION_WIDTH;

		var resolutionHeightInput = document.getElementById('resolution-height-input');
		resolutionHeightInput.value = options.RESOLUTION_HEIGHT;

		var blockWidthV = document.getElementById('block-width-input');
		blockWidthV.value = options.BLOCK_WIDTH;

		var blockHeightV = document.getElementById('block-height-input');
		blockHeightV.value = options.BLOCK_HEIGHT;


		// -----------------------------
		// show dropdown
		// -----------------------------

		let layer = document.querySelector('layer#dropdowns');
		layer.show();
	},

	onPreloadedSceneClick: function(element)
	{
		options.SCENE_FILEPATH = 'scenes/' + element.innerHTML;

		GLOBALS.renderer.dispose();
		GLOBALS.openScene();

		EVENTS.onDropdownsCurtainClick();
	},

	onFileUploadChange: function(event)
    {
		var form = document.getElementById("scene-upload-form");
		var formData = new FormData(form);

		var ajaxCall = new namespace.core.Ajax('/api/uploadScene');
		ajaxCall.method = 'POST';
		ajaxCall.send(formData);

		EVENTS.onDropdownsCurtainClick();
    },

	onUploadSceneClick: function()
	{
		document.getElementById('upload-file-input').click();
	},

	onDropdownsCurtainClick: function()
	{
		let list = document.querySelector('layer#dropdowns>list');
		list.empty();

		let layer = document.querySelector('layer#dropdowns');
		layer.hide();
	},

	/**
	 * Sends request to recalculate grid layout.
	 * @private
	 */
	_onStartStopRenderingClick: function()
	{
		var startRenderingButtonV = document.getElementById('render-button');
		startRenderingButtonV.disable();

		var data = {};

		if (startRenderingButtonV.hasClass('selected'))
		{
			API.request('rendering/stop', () =>
			{
				GLOBALS.isRendering = false;
				GLOBALS._updateRenderingState();
			}, data);
		}
		else
		{
			data.options = options;

			API.request('rendering/start', () =>
			{
				GLOBALS.isRendering = true;
				GLOBALS._updateRenderingState();
			}, data);
		}
	},

	_onResolutionWidthChange: function(val)
	{
		options.RESOLUTION_WIDTH = Number(val);
	},

	_onResolutionHeightChange: function(val)
	{
		options.RESOLUTION_HEIGHT = Number(val);
	},

	_onBlockWidthChange: function(val)
	{
		options.BLOCK_WIDTH = Number(val);
	},

	_onBlockHeightChange: function(val)
	{
		options.BLOCK_HEIGHT = Number(val);
	},

	_onOpenOutputClick: function()
	{
		// open rendering output window
		window.open("/renderingOutput", "", "width=" + options.RESOLUTION_WIDTH + ",height=" + options.RESOLUTION_HEIGHT);
	}
};