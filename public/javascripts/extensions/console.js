// -----------------------------
// Console
// -----------------------------

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