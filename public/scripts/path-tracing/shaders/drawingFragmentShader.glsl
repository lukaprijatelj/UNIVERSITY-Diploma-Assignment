#version 300 es

precision highp float;
precision highp int;
precision highp sampler2D;

// -----------------------------
// DEFINES
// -----------------------------

// this line is dynamically replaced when compiling shader program
@import-defines

#define PI               3.14159265358979323
#define TWO_PI           6.28318530717958648
#define FOUR_PI          12.5663706143591729
#define ONE_OVER_PI      0.31830988618379067
#define ONE_OVER_TWO_PI  0.15915494309
#define ONE_OVER_FOUR_PI 0.07957747154594767
#define PI_OVER_TWO      1.57079632679489662
#define ONE_OVER_THREE   0.33333333333333333
#define E                2.71828182845904524
#define INFINITY         1000000.0

#define NONE         	 -1000000
#define SPOT_LIGHT -2
#define POINT_LIGHT -1
#define LIGHT 0
#define DIFF 1
#define REFR 2
#define SPEC 3
#define COAT 4
#define CARCOAT 5
#define TRANSLUCENT 6
#define SPECSUB 7
#define CHECK 8
#define WATER 9
#define PBR_MATERIAL 10
#define WOOD 11
#define SEAFLOOR 12
#define TERRAIN 13
#define CLOTH 14
#define LIGHTWOOD 15
#define DARKWOOD 16
#define PAINTING 17
#define METALCOAT 18

// (1 / 2048 texture width)
#define INV_TEXTURE_WIDTH 1.0 / 2048.0



// -----------------------------
// OUT COLORS
// -----------------------------
out vec4 outColor;   


// -----------------------------
// IN COLORS
// -----------------------------

uniform sampler2D inColor0;
//uniform sampler2D inColor1;
//uniform sampler2D inColor2;

// -----------------------------
// UNIFORMS
// -----------------------------

uniform float CANVAS_WIDTH;
uniform float CANVAS_HEIGHT;




//-----------------------------------------------------------------------
vec4 getTestColorFromPixelPosition(vec2 pixelPos)
//-----------------------------------------------------------------------
{
	return vec4(pixelPos.x, pixelPos.y, 0.5, 1.0);
}

//-----------------------------------------------------------------------
vec4 getPixel(sampler2D image, int column, int row)
//-----------------------------------------------------------------------
{
	return texelFetch(image, ivec2(column, row), 0);
}

//-----------------------------------------------------------------------
vec4 getPixel(sampler2D image, vec2 pixelPos)
//-----------------------------------------------------------------------
{
	return texture(image, pixelPos);
}


//-----------------------------------------------------------------------
void main( void )
//-----------------------------------------------------------------------
{
	ivec2 pixelPosInt = ivec2(gl_FragCoord.xy);
	vec2 pixelPosFloat = (gl_FragCoord.xy / vec2(CANVAS_WIDTH, CANVAS_HEIGHT));

	vec4 tmp = getPixel(inColor0, pixelPosInt.x, pixelPosInt.y);

	outColor = tmp.xyzw;

	//outColor = getTestColorFromPixelPosition(pixelPosFloat);
	//outColor= vec4(1, .5, .3, .7);   // orange
}