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

	console.log('[Admin.autoloader] Loading namespace.enums library');

	loadingBlock = new Array();
	loadingBlock.push(document.loadScript("scripts/namespace-enums/namespace-enums.js"));
	loadingBlock.push(document.loadScript('scripts/namespace-enums/types.js'));
	await Promise.all(loadingBlock);


	// -----------------------------
	// namespace-html
	// -----------------------------

	console.log('[Admin.autoloader] Loading namespace.html library');

	loadingBlock = new Array();
	loadingBlock.push(document.loadScript("scripts/namespace-html/namespace-html.js"));
	loadingBlock.push(document.loadScript('scripts/namespace-html/RendererCanvas.js'));
	await Promise.all(loadingBlock);


	// -----------------------------
	// namespace-database
	// -----------------------------

	console.log('[Admin.autoloader] Loading namespace.database library');

	loadingBlock = new Array();
	loadingBlock.push(document.loadScript('scripts/namespace-database/BasicCell.js'));
	loadingBlock.push(document.loadScript('scripts/namespace-database/SharedCell.js'));
	await Promise.all(loadingBlock);

	
	// -----------------------------
	// ThreeJS
	// -----------------------------

	console.log('[Admin.autoloader] Loading threeJS library');

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

	console.log('[Admin.autoloader] Loading scripts');

	loadingBlock = new Array();
	loadingBlock.push(document.loadScript('scripts/api.js'));
	await Promise.all(loadingBlock);


	// -----------------------------
	// load ray-tracing scripts
	// -----------------------------

	console.log('[Admin.autoloader] Loading ray-tracing scripts');

	loadingBlock = new Array();	
	loadingBlock.push(document.loadScript('scripts/ray-tracing-web-worker/RaytracingRenderer.js'));
	loadingBlock.push(document.loadScript('scripts/ray-tracing-web-worker/RaytracingWebWorker.js'));
	await Promise.all(loadingBlock);


	// -----------------------------
	// load path-tracing scripts
	// -----------------------------

	console.log('[Admin.autoloader] Loading path-tracing scripts');

	loadingBlock = new Array();	
	loadingBlock.push(document.loadScript('scripts/path-tracing/FirstPersonCameraControls.js'));
	loadingBlock.push(document.loadScript('scripts/path-tracing/threex.keyboardstate.js'));
	loadingBlock.push(document.loadScript('scripts/path-tracing/BufferGeometryUtils.js'));
	loadingBlock.push(document.loadScript('scripts/path-tracing/BVH_Acc_Structure_Iterative_Builder.js'));
	loadingBlock.push(document.loadScript('scripts/path-tracing/pathTracingCommon.js'));
	loadingBlock.push(document.loadScript('scripts/path-tracing/RGBELoader.js'));
	loadingBlock.push(document.loadScript('scripts/path-tracing/PathtracingRenderer.js'));
	loadingBlock.push(document.loadScript('scripts/client.js'));
	await Promise.all(loadingBlock);
	
	ClientPage.init();
})();