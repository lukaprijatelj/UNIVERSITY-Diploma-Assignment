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
	loadingBlock.push(document.loadScript("externals/namespace-debug/namespace-debug.js"));
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
	// namespace-database
	// -----------------------------

	loadingBlock = new Array();
	loadingBlock.push(document.loadScript('scripts/database/BasicCell.js'));
	loadingBlock.push(document.loadScript('scripts/database/SharedCell.js'));
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
	loadingBlock.push(document.loadScript('scripts/classes/Dropdown.js'));
	loadingBlock.push(document.loadScript('scripts/classes/OptionsDropdown.js'));
	loadingBlock.push(document.loadScript('scripts/classes/BackgroundDropdown.js'));
	loadingBlock.push(document.loadScript('scripts/classes/Section.js'));
	await Promise.all(loadingBlock);

	loadingBlock = new Array();
	loadingBlock.push(document.loadScript('scripts/enums.js'));
	loadingBlock.push(document.loadScript('scripts/debug.js'));
	loadingBlock.push(document.loadScript('scripts/api.js'));
	loadingBlock.push(document.loadScript('scripts/admin.js'));
	await Promise.all(loadingBlock);

	
	// -----------------------------
	// preload background images
	// -----------------------------

	loadingBlock = new Array();

	for (let i=0; i<LIST_OF_BACKGROUND_IMAGES.length; i++)
	{
		loadingBlock.push(Image.preload(LIST_OF_BACKGROUND_IMAGES[i] + 'negX.png'));
	}

	await Promise.all(loadingBlock);
	
	AdminPage.init();
})();