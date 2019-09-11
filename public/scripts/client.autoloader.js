(async () =>
{
	let loadingBlock;

	loadingBlock = new Array();
	loadingBlock.push(new AsyncImporter("scripts/constants.js"));
	await Promise.all(loadingBlock);


	// -----------------------------
	// namespace-core
	// -----------------------------

	loadingBlock = new Array();
	loadingBlock.push(new AsyncImporter("externals/namespace-core/namespace-core.js"));
	await Promise.all(loadingBlock);


	// -----------------------------
	// namespace-enums
	// -----------------------------

	loadingBlock = new Array();
	loadingBlock.push(new AsyncImporter("externals/namespace-enums/Unit.js"));
	loadingBlock.push(new AsyncImporter("externals/namespace-enums/BrowserType.js"));
	await Promise.all(loadingBlock);


	// -----------------------------
	// namespace-html
	// -----------------------------

	loadingBlock = new Array();
	loadingBlock.push(new AsyncImporter("externals/namespace-html/Button.js"));
	loadingBlock.push(new AsyncImporter("externals/namespace-html/Canvas.js"));
	loadingBlock.push(new AsyncImporter("externals/namespace-html/Checkbox.js"));
	loadingBlock.push(new AsyncImporter("externals/namespace-html/Div.js"));
	loadingBlock.push(new AsyncImporter("externals/namespace-html/EmbeddedObject.js"));
	loadingBlock.push(new AsyncImporter("externals/namespace-html/FileInput.js"));
	loadingBlock.push(new AsyncImporter("externals/namespace-html/Frame.js"));
	loadingBlock.push(new AsyncImporter("externals/namespace-html/Icon.js"));
	loadingBlock.push(new AsyncImporter("externals/namespace-html/Image.js"));
	loadingBlock.push(new AsyncImporter("externals/namespace-html/Input.js"));
	loadingBlock.push(new AsyncImporter("externals/namespace-html/Label.js"));
	loadingBlock.push(new AsyncImporter("externals/namespace-html/LoadingBar.js"));
	loadingBlock.push(new AsyncImporter("externals/namespace-html/Paragraph.js"));
	loadingBlock.push(new AsyncImporter("externals/namespace-html/ScrollViewer.js"));
	loadingBlock.push(new AsyncImporter("externals/namespace-html/Span.js"));
	loadingBlock.push(new AsyncImporter("externals/namespace-html/SpriteIcon.js"));
	loadingBlock.push(new AsyncImporter("externals/namespace-html/Table.js"));
	loadingBlock.push(new AsyncImporter("externals/namespace-html/TextArea.js"));
	loadingBlock.push(new AsyncImporter("externals/namespace-html/TextInput.js"));
	loadingBlock.push(new AsyncImporter("externals/namespace-html/Video.js"));
	loadingBlock.push(new AsyncImporter("externals/namespace-html/HTMLElement.js"));
	await Promise.all(loadingBlock);

	
	// -----------------------------
	// ThreeJS
	// -----------------------------

	loadingBlock = new Array();
	loadingBlock.push(new AsyncImporter('scripts/socket.io/socket.io.js'));
	loadingBlock.push(new AsyncImporter('scripts/threejs/three.js'));
	await Promise.all(loadingBlock);

	loadingBlock = new Array();
	loadingBlock.push(new AsyncImporter('scripts/threejs/OrbitControls.js'));
	loadingBlock.push(new AsyncImporter('scripts/threejs/GLTFLoader.js'));
	await Promise.all(loadingBlock);


	// -----------------------------
	// local scripts
	// -----------------------------

	loadingBlock = new Array();
	loadingBlock.push(new AsyncImporter('scripts/classes/RendererCanvas.js'));
	loadingBlock.push(new AsyncImporter('scripts/classes/EditorCanvas.js'));
	loadingBlock.push(new AsyncImporter('scripts/classes/GltfLoader.js'));
	loadingBlock.push(new AsyncImporter('scripts/enums.js'));
	loadingBlock.push(new AsyncImporter('scripts/api.js'));
	await Promise.all(loadingBlock);

	loadingBlock = new Array();	
	loadingBlock.push(new AsyncImporter('scripts/ray-tracing-web-worker/RaytracingRenderer.js'));
	loadingBlock.push(new AsyncImporter('scripts/ray-tracing-web-worker/RaytracingWorker.js'));
	loadingBlock.push(new AsyncImporter('scripts/client.js'));
	await Promise.all(loadingBlock);
	
	WebPage.init();
})();