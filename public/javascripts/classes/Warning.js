// namespace
var Warning = {};

if (typeof module !== 'undefined' && module.exports)
{
	// export for nodeJS use
	module.exports = Warning;
}

Warning.ValueUndefined = function()
{
    console.warn('Value is undefined!');
};

Warning.ValueInvalid = function(value)
{
    console.warn('Value "' + value + '" is invalid!');
};


