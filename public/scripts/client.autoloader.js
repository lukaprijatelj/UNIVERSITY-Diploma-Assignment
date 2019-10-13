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
	loadingBlock.push(new AsyncImporter("externals/namespace-enums/namespace-enums.js"));
	await Promise.all(loadingBlock);


	// -----------------------------
	// namespace-html
	// -----------------------------

	loadingBlock = new Array();
	loadingBlock.push(new AsyncImporter("externals/namespace-html/namespace-html.js"));
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
	loadingBlock.push(new AsyncImporter('scripts/client.js'));
	await Promise.all(loadingBlock);
	
	ClientPage.init();
})();