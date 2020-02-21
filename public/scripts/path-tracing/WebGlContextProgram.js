var WebGlContextProgram = function(gl)
{
	this.gl = gl;
	this.program = null;
};

WebGlContextProgram.vertexData = new Float32Array([
	-1.0,
	1.0, // top left
	-1.0,
	-1.0, // bottom left
	1.0,
	1.0, // top right
	1.0,
	-1.0 // bottom right
]);

WebGlContextProgram.prototype.useProgram = function()
{
	let _this = this;

	_this.gl.useProgram(_this.program);
};

WebGlContextProgram.prototype.setUniformFloat = function(name, value)
{
	let _this = this;
	let gl = _this.gl;

	let location = gl.getUniformLocation(_this.program, name);
	gl.uniform1f(location, value);
};

WebGlContextProgram.prototype.setUniformBool = function(name, value)
{
	let _this = this;
	let gl = _this.gl;

	let location = gl.getUniformLocation(_this.program, name);
	gl.uniform1f(location, Number(value));
};
WebGlContextProgram.prototype.setUniformInt = function(name, value)
{
	let _this = this;
	let gl = _this.gl;

	let location = gl.getUniformLocation(_this.program, name);
	gl.uniform1i(location, value);
};
WebGlContextProgram.prototype.setUniformColor = function(name, value)
{
	let _this = this;
	let gl = _this.gl;

	let location = gl.getUniformLocation(_this.program, name);
	gl.uniform3f(location, value.r, value.g, value.b);
};
WebGlContextProgram.prototype.setUniformVec2 = function(name, value)
{
	let _this = this;
	let gl = _this.gl;

	let location = gl.getUniformLocation(_this.program, name);
	gl.uniform2f(location, value.x, value.y);
};
WebGlContextProgram.prototype.setUniformVec3 = function(name, value)
{
	let _this = this;
	let gl = _this.gl;

	let location = gl.getUniformLocation(_this.program, name);
	gl.uniform3f(location, value.x, value.y, value.z);
};

WebGlContextProgram.prototype.createProgram = function(context, vertexShaderSource, fragmentShaderSource, message) 
{
	let program = context.createProgram();

	let vs = context.createShader(context.VERTEX_SHADER);
	let fs = context.createShader(context.FRAGMENT_SHADER);

	context.attachShader(program, vs);
	context.attachShader(program, fs);

	// Mark shader for deletion when the program is deleted
	context.deleteShader(vs);
	context.deleteShader(fs);

	context.shaderSource(vs, vertexShaderSource);
	context.compileShader(vs);

	if (!context.getShaderParameter(vs, context.COMPILE_STATUS)) 
	{
		if (message) {
			message.innerText += context.getShaderInfoLog(vs) + "\n";
			alert(context.getShaderInfoLog(vs));
		} else {
			alert(context.getShaderInfoLog(vs));
		}
		context.deleteProgram(program);
		return;
	}

	context.shaderSource(fs, fragmentShaderSource);
	context.compileShader(fs);

	if (!context.getShaderParameter(fs, context.COMPILE_STATUS)) 
	{
		if (message) {
			message.innerText += context.getShaderInfoLog(fs) + "\n";
			alert(context.getShaderInfoLog(fs));
		} else {
			alert(context.getShaderInfoLog(fs));
		}
		context.deleteProgram(program);
		return;
	}

	context.linkProgram(program);

	if (!context.getProgramParameter(program, context.LINK_STATUS)) 
	{
		if (message) {
			message.innerText += context.getProgramInfoLog(program) + "\n";
			alert(context.getShaderInfoLog(program));
		} else {
			alert(context.getShaderInfoLog(program));
		}
		context.deleteProgram(program);
		return;
	}

	return program;
};