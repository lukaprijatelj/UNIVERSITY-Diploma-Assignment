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
	loadingBlock.push(document.loadScript("scripts/namespace-core/namespace-core.js"));
	await Promise.all(loadingBlock);


	// -----------------------------
	// namespace-enums
	// -----------------------------

	loadingBlock = new Array();
	loadingBlock.push(document.loadScript("scripts/namespace-enums/namespace-enums.js"));
	loadingBlock.push(document.loadScript('scripts/namespace-enums/types.js'));
	await Promise.all(loadingBlock);


	// -----------------------------
	// namespace-html
	// -----------------------------

	loadingBlock = new Array();
	loadingBlock.push(document.loadScript("scripts/namespace-html/namespace-html.js"));
	loadingBlock.push(document.loadScript('scripts/namespace-html/RendererCanvas.js'));
	await Promise.all(loadingBlock);


	// -----------------------------
	// namespace-database
	// -----------------------------

	loadingBlock = new Array();
	loadingBlock.push(document.loadScript('scripts/namespace-database/BasicCell.js'));
	loadingBlock.push(document.loadScript('scripts/namespace-database/SharedCell.js'));
	await Promise.all(loadingBlock);

	
	// -----------------------------
	// ThreeJS
	// -----------------------------

	loadingBlock = new Array();
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
	loadingBlock.push(document.loadScript('scripts/api.js'));
	await Promise.all(loadingBlock);

	loadingBlock = new Array();	
	loadingBlock.push(document.loadScript('scripts/ray-tracing-web-worker/RaytracingRenderer.js'));
	loadingBlock.push(document.loadScript('scripts/ray-tracing-web-worker/RaytracingWebWorker.js'));
	loadingBlock.push(document.loadScript('scripts/path-tracing/PathtracingRenderer.js'));
	loadingBlock.push(document.loadScript('scripts/client.js'));
	await Promise.all(loadingBlock);
	
	ClientPage.init();
})();