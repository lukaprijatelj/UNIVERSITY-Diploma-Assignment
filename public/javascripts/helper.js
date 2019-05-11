/** FLAGS */
var IS_CONSOLE_ENABLED = true;


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


/**
 * Rounds math
 */
Math.roundToTwoDecimals = function(value)
{
	return Math.round(value * 100) / 100;
}


/**
 * Overrides default console.log function.
 */
console._log = console.log;
console.log = function()
{
	if (IS_CONSOLE_ENABLED == false)
	{
		return;
	}

	console._log.apply(this, arguments);
};