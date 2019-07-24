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