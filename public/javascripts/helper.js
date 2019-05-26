/** FLAGS */
var IS_CONSOLE_ENABLED = true;


HTMLElement.createElement = function(htmlString)
{
	var div = document.createElement('div');
	div.innerHTML = htmlString;
	return div.firstChild;
};

HTMLElement.prototype.addClass = function(value)
{
    this.classList.add(value);

    return this;
};

HTMLElement.prototype.removeClass = function(value)
{
    this.classList.remove(value);

    return this;
};

HTMLElement.prototype.empty = function()
{
    this.innerHTML = '';
};

HTMLElement.prototype.hide = function()
{
    this.removeClass('visible');
    this.addClass('hidden');
};

HTMLElement.prototype.show = function()
{
    this.removeClass('hidden');
    this.addClass('visible');
};

HTMLElement.prototype.enable = function()
{
    this.removeClass('disabled');
};

HTMLElement.prototype.disable = function()
{
    this.addClass('disabled');
};



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