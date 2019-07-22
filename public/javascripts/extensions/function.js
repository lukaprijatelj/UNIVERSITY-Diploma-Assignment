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

/**
 * Empty callback function.
 */
Function.empty = function()
{
	// do nothing
};