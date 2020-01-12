(async () =>
{
	let loadingBlock;

	loadingBlock = new Array();
	loadingBlock.push(document.loadScript("scripts/constants.js"));
	await Promise.all(loadingBlock);


	// -----------------------------
	// namespace-debug
	// -----------------------------

	loadingBlock = new Array();
	loadingBlock.push(document.loadScript("scripts/namespace-debug/namespace-debug.js"));
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

	console.log('[Admin.autoloader] Loading enums');

	loadingBlock = new Array();
	loadingBlock.push(document.loadScript('scripts/namespace-enums/types.js'));
	await Promise.all(loadingBlock);


	// -----------------------------
	// namespace-html
	// -----------------------------

	console.log('[Admin.autoloader] Loading namespace.html library');

	loadingBlock = new Array();
	loadingBlock.push(document.loadScript("scripts/namespace-html/namespace-html.js"));
	loadingBlock.push(document.loadScript('scripts/namespace-html/Dropdown.js'));
	loadingBlock.push(document.loadScript('scripts/namespace-html/OptionsDropdown.js'));
	loadingBlock.push(document.loadScript('scripts/namespace-html/BackgroundDropdown.js'));
	loadingBlock.push(document.loadScript('scripts/namespace-html/Section.js'));
	loadingBlock.push(document.loadScript('scripts/namespace-html/EditorCanvas.js'));
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

	console.log('[Admin.autoloader] Loading script');

	loadingBlock = new Array();
	loadingBlock.push(document.loadScript('scripts/debug.js'));
	loadingBlock.push(document.loadScript('scripts/api.js'));
	loadingBlock.push(document.loadScript('scripts/admin.js'));
	await Promise.all(loadingBlock);

	
	// -----------------------------
	// preload background images
	// -----------------------------

	console.log('[Admin.autoloader] Preloading images');

	loadingBlock = new Array();

	for (let i=0; i<LIST_OF_BACKGROUND_IMAGES.length; i++)
	{
		loadingBlock.push(Image.preload(LIST_OF_BACKGROUND_IMAGES[i] + 'negX.png'));
	}

	await Promise.all(loadingBlock);
	
	AdminPage.init();
})();