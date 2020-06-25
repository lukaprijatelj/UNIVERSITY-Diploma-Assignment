/**
 * Main WebGL program for calculating scene ray intersections.
 */
var DrawingProgram = function(gl)
{
	WebGlContextProgram.call(this, gl);

	this.inTexture0 = null;
	this.inTexture1 = null;
	this.inTexture2 = null;
	this.inTexture3 = null;

	this.defines = '';	
};

Class.inheritPrototype(DrawingProgram, WebGlContextProgram);

/**
 * Initializes program.
 */
DrawingProgram.prototype.initialize = function()
{
	let _this = this;
	let gl = _this.gl;

	let fragmentShader = globals.drawingFragmentShader;
	fragmentShader = fragmentShader.replace('@import-defines', _this.defines);

	_this.program = _this.createProgram(gl, globals.drawingVertexShader, fragmentShader);

	gl.useProgram(_this.program);

	gl.useProgram(_this.program);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
	gl.viewport(0,0, options.CANVAS_WIDTH, options.CANVAS_HEIGHT);  // Viewport is not set automatically!
	gl.clearColor(1.0, 1.0, 1.0, 1.0);


	//Create vertex buffer
	var vertexDataBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexDataBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, WebGlContextProgram.vertexData, gl.STATIC_DRAW);

	// Layout of our data in the vertex buffer
	var positionLocation = gl.getAttribLocation(_this.program, "position");

	gl.enableVertexAttribArray(positionLocation);
	gl.vertexAttribPointer(positionLocation,
		2, // position is a vec2 (2 values per component)
		gl.FLOAT, // each component is a float
		false, // don't normalize values
		2 * 4, // two 4 byte float components per vertex (32 bit float is 4 bytes)
		0 // how many bytes inside the buffer to start from
	);
};

/**
 * Prepares defines for shaders.
 */
DrawingProgram.prototype.prepareDefines = function()
{
	let _this = this;

	// don't know why, but current glsl setting only allows max 16 textures per shader unit (tSkyCubeTextures + tAlbedoTextures = 10 already) 
	_this.defines += '#define MAX_TEXTURES_IN_ARRAY ' + options.MAX_TEXTURES_IN_ARRAY + ' \n';

	_this.defines += '#define MAX_BOUNCES ' + options.MAX_RECURSION_DEPTH + ' \n';

	_this.defines += '#define NUM_OF_SKYCUBE_TEXTURES ' + options.SKY_CUBE_IMAGES.length + ' \n';

	_this.defines += '#define MULTISAMPLING_FACTOR ' + options.MULTISAMPLING_FACTOR + ' \n';
};

/**
 * Prepares uniforms for shaders.
 */
DrawingProgram.prototype.prepareUniforms = function()
{
	let _this = this;
	let gl = _this.gl;

	/*
	_this.pathTracingUniforms = 
	{		
		tPreviousTexture: { type: "t", value: globals.renderer.screenTextureRenderTarget.texture },
		tTriangleTexture: { type: "t", value: globals.renderer.triangleDataTexture },
		tAABBTexture: { type: "t", value: globals.renderer.aabbDataTexture }	
	};
	*/

	gl.useProgram(_this.program);

	let inColor0Loc = gl.getUniformLocation(_this.program, "inColor0");
	gl.uniform1i(inColor0Loc, 0); // 1i means that this is 1 dimensional integer array (shouldn't it be float?)

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, _this.inTexture0);
	
	
	_this.setUniformFloat("CANVAS_WIDTH", options.CANVAS_WIDTH);
	_this.setUniformFloat("CANVAS_HEIGHT", options.CANVAS_HEIGHT);	
};

/**
 * Renders selected scene.
 */
DrawingProgram.prototype.render = function()
{
	let _this = this;
	let gl = _this.gl;

	gl.useProgram(_this.program);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
};