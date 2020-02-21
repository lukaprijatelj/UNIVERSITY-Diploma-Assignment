/**
 * Main WebGL program for calculating scene ray intersections.
 */
var RenderingProgram = function(gl)
{
	WebGlContextProgram.call(this, gl);

	this.outTexture0 = null;
	this.outTexture1 = null;
	this.outTexture2 = null;
	this.outTexture3 = null;

	this.inTexture0 = null;
	this.inTexture1 = null;
	this.inTexture2 = null;
	this.inTexture3 = null;

	this.frameBuffer = null;

	this.textures = [];

	this.defines = '';	
};

Class.inheritPrototype(RenderingProgram, WebGlContextProgram);

/**
 * Initializes program.
 */
RenderingProgram.prototype.initialize = function()
{
	let _this = this;
	let gl = _this.gl;

	let fragmentShader = globals.renderingFragmentShader;
	fragmentShader = fragmentShader.replace('@import-defines', _this.defines);

	_this.program = _this.createProgram(gl, globals.renderingVertexShader, fragmentShader);


	_this.frameBuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, _this.frameBuffer);

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
RenderingProgram.prototype.prepareDefines = function()
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
RenderingProgram.prototype.prepareUniforms = function()
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
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, _this.inTexture0);
	gl.uniform1i(inColor0Loc, 0); // 1i means that this is 1 dimensional integer array (shouldn't it be float?)
	
	let inColor1Loc = gl.getUniformLocation(_this.program, "inColor1");
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, _this.inTexture1);
	gl.uniform1i(inColor1Loc, 1);

	let inColor2Loc = gl.getUniformLocation(_this.program, "inColor2");
	gl.activeTexture(gl.TEXTURE2);
	gl.bindTexture(gl.TEXTURE_2D, _this.inTexture2);
	gl.uniform1i(inColor2Loc, 2);



	let worldCamera = globals.renderer.worldCamera;

	let location = gl.getUniformLocation(_this.program, "uCameraMatrix");
	gl.uniformMatrix4fv(location, false, worldCamera.matrixWorld.elements);

	var cameraPosition = worldCamera.position.clone();
	cameraPosition.applyMatrix4(worldCamera.matrixWorld);
	_this.setUniformVec3("cameraPosition", cameraPosition);

	let ambientLight = globals.renderer.ambientLight;
	_this.setUniformColor("uAmbientLightColor", ambientLight.color);
	_this.setUniformFloat("uAmbientLightIntensity", ambientLight.intensity);
	
	_this.setUniformFloat("uTime", 0.0);

	_this.setUniformFloat("uFrameCounter", 1.0);

	_this.setUniformFloat("uApertureSize", 0.0);

	_this.setUniformFloat("uFocusDistance", 100.0);

	_this.setUniformInt("uBounces", 0);

	_this.setUniformBool("uCameraIsMoving", false);
	_this.setUniformBool("uCameraJustStartedMoving", false);

	_this.setUniformFloat("CANVAS_WIDTH", options.CANVAS_WIDTH);
	_this.setUniformFloat("CANVAS_HEIGHT", options.CANVAS_HEIGHT);	

	
	let fovScale = worldCamera.fov * 0.5 * (Math.PI / 180.0);
	let uVLen = Math.tan(fovScale);
	let uULen = uVLen * worldCamera.aspect;

	_this.setUniformFloat("uULen", uULen);
	_this.setUniformFloat("uVLen", uVLen);
};

/**
 * Renders selected scene.
 */
RenderingProgram.prototype.render = function()
{
	let _this = this;
	let gl = _this.gl;

	gl.useProgram(_this.program);
	gl.bindFramebuffer(gl.FRAMEBUFFER, _this.frameBuffer);

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
};

