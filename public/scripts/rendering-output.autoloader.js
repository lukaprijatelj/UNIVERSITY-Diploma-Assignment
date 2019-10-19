(async () =>
{
	let loadingBlock;

	loadingBlock = new Array();
	loadingBlock.push(document.loadScript("scripts/constants.js"));
	await Promise.all(loadingBlock);


	// -----------------------------
	// namespace-core
	// -----------------------------

	loadingBlock = new Array();
	loadingBlock.push(document.loadScript("externals/namespace-core/Exception.js"));
	loadingBlock.push(document.loadScript("externals/namespace-core/Warning.js"));
	await Promise.all(loadingBlock);

	loadingBlock = new Array();
	loadingBlock.push(document.loadScript("externals/namespace-core/interfaces/IDisposable.js"));
	loadingBlock.push(document.loadScript("externals/namespace-core/interfaces/IStringify.js"));	
	await Promise.all(loadingBlock);

	loadingBlock = new Array();
	loadingBlock.push(document.loadScript("externals/namespace-core/Interface.js"));	
	loadingBlock.push(document.loadScript("externals/namespace-core/Class.js"));	
	await Promise.all(loadingBlock);

	loadingBlock = new Array();
	loadingBlock.push(document.loadScript("externals/namespace-core/Event.js"));
	await Promise.all(loadingBlock);

	loadingBlock = new Array();
	loadingBlock.push(document.loadScript("externals/namespace-core/Mouse.js"));
	loadingBlock.push(document.loadScript("externals/namespace-core/Keyboard.js"));
	loadingBlock.push(document.loadScript("externals/namespace-core/GarbageCollector.js"));
	loadingBlock.push(document.loadScript("externals/namespace-core/List.js"));
	loadingBlock.push(document.loadScript("externals/namespace-core/StaticArray.js"));
	await Promise.all(loadingBlock);

	loadingBlock = new Array();
	loadingBlock.push(document.loadScript("externals/namespace-core/Ajax.js"));
	loadingBlock.push(document.loadScript("externals/namespace-core/Application.js"));
	loadingBlock.push(document.loadScript("externals/namespace-core/Array.js"));
	loadingBlock.push(document.loadScript("externals/namespace-core/Browser.js"));
	loadingBlock.push(document.loadScript("externals/namespace-core/Char.js"));
	loadingBlock.push(document.loadScript("externals/namespace-core/Color.js"));
	loadingBlock.push(document.loadScript("externals/namespace-core/console.js"));
	loadingBlock.push(document.loadScript("externals/namespace-core/Date.js"));
	loadingBlock.push(document.loadScript("externals/namespace-core/Enum.js"));
	loadingBlock.push(document.loadScript("externals/namespace-core/Function.js"));
	loadingBlock.push(document.loadScript("externals/namespace-core/LoadingCounter.js"));
	loadingBlock.push(document.loadScript("externals/namespace-core/Math.js"));  
	loadingBlock.push(document.loadScript("externals/namespace-core/Object.js"));
	loadingBlock.push(document.loadScript("externals/namespace-core/Path.js"));
	loadingBlock.push(document.loadScript("externals/namespace-core/RawImage.js"));
	loadingBlock.push(document.loadScript("externals/namespace-core/String.js"));
	loadingBlock.push(document.loadScript("externals/namespace-core/Thread.js"));
	loadingBlock.push(document.loadScript("externals/namespace-core/Timer.js"));
	loadingBlock.push(document.loadScript("externals/namespace-core/Unit.js"));
	loadingBlock.push(document.loadScript("externals/namespace-core/Version.js"));
	loadingBlock.push(document.loadScript("externals/namespace-core/RenderingOutputPage.js"));
	await Promise.all(loadingBlock);


	// -----------------------------
	// namespace-enums
	// -----------------------------

	loadingBlock = new Array();
	loadingBlock.push(document.loadScript("externals/namespace-enums/Unit.js"));
	loadingBlock.push(document.loadScript("externals/namespace-enums/BrowserType.js"));
	await Promise.all(loadingBlock);


	// -----------------------------
	// namespace-html
	// -----------------------------

	loadingBlock = new Array();
	loadingBlock.push(document.loadScript("externals/namespace-html/Button.js"));
	loadingBlock.push(document.loadScript("externals/namespace-html/Canvas.js"));
	loadingBlock.push(document.loadScript("externals/namespace-html/Checkbox.js"));
	loadingBlock.push(document.loadScript("externals/namespace-html/Div.js"));
	loadingBlock.push(document.loadScript("externals/namespace-html/EmbeddedObject.js"));
	loadingBlock.push(document.loadScript("externals/namespace-html/FileInput.js"));
	loadingBlock.push(document.loadScript("externals/namespace-html/Frame.js"));
	loadingBlock.push(document.loadScript("externals/namespace-html/Icon.js"));
	loadingBlock.push(document.loadScript("externals/namespace-html/Image.js"));
	loadingBlock.push(document.loadScript("externals/namespace-html/Input.js"));
	loadingBlock.push(document.loadScript("externals/namespace-html/Label.js"));
	loadingBlock.push(document.loadScript("externals/namespace-html/LoadingBar.js"));
	loadingBlock.push(document.loadScript("externals/namespace-html/Paragraph.js"));
	loadingBlock.push(document.loadScript("externals/namespace-html/ScrollViewer.js"));
	loadingBlock.push(document.loadScript("externals/namespace-html/Span.js"));
	loadingBlock.push(document.loadScript("externals/namespace-html/SpriteIcon.js"));
	loadingBlock.push(document.loadScript("externals/namespace-html/Table.js"));
	loadingBlock.push(document.loadScript("externals/namespace-html/TextArea.js"));
	loadingBlock.push(document.loadScript("externals/namespace-html/TextInput.js"));
	loadingBlock.push(document.loadScript("externals/namespace-html/Video.js"));
	loadingBlock.push(document.loadScript("externals/namespace-html/HTMLElement.js"));
	await Promise.all(loadingBlock);

	
	// -----------------------------
	// ThreeJS
	// -----------------------------

	loadingBlock = new Array();
	loadingBlock.push(document.loadScript('scripts/socket.io/socket.io.js'));
	loadingBlock.push(document.loadScript('scripts/threejs/three.js'));
	await Promise.all(loadingBlock);

	loadingBlock = new Array();
	loadingBlock.push(document.loadScript('scripts/threejs/OrbitControls.js'));
	loadingBlock.push(document.loadScript('scripts/threejs/GLTFLoader.js'));
	await Promise.all(loadingBlock);


	// -----------------------------
	// local scripts
	// -----------------------------

	loadingBlock = new Array();
	loadingBlock.push(document.loadScript('scripts/classes/RendererCanvas.js'));
	loadingBlock.push(document.loadScript('scripts/classes/EditorCanvas.js'));
	loadingBlock.push(document.loadScript('scripts/classes/GltfLoader.js'));
	await Promise.all(loadingBlock);

	loadingBlock = new Array();
	loadingBlock.push(document.loadScript('scripts/rendering-output.js'));
	await Promise.all(loadingBlock);
	
	RenderingOutputPage.init();
})();