function RawImage(url)
{
	this.url = url;
	this.width = null;
	this.height = null;
	this.pixels = [];
}

function RawImageLoader()
{	
	this.onLoad = Function.empty;
	this.onError = Function.empty;
}

RawImageLoader.prototype.load = function(url)
{
	var _this = this;
	var image = document.createElementNS('http://www.w3.org/1999/xhtml', 'img');
	var rawImage = new RawImage(url);

	function onImageLoad() 
	{
		image.removeEventListener( 'load', onImageLoad, false );
		image.removeEventListener( 'error', onImageError, false );

		var loadedImage = this;

		var canvas = document.createElement('canvas');
		canvas.width = loadedImage.width;
		canvas.height = loadedImage.height;
		
		var context = canvas.getContext('2d');
		context.drawImage(loadedImage, 0, 0, loadedImage.width, loadedImage.height);

		rawImage.pixels = context.getImageData(0, 0, loadedImage.width, loadedImage.height).data;
		rawImage.width = loadedImage.width;
		rawImage.height = loadedImage.height;

		_this.onLoad(this);
	}

	function onImageError( event ) 
	{
		image.removeEventListener( 'load', onImageLoad, false );
		image.removeEventListener( 'error', onImageError, false );

		_this.onError(event);
	}

	image.addEventListener( 'load', onImageLoad, false );
	image.addEventListener( 'error', onImageError, false );

	// TODO: not sure why this is needed
	/*if ( _this.url.substr( 0, 5 ) !== 'data:' ) 
	{
		if ( crossOrigin !== undefined ) image.crossOrigin = crossOrigin;
	}*/

	image.src = rawImage.url;
	
	return rawImage;
};