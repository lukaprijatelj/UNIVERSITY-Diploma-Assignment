/**
 * This is static function.
 * Clones src object values to dst object.
 * @extends {Object}
 */
Object.cloneData = function(dst, src) 
{
	for (var key in src) 
	{
		if (src.hasOwnProperty(key))
		{
			dst[key] = src[key];
		}
	}
	
    return dst;
}

/**
 * Must be called if you want to inherit properties that are assigned when object is created.
 */
Function.parentConstructor = function()
{
	var dst = arguments.shift();
	var src = arguments.shift();

	// Call parent constructor
	src.apply(dst, arguments);
};

/**
 * Inherits static prototype functions.
 */
Function.inheritPrototype = function(child, parent)
{
	child.prototype = Object.create(parent.prototype);
};
