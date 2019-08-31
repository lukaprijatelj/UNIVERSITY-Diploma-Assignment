(async () =>
{
	let loadingBlock;

	loadingBlock = new Array();
	loadingBlock.push(new namespace.core.AsyncImporter("scripts/constants.js"));
	await Promise.all(loadingBlock);


	// -----------------------------
	// namespace-core
	// -----------------------------

	loadingBlock = new Array();
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/Exception.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/Warning.js"));
	await Promise.all(loadingBlock);

	loadingBlock = new Array();
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/interfaces/IDisposable.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/interfaces/IStringify.js"));	
	await Promise.all(loadingBlock);

	loadingBlock = new Array();
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/Interface.js"));	
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/Class.js"));	
	await Promise.all(loadingBlock);

	loadingBlock = new Array();
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/Event.js"));
	await Promise.all(loadingBlock);

	loadingBlock = new Array();
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/Mouse.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/Keyboard.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/GarbageCollector.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/List.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/StaticArray.js"));
	await Promise.all(loadingBlock);

	loadingBlock = new Array();
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/Ajax.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/Application.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/Array.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/Browser.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/Char.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/Color.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/console.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/Date.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/Enum.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/Function.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/HTMLElement.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/Image.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/LoadingCounter.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/Math.js"));  
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/Object.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/Path.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/RawImage.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/String.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/Thread.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/Timer.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/Unit.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-core/Version.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-html/WebPage.js"));
	await Promise.all(loadingBlock);


	// -----------------------------
	// namespace-enums
	// -----------------------------

	loadingBlock = new Array();
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-enums/Unit.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-enums/BrowserType.js"));
	await Promise.all(loadingBlock);


	// -----------------------------
	// namespace-html
	// -----------------------------

	loadingBlock = new Array();
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-html/Button.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-html/Canvas.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-html/Checkbox.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-html/Div.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-html/EmbeddedObject.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-html/FileInput.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-html/Frame.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-html/Icon.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-html/Image.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-html/Input.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-html/Label.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-html/LoadingBar.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-html/Paragraph.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-html/ScrollViewer.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-html/Span.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-html/SpriteIcon.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-html/Table.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-html/TextArea.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-html/TextInput.js"));
	loadingBlock.push(new namespace.core.AsyncImporter("externals/namespace-html/Video.js"));
	await Promise.all(loadingBlock);

	
	// -----------------------------
	// ThreeJS
	// -----------------------------

	loadingBlock = new Array();
	loadingBlock.push(new namespace.core.AsyncImporter('scripts/socket.io/socket.io.js'));
	loadingBlock.push(new namespace.core.AsyncImporter('scripts/threejs/three.js'));
	await Promise.all(loadingBlock);

	loadingBlock = new Array();
	loadingBlock.push(new namespace.core.AsyncImporter('scripts/threejs/OrbitControls.js'));
	loadingBlock.push(new namespace.core.AsyncImporter('scripts/threejs/GLTFLoader.js'));
	await Promise.all(loadingBlock);


	// -----------------------------
	// local scripts
	// -----------------------------

	loadingBlock = new Array();
	loadingBlock.push(new namespace.core.AsyncImporter('scripts/classes/RendererCanvas.js'));
	loadingBlock.push(new namespace.core.AsyncImporter('scripts/classes/EditorCanvas.js'));
	loadingBlock.push(new namespace.core.AsyncImporter('scripts/classes/GltfLoader.js'));
	loadingBlock.push(new namespace.core.AsyncImporter('scripts/classes/RawImageLoader.js'));
	loadingBlock.push(new namespace.core.AsyncImporter('scripts/enums.js'));
	loadingBlock.push(new namespace.core.AsyncImporter('scripts/api.js'));
	await Promise.all(loadingBlock);

	loadingBlock = new Array();	
	loadingBlock.push(new namespace.core.AsyncImporter('scripts/ray-tracing-web-worker/RaytracingRenderer.js'));
	loadingBlock.push(new namespace.core.AsyncImporter('scripts/ray-tracing-web-worker/RaytracingWorker.js'));
	loadingBlock.push(new namespace.core.AsyncImporter('scripts/client.js'));
	await Promise.all(loadingBlock);
	
	WebPage.init();
})();