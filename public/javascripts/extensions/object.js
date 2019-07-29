/**
 * Inherits src object values to dst object.
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
};

/**
 * Inherits src object values to dst object.
 * @extends {Object}
 */
Object.shrink = function(template, src) 
{
	var dst = {};
	
	for (var key in template) 
	{
		if (src.hasOwnProperty(key))
		{
			dst[key] = src[key];
		}
	}
	
    return dst;
};
