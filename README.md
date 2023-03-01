<!-- Tags (https://shields.io/) -->
![GitHub](https://img.shields.io/github/license/lukaprijatelj/UNIVERSITY-Diploma-Assignment)

# UNIVERSITY-Diploma-Assignment
The main objective of our graduation thesis is to present development of the 3D scenes rendering system by using distributed devices that require only web browser for their functioning. The system we developed enables new devices to integrate in the system during the rendering process itself. Client taking part in rendering can monitor progress of other clients. When rendering is completed, every client sees entire rendered image. We will present implementation plan and initial conditions that guided us during planning. We will describe server operations and its role in the system. We will represent various types of communications among the server and clients. In the client’s scope, we will describe their operations and method used to render 3D scene. Further, we will also present problems we encountered during implementation of scene rendering. We will describe results obtained by rendering the two test scenes. Results will be represented in graphs which also present time complexity of rendering cells. At the end, we will describe our findings and potential improvements for system’s acceleration.

## Screenshots
<!--  ![alt tag](https://raw.githubusercontent.com/lukaprijatelj/UNIVERSITY-Diploma-Assignment/master/images/Screenshot_1.jpg) -->
<!--  ![alt tag](https://raw.githubusercontent.com/lukaprijatelj/UNIVERSITY-Diploma-Assignment/master/images/All.jpg) -->
![alt tag](https://raw.githubusercontent.com/lukaprijatelj/UNIVERSITY-Diploma-Assignment/master/images/rendered-image-castle.jpg)
![alt tag](https://raw.githubusercontent.com/lukaprijatelj/UNIVERSITY-Diploma-Assignment/master/images/partially-rendered.jpg)
![alt tag](https://raw.githubusercontent.com/lukaprijatelj/UNIVERSITY-Diploma-Assignment/master/images/30-clients-rendering.jpg)

## Technologies used (libraries/NPM packages)
- Javascript ES6
- Sass 1.22
- ThreeJS 0.103
- WebGL 2.0 	                 &emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp; (OpenGL es 2.0 - glsl)
- WebSockets (SocketIO 2.2.0) 			         &emsp; (bidirectional communication between server and client. It can also send to all clients at once)
- ExpressJS 4.16
- glMatrix 				             &emsp;&emsp;&emsp;&emsp;&emsp;&emsp; (vector and matrix operations)
- uuidv1 				               &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp;&nbsp; (for GUID key generation for database tables)

## Browser compatibility
- Internet Explorer 11 			   &emsp;&emsp;&emsp; (not supported)
- Microsoft Edge 79
- Mozilla Firefox 24
- Google Chrome 33
- Opera 19

## Compiling project with NPM
npm run build				           &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; (Compiling task will be read from scripts property of the package.json file)

### How to open ADMIN webpage
- Open Web browser and type address:&emsp;   http://localhost:30003/admin
- Load desired 3D scene file like &#42;.obj
- Set up options for scene
- Press START button to send signal to client to start rendering

### How to open CLIENT webpage
- Open Web browser and type address:&emsp;    http://localhost:30003/client
- Browser will automatically start rendering part of the 3D scene
- You can open as many clients/tabs as you like (every client will receive a portion of scene to render)

### Used ports
HTTP protocol uses port 30003. <br />
SocketIO library uses port 30004.

### How to connect Chrome browser with Android mobile phone
- Use command prompt to run ADB, in cmd go to the install directory of the ADB tools and type: <br />
  adb.exe				(starts program) <br />
  adb start-server 			(or "adb kill-server") <br />
- Connect phone and browse to about:inspect in Chrome on desktop, ensuring a Chrome browser is open on your device
