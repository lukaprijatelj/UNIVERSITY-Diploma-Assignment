'use strict';

var _this = this;

if (typeof module !== 'undefined' && module.exports)
{
	// export for nodeJS use
	_this = global;
}

if (typeof _this.namespace == 'undefined')
{
	_this.namespace = { };
}

if (typeof _this.namespace.database == 'undefined')
{
	_this.namespace.database = { };
}

// -----------------------------
// Rendering clients
// -----------------------------
namespace.database.SocketIoClient = function(id, index, sessionId, ipAddress, active, isAdmin)
{
	Object.addMetadata(this, 'type', 'namespace.database.SocketIoClient');
	this._id = id;
	this.index = index;
	this.sessionId = sessionId;
	this.ipAddress = ipAddress;
	this.active = active;
	this.isAdmin = isAdmin;
};
