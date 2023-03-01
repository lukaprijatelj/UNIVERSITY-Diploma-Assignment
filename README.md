<!-- Tags (https://shields.io/) -->
![GitHub](https://img.shields.io/github/license/lukaprijatelj/UNIVERSITY-Diploma-Assignment)

# UNIVERSITY-Diploma-Assignment
The main objective of our graduation thesis is to present development of the 3D scenes rendering system by using distributed devices that require only web browser for their functioning. The system we developed enables new devices to integrate in the system during the rendering process itself. Client taking part in rendering can monitor progress of other clients. When rendering is completed, every client sees entire rendered image. We will present implementation plan and initial conditions that guided us during planning. We will describe server operations and its role in the system. We will represent various types of communications among the server and clients. In the client’s scope, we will describe their operations and method used to render 3D scene. Further, we will also present problems we encountered during implementation of scene rendering. We will describe results obtained by rendering the two test scenes. Results will be represented in graphs which also present time complexity of rendering cells. At the end, we will describe our findings and potential improvements for system’s acceleration.


Run VS code debugger and go to browser and type "http://localhost:30003/admin"

## Screenshots
<!--  ![alt tag](https://raw.githubusercontent.com/lukaprijatelj/UNIVERSITY-Diploma-Assignment/master/images/Screenshot_1.jpg) -->
<!--  ![alt tag](https://raw.githubusercontent.com/lukaprijatelj/UNIVERSITY-Diploma-Assignment/master/images/All.jpg) -->
![alt tag](https://raw.githubusercontent.com/lukaprijatelj/UNIVERSITY-Diploma-Assignment/master/images/rendered-image-castle.jpg)
![alt tag](https://raw.githubusercontent.com/lukaprijatelj/UNIVERSITY-Diploma-Assignment/master/images/partially-rendered.jpg)
![alt tag](https://raw.githubusercontent.com/lukaprijatelj/UNIVERSITY-Diploma-Assignment/master/images/30-clients-rendering.jpg)

## NPM packages used (libraries/technologies)
- Javascript ES6
- Sass 1.22
- ThreeJS 0.103
- WebGL 2.0 	                 (OpenGL es 2.0 - glsl)
- SocketIO 2.2.0 			         (bidirectional communication between server and client. It can also send to all clients at once)
- ExpressJS 4.16
- glMatrix 				             (vector and matrix operations)
- uuidv1 				               (for GUID key generation for database tables)

## Browser compatibility
- Internet Explorer 11 			(not supported - because of CSS3 variables and anonymous functions)
- Microsoft Edge 79
- Mozilla Firefox 24
- Google Chrome 33
- Opera 19


# Compiling project with NPM
npm run build				(Compiling task will be read from scripts property of the package.json file)


# Used ports
HTTP protocol uses port 30003 
SocketIO library uses port 30004

## How to open admin webpage
<base-url>:<http-port>/admin		(example: localhost:30003/admin)

## How to open client webpage
<base-url>:<http-port>/client		(example: localhost:30003/client)


# Notes and development
I have used Typescript and Sass (scss) for submodules. For synchronization with server I have used SocketIO library.
I used browsers Local storage for saving data received from server.

## Chrome browser connecting with Android mobile phone
- Use command prompt to run ADB, in cmd go to the install directory of the ADB tools and type:
  adb.exe				(starts program)
  adb start-server 			(or "adb kill-server")
- Connect phone and browse to about:inspect in Chrome on desktop, ensuring a Chrome browser is open on your device
