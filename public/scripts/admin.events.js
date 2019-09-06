var EVENTS =
{
	_onSceneButtonClick: async function(button)
	{
		let ajaxCall = new namespace.core.Ajax('html/scene-dropdown.html');
		ajaxCall.method = 'GET';
		let xhrCall = await ajaxCall.send();
		
		let offsetTop = button.getTop();
		let left = button.getLeft();
		let top = Unit.add(offsetTop, button.getOuterHeight());
		top = Unit.add(top, new Unit('1px'));

		let sceneDropdown = HTMLElement.parse(xhrCall.responseText);
		sceneDropdown.style.top = top.toString();
		sceneDropdown.style.left = left.toString();

		let curtain = new namespace.html.Curtain();
		curtain.onClick(EVENTS.hideLastDropdown);
		
		let layer = document.querySelector('layer#dropdowns');
		layer.appendChild(curtain);
		layer.appendChild(sceneDropdown);
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
		ajaxCall.method = 'GET';
		let xhrCall = await ajaxCall.send();


		// -----------------------------
		// calculate position of the dropdown
		// -----------------------------
		
		let dropdown = new namespace.html.Dropdown();
		dropdown.setAttribute('id', 'options-dropdown');
		dropdown.appendChild(xhrCall.responseText);
		
		// -----------------------------
		// set default values
		// -----------------------------

		dropdown.querySelector('#camera-x-input').value = options.CAMERA_POSITION_X;
		dropdown.querySelector('#camera-y-input').value = options.CAMERA_POSITION_Y;
		dropdown.querySelector('#camera-z-input').value = options.CAMERA_POSITION_Z;

		var resolutionWidthInput = dropdown.querySelector('#resolution-width-input');
		resolutionWidthInput.value = options.RESOLUTION_WIDTH;

		var resolutionHeightInput = dropdown.querySelector('#resolution-height-input');
		resolutionHeightInput.value = options.RESOLUTION_HEIGHT;

		var blockWidthV = dropdown.querySelector('#block-width-input');
		blockWidthV.value = options.BLOCK_WIDTH;

		var blockHeightV = dropdown.querySelector('#block-height-input');
		blockHeightV.value = options.BLOCK_HEIGHT;


		let anchor = new namespace.html.Anchor(dropdown);
		anchor.setTarget(button);

		let top = Unit.add(button.getOuterHeight(), new Unit('1px'));
		anchor.setCenter(top, new Unit());

		// -----------------------------
		// show dropdown
		// -----------------------------

		let curtain = new namespace.html.Curtain();
		curtain.onClick(EVENTS.hideLastDropdown);

		let layer = document.querySelector('layer#dropdowns');
		layer.appendChild(curtain);
		layer.appendChild(dropdown);
		layer.show();
	},

	onPreloadedSceneClick: function(element)
	{
		options.SCENE_FILEPATH = 'scenes/' + element.innerHTML;

		GarbageCollector.dispose(WebPage.renderer);
		
		WebPage.openScene();

		EVENTS.onDropdownsCurtainClick();
	},

	onFileUploadChange: async function(event)
    {
		EVENTS.onDropdownsCurtainClick();

		let loadingLayer = document.querySelector('layer#loading');
		loadingLayer.querySelector('.centered-text wrapper_').innerHTML = 'Uploading...';
		loadingLayer.show();

		var form = document.getElementById("scene-upload-form");
		var formData = new FormData(form);

		var ajaxCall = new namespace.core.Ajax('/api/uploadScene');	
		ajaxCall.skipJsonStringify = true;	
		await ajaxCall.send(formData);

		EVENTS.onFileUploadDone();
	},

	onFileUploadDone: function()
	{
		EVENTS.resetFilesInput();

		let loadingLayer = document.querySelector('layer#loading');
		loadingLayer.hide();
	},
	
	resetFilesInput: function()
	{
		var input = document.getElementById('upload-file-input');

		// reset input files so that onChange event will properly work when reselecting same files
		input.value = String();
	},

	onUploadSceneClick: function()
	{
		document.getElementById('upload-file-input').click();
	},

	onDropdownsCurtainClick: function(event)
	{
		let mouse = new namespace.core.Mouse(event);
		let list = document.querySelector('layer#dropdowns');
		
		if (mouse.isTarget(list) == false)
		{
			return;
		}

		list.empty();
	},

	/**
	 * Hides popups layer.
	 */
	hideLastDropdown: function()
	{
		let popup = document.querySelector('layer#dropdowns > *:last-child');

		// removes curtain
		popup.previousSibling.remove();
		popup.remove();
	},

	/**
	 * Sends request to recalculate grid layout.
	 * @private
	 */
	_onStartStopRenderingClick: function()
	{
		var startRenderingButtonV = document.getElementById('render-button');
		startRenderingButtonV.disable();

		var data = new Object();

		if (startRenderingButtonV.hasClass('selected'))
		{
			API.request('rendering/stop', () =>
			{
				WebPage.isRendering = false;
				WebPage._updateRenderingState();
			}, data);
		}
		else
		{
			data.options = options;

			API.request('rendering/start', () =>
			{
				WebPage.isRendering = true;
				WebPage._updateRenderingState();
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