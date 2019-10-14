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
namespace.database.Client = function(id, sessionId, ipAddress, active, isAdmin)
{
	this._id = id;
	this.sessionId = sessionId;
	this.ipAddress = ipAddress;
	this.active = active;
	this.admin = isAdmin;
};