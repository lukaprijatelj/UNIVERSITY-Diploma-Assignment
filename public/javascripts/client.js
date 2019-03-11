var CLIENT =
{
	init: function()
	{
		var socketIo = io('http://localhost:80/', { reconnect: true });

		socketIo.on('connect', function() 
		{
			console.log('Connected!');
			socketIo.emit('chat message', 'hello world test');
		});
	}
};

CLIENT.init();