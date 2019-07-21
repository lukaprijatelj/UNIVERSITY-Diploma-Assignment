Array.prototype.isEmpty = function()
{
	var array = this;

	if (array.length > 0)
	{
		return false;
	}

	return true;
};

Array.prototype.getFirst = function()
{
	var array = this;
	return array.length > 0 ? array[0] : undefined;
};

Array.prototype.getLast = function()
{
	var array = this;
	return array.length > 0 ? array[array.length - 1] : undefined;
};
