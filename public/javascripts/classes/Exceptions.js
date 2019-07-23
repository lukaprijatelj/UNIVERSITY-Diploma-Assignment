// namespace
var Exception = {};

Exception.NotImplemented = function()
{
    throw 'Logic is not yet implemented';
}

Exception.InputMissing = function()
{
    throw 'Input is missing';
}

Exception.RendererMissing = function()
{
    throw 'Renderer is missing';
}