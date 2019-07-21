Date.getHourMinuteSecondString = function()
{
	var today = new Date();
	var h = today.getHours();
	var m = today.getMinutes();
	var s = today.getSeconds();

	// add a zero in front of numbers<10
	m = checkTime(m);
	s = checkTime(s);
	
	return h + ":" + m + ":" + s;
};
