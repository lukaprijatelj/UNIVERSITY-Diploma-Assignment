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
	loadingBlock.push(document.loadScript("externals/namespace-core/namespace-core.js"));
	await Promise.all(loadingBlock);


	// -----------------------------
	// namespace-enums
	// -----------------------------

	loadingBlock = new Array();
	loadingBlock.push(document.loadScript("externals/namespace-enums/namespace-enums.js"));
	await Promise.all(loadingBlock);


	// -----------------------------
	// namespace-html
	// -----------------------------

	loadingBlock = new Array();
	loadingBlock.push(document.loadScript("externals/namespace-html/namespace-html.js"));
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
	loadingBlock.push(document.loadScript('scripts/enums.js'));
	loadingBlock.push(document.loadScript('scripts/api.js'));
	await Promise.all(loadingBlock);

	loadingBlock = new Array();	
	loadingBlock.push(document.loadScript('scripts/ray-tracing-web-worker/RaytracingRenderer.js'));
	loadingBlock.push(document.loadScript('scripts/ray-tracing-web-worker/RaytracingWebWorker.js'));
	loadingBlock.push(document.loadScript('scripts/client.js'));
	await Promise.all(loadingBlock);
	
	ClientPage.init();
})();