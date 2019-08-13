importScripts('../classes/RawImageLoader.js');


// only accesible in web worker thread
var worker = null;
var dst = {};

var callback = () =>
{
	self.postMessage({
		type: 'onLoad',
		dst: dst
	});
};



