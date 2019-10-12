function GltfLoader()
{
    /**
     * Threejs gltf laoder instance.
     */
    this.instance = new THREE.GLTFLoader();

    /**
     * Path of the 3D GLTF model that needs to be loaded.
     */
    this.path = String();

    /**
     * GLTF model successfuly loaded callback.
     */
	this.onSuccess = Function.empty;
	
	this.onProgress = Function.empty;
}


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

    this.instance.load(this.path, this.onSuccess, this.onProgress, this._errorOccured);
};