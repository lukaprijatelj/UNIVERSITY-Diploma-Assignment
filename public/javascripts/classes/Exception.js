
// namespace
var Exception = {};

if (typeof module !== 'undefined' && module.exports)
{
	// export for nodeJS use
	module.exports = Exception;
}

Exception.NotImplemented = function()
{
    throw 'Logic is not yet implemented!';
},
    
Exception.InputMissing = function()
{
    throw 'Input is missing!';
};

Exception.RendererMissing = function()
{
    throw 'Renderer is missing!';
};

Exception.ValueUndefined = function()
{
    throw 'Value is undefined!';
};

Exception.ValueInvalid = function(value)
{
    throw 'Value "' + value + '" is invalid!';
};

Exception.Other = function(message)
{
    throw message;
};


