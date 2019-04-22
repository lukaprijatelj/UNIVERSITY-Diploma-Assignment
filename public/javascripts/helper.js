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
}

Math.roundToTwoDecimals = function(value)
{
	return Math.round(value * 100) / 100;
}