// -----------------------------
// Console
// -----------------------------

if (console.type == 'server')
{
	// do nothing
}
else
{
	console._log = console.log;
	console.log = function()
	{
		if (constants.IS_CONSOLE_ENABLED == false)
		{
			return;
		}
	
		console._log.apply(this, arguments);
	};
	
	
	console._error = console.error;
	console.error = function()
	{
		console._error.apply(this, arguments);
	};
	
	
	console._warn = console.warn;
	console.warn = function()
	{
		if (constants.IS_CONSOLE_ENABLED == false)
		{
			return;
		}
	
		console._warn.apply(this, arguments);
	};
}