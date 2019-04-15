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

Function.inherit = function(dst, src)
{
	var that = dst;

	// inherit properties
	src.call(that);

	if (!that._parentClass)
	{
		that._parentClass = [Function];
	}

	if (src._parentClass)
	{
		// copy inherited classes from parents
		for (var i=0; i<src._parentClass.length; i++)
		{
			that._parentClass.push(src._parentClass[i]);
		}
	}

	// add to list of parent classes
	that._parentClass.push(src);	
};

Function.isInheriting = function(dst, obj)
{
	var that = dst;

	if (!that._parentClass)
	{
		return false;
	}

	for (var i=0; i<that._parentClass.length; i++)
	{
		var currentParent = that._parentClass[i];

		if (currentParent == obj)
		{
			return true;
		}
	}

	return false;
};
