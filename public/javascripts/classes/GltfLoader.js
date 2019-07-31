function GltfLoader()
{
    /**
     * Threejs gltf laoder instance.
     */
    this.instance = new THREE.GLTFLoader();

    /**
     * Path of the 3D GLTF model that needs to be loaded.
     */
    this.path = '';

    /**
     * GLTF model successfuly loaded callback.
     */
    this.onSuccess = Function.empty;
}

/**
 * @private
 */
GltfLoader.prototype._loadingProgressUpdate = function(xhr)
{
    // occurs when one of the files is done loading
    var percentage = xhr.loaded / xhr.total * 100;

    console.log('[GltfLoader] Scene is ' + percentage + '% loaded');	
};

/**
 * @private
 */
GltfLoader.prototype._errorOccured = function(error)
{
    console.error(error);

    new Exception.Other('Error while loading scene!');
};


/**
 * Starts loading.
 */
GltfLoader.prototype.start = function()
{
    if (!this.path)
    {
        new Exception.ValueInvalid(this.path);
    }

    if (!this.onSuccess)
    {
        new Exception.ValueUndefined();
    }

    this.instance.load(this.path, this.onSuccess, this._loadingProgressUpdate, this._errorOccured);
};


/**
 * Starts preloading textures.
 */
GltfLoader.loadTextures = function(imagesJSON, callback)
{
	var images = {};

	if (imagesJSON === undefined) 
	{
		return {};
	}

	if (imagesJSON.length == 0)
	{
		return {};
	}

	var loadingImagesCount = 0;
	var imageLoader = new RawImageLoader();
	imageLoader.onLoad = function() 
	{
		loadingImagesCount--;			

		if (loadingImagesCount == 0)
		{
			callback();
		}
	};

	for ( var i = 0, il = imagesJSON.length; i < il; i ++ ) 
	{
		var image = imagesJSON[i];
		var url = image.url;

		if (Array.isArray(url)) 
		{
			// load array of images e.g CubeTexture

			images[ image.uuid ] = [];

			for ( var j = 0, jl = url.length; j < jl; j ++ ) 
			{
				var currentUrl = url[ j ];

				var path = /^(\/\/)|([a-z]+:(\/\/)?)/i.test( currentUrl ) ? currentUrl : scope.resourcePath + currentUrl;

				loadingImagesCount++;
				var rawImage = imageLoader.load(path);

				images[ image.uuid ].push(rawImage);
			}
		} 
		else 
		{
			// load single image

			var path = /^(\/\/)|([a-z]+:(\/\/)?)/i.test( image.url ) ? image.url : scope.resourcePath + image.url;

			loadingImagesCount++;
			var rawImage = imageLoader.load(path);

			images[ image.uuid ] = rawImage;
		}
	}

	return images;
};