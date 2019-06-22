/** FLAGS */
var IS_CONSOLE_ENABLED = true;


/**
 * List of all animationEnd names for different browsers.
 * @constant
 * @type {string}
 * @default
 */
var ANIMATION_END_NAMES = 
{
	webkit: 'webkitAnimationEnd',
	standard: 'animationend',
	ms: ' msAnimationEnd'
};

/**
 * List of all transitionEnd names for different browsers.
 * @constant
 * @type {string}
 * @default
 */
var TRANSITION_END_NAMES = 
{
	webkit: 'webkitTransitionEnd',
	standard: 'transitionend'
};

/**
 * Adds callback for animation.
 * @param {string} animationClass - animation class
 * @param {Function=} callback - callback (optional)
 */
HTMLElement.prototype.cssAnimation = function(animationClass, callback)
{
	callback = callback ? callback : function() {};

	var element = this;
	var onAnimationEndRef = null;
	var onAnimationEnded = () =>
	{
		element.removeEventListener(ANIMATION_END_NAMES.webkit, onAnimationEndRef);
		element.removeEventListener(ANIMATION_END_NAMES.standard, onAnimationEndRef);
		element.removeEventListener(ANIMATION_END_NAMES.ms, onAnimationEndRef);
		element.removeClass(animationClass);             

		callback();
	};
	onAnimationEndRef = onAnimationEnded;

	element.addClass(animationClass);
	element.removeEventListener(ANIMATION_END_NAMES.webkit, onAnimationEndRef);
	element.removeEventListener(ANIMATION_END_NAMES.standard, onAnimationEndRef);
	element.removeEventListener(ANIMATION_END_NAMES.ms, onAnimationEndRef);

	element.addEventListener(ANIMATION_END_NAMES.webkit, onAnimationEndRef, { once: true });
	element.addEventListener(ANIMATION_END_NAMES.standard, onAnimationEndRef, { once: true });
	element.addEventListener(ANIMATION_END_NAMES.ms, onAnimationEndRef, { once: true });
};

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