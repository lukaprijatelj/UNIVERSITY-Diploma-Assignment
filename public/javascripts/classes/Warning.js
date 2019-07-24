// namespace
var Warning = {};


Warning.ValueUndefined = function()
{
    console.warn('Value is undefined!');
};

Warning.ValueInvalid = function(value)
{
    console.warn('Value "' + value + '" is invalid!');
};
