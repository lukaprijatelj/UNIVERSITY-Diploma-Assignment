<!-- Tags (https://shields.io/) -->
![GitHub](https://img.shields.io/github/license/lukaprijatelj/UNIVERSITY-Diploma-Assignment)

# UNIVERSITY-Diploma-Assignment
Run VS code debugger and go to browser and type "http://localhost:30003/admin"

## Screenshots
<!--  ![alt tag](https://raw.githubusercontent.com/lukaprijatelj/UNIVERSITY-Diploma-Assignment/master/images/Screenshot_1.jpg) -->
<!--  ![alt tag](https://raw.githubusercontent.com/lukaprijatelj/UNIVERSITY-Diploma-Assignment/master/images/All.jpg) -->
![alt tag](https://raw.githubusercontent.com/lukaprijatelj/UNIVERSITY-Diploma-Assignment/master/images/rendered-image-castle.jpg)
![alt tag](https://raw.githubusercontent.com/lukaprijatelj/UNIVERSITY-Diploma-Assignment/master/images/partially-rendered.jpg)

## Libraries/technologies used
- SocketIO (bidirectional communication between server and client. It can also send to all clients at once)
- glMatrix (vector and matrix operations)
- Typescript
- Sass (Scss)
- WebGL (OpenGL es 2.0 - glsl)
- ThreeJS

## NPM Packages used
- ExpressJS
- uuidv1 (for GUID key generation for database tables)

## Browser compatibility
- Internet Explorer (not supported - because of CSS3 variables and anonymous functions)
- Microsoft Edge
- Mozilla Firefox
- Google Chrome
- Opera


# Building project with NPM
npm run build
*Build task will be read from scripts property of the package.json file.

# Used ports
HTTP protocol uses port 30003 
SocketIO library uses port 30004

## How to open admin
	<base-url>:<http-port>/admin
	(example: localhost:30003/admin)

## How to open client
	<base-url>:<http-port>/client
	(example: localhost:30003/client)


# Notes and development
I have used Typescript and Sass (scss) for submodules. For synchronization with server I have used SocketIO library.
I used browsersLocal storage for saving data received from server.

## Abbreviations
	SRGB	-	Standard Red Green Blue
	PBR		-	Physically Based Renderer
	RGBA
	CSS
	HTML
	CPU
	GPE
	BVH 	- bounding volume hierarchy (BVH) is a tree structure on a set of geometric objects.
	Color bleading
	texel - texture pixel
	aabb tree
	BVH - bounding volume hierarchy

## convert color from Linear to Gamma
255 * POWER(linearvalue / 255, 1 / 2.2)

## convert color from Gamma To Linear
255 * POWER(gammavalue / 255, 2.2)

## Chrome browser connecting with Android mobile phone
- Use command prompt to run ADB, in cmd go to the install directory of the ADB tools and type:
	// start program
	adb.exe
	// and then
 	adb start-server (or "adb kill-server")
- Connect phone and browse to about:inspect in Chrome on desktop, ensuring a Chrome browser is open on your device
