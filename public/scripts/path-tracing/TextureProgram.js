var TextureProgram = function(gl)
{
	WebGlContextProgram.call(this, gl);

	this.inTexture0 = null;
	this.inTexture1 = null;
	this.inTexture2 = null;
	this.inTexture3 = null;

	this.outTexture0 = null;
	this.outTexture1 = null;
	this.outTexture2 = null;
	this.outTexture3 = null;

	this.defines = '';

	this.frameBuffer = null;

	this.textures = [];
};

Class.inheritPrototype(TextureProgram, WebGlContextProgram);


TextureProgram.prototype.initialize = function()
{
	let _this = this;
	let gl = _this.gl;

	let fragmentShader = globals.texturesFragmentShader;
	fragmentShader = fragmentShader.replace('@import-defines', _this.defines);

	_this.program = _this.createProgram(gl, globals.texturesVertexShader, fragmentShader);

	gl.useProgram(_this.program);

	_this.frameBuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, _this.frameBuffer);


	_this.fake = gl.createTexture();	
	gl.bindTexture(gl.TEXTURE_2D, _this.fake);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, options.CANVAS_WIDTH, options.CANVAS_HEIGHT, 0, gl.RGBA, gl.FLOAT, null);

	for (let i = 0; i < 3; i++) 
	{
		let tex = gl.createTexture();	

		if (i == 0)
		{
			_this.outTexture0 = tex;
		}
		else if (i == 1)
		{
			_this.outTexture1 = tex;
		}
		else if (i == 2)
		{
			_this.outTexture2 = tex;
		}
		else if (i == 3)
		{
			_this.outTexture3 = tex;
		}

		gl.bindTexture(gl.TEXTURE_2D, tex);
		
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, options.CANVAS_WIDTH, options.CANVAS_HEIGHT, 0, gl.RGBA, gl.FLOAT, null);
		// (gl.TEXTURE_2D, 0, gl.RGBA32F, CANVAS_WIDTH, CANVAS_HEIGHT, 0, gl.RGBA, gl.FLOAT, null)

		// tole potrebuješ, če hočeš da ti renderiranje na slike deluje
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		// attach texture to framebuffer
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, tex, 0);
	}


	gl.disable(gl.DEPTH_TEST); // framebuffer doesn't even have a depth buffer!
	gl.viewport(0,0, options.CANVAS_WIDTH, options.CANVAS_HEIGHT);  // Viewport is not set automatically!

	if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) 
	{
		// Can't use framebuffer.
		// See http://www.khronos.org/opengles/sdk/docs/man/xhtml/glCheckFramebufferStatus.xml
		alert('oops');
	}

	gl.drawBuffers([
		gl.COLOR_ATTACHMENT0,
		gl.COLOR_ATTACHMENT1,
		gl.COLOR_ATTACHMENT2
	]);


	for (let i=0; i<options.MAX_TEXTURES_IN_ARRAY; i++)
	{
		let texture = gl.createTexture();

		gl.bindTexture(gl.TEXTURE_2D, texture);
		
		// Set the parameters so we can render any size image.
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

		const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue

		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

		_this.textures.push(texture);

		_this.textureUnitsUsed++;
	}


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

TextureProgram.prototype.prepareDefines = function()
{
	let _this = this;

	// don't know why, but current glsl setting only allows max 16 textures per shader unit (tSkyCubeTextures + tAlbedoTextures = 10 already) 
	_this.defines += '#define MAX_TEXTURES_IN_ARRAY ' + options.MAX_TEXTURES_IN_ARRAY + ' \n';

	_this.defines += '#define NUM_OF_SKYCUBE_TEXTURES ' + options.SKY_CUBE_IMAGES.length + ' \n';
};

TextureProgram.prototype.prepareUniforms = function()
{
	let _this = this;
	let gl = _this.gl;

	gl.useProgram(_this.program);

	let inColor0Loc = gl.getUniformLocation(_this.program, "inColor0");
	let inColor1Loc = gl.getUniformLocation(_this.program, "inColor1");
	let inColor2Loc = gl.getUniformLocation(_this.program, "inColor2");

	gl.uniform1i(inColor0Loc, 0); // 1i means that this is 1 dimensional integer array (shouldn't it be float?)
	gl.uniform1i(inColor1Loc, 1);
	gl.uniform1i(inColor2Loc, 2);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, _this.inTexture0);
		
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, _this.inTexture1);
	
	gl.activeTexture(gl.TEXTURE2);
	gl.bindTexture(gl.TEXTURE_2D, _this.inTexture2);
	


	for (let i=0; i<globals.scene.background.image.length; i++)
	{
		let image = globals.scene.background.image[i];
		let u_imageLocation = gl.getUniformLocation(_this.program, 'u_textures' + '[' + i + ']');

		gl.activeTexture(gl.TEXTURE0 + 3 + i);
		gl.bindTexture(gl.TEXTURE_2D, _this.textures[i]);

		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		gl.uniform1i(u_imageLocation, 3 + i);  // texture unit 
	}

	_this.setUniformFloat("CANVAS_WIDTH", options.CANVAS_WIDTH);
	_this.setUniformFloat("CANVAS_HEIGHT", options.CANVAS_HEIGHT);
};

TextureProgram.prototype.render = function()
{
	let _this = this;
	let gl = _this.gl;

	gl.useProgram(_this.program);
	gl.bindFramebuffer(gl.FRAMEBUFFER, _this.frameBuffer);

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

	for (let i = 0; i < 3; i++) 
	{
		// dettach texture to framebuffer
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, _this.fake, 0);
	}

	gl.clearColor(1, 0.5, 0.5, 3);
};
