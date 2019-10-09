# UNIVERSITY-Diploma-Assignment
Run VS code debugger and go to browser and type "http://localhost:30003/admin"


# Building 
	npm run build
Build task will be read from scripts property of the package.json file.

## Compiling typescript
	cd <folder-with-tsconfig.json> && tsc

## Compiling Sass (scss)
	sass stylesheets/_root.scss namespace-html.css --style compressed


# TODO:
	- popravil bom canvas.toPNG64 logiko, da bo pošiljala kar celoten blob,zato ker ne rabim več slike
	- odstarnim stare branche
	- dodam v namespace-debug logiko za računanje velikosti programa Object.calculateMB() - calculates size of objects in MB
	  dodam logiko za računanje hitrosti posamezne funkcije IOComplexity - loop through object properies and find function, then add time before and time after and you will calculate speed of execution.
	- spremenim Event.prototype.invoke v Event.invoke() statično funkcijo, saj potem lahko preverim ali je typeof Event ali typeof function in tako invokam funkcijo ali pa event
	- dodam background color oziroma skybox v options dropdown
	- dodam v namespace-debug funkcijo, ki se bo sprehodila po funkcijah in dodala datetime.start in datetime.end za računanje hitrosti funkcij. 
	  Nato bo preko cookiejev zapisala <key>GLOBALS</key><value>.select</value>  izračune. Nato bo en drug window pa to prikazoval in vsakih n milisekund refreshal podatke.
	- optimiziram admin THREEJS kodo, da bo imela far plane fog oziroma blur. Potem bo mogoče hitreje delalo. 
	- popravim WebPage v AdminPage
	- prestavim AdminPage.Scene in AdminPage.Camera v globals.Scene in globals.Camera
	- dodam preostali 2 zdownloadani 3d sceni
	

# Implementation
I have used Typescript and Sass (scss) for submodules. For synchronization with server I have used SocketIO library.


## Demo verzija (cPanel)
http://lukaprij.wwwnl1-ss11.a2hosted.com/admin
http://lukaprij.wwwnl1-ss11.a2hosted.com/client

## Demo verzija (friMinecraft)
http://minecraft.fri.uni-lj.si:30003/admin
http://minecraft.fri.uni-lj.si:30003/client


## Libraries used
- SocketIO (bidirectional communication between server and client. It can also send to all clients at once)
- glMatrix (vector and matrix operations )
- Typescript
- Sass (Scss)


## NPM Packages used
- MongoDB
- ExpressJS
- uuidv1 (for GUID key generation for database tables)


## Browser compatibility
- Internet Explorer (not supported - because of CSS3 variables and anonymous functions)
- Microsoft Edge
- Mozilla Firefox
- Google Chrome
- Opera


# Debugging
"503 Service unavailable" on A2 hosting occurs when bin/www port is incorerct with the one in .htaccess file. 
A2 hosting also has a problem with NodeJS hosting. Servers kill nodejs application when terminal is closed and aplication works in background.

# Shell
Open putty SSH and type
screen
cd University-Diploma
nohup npm start --production &     // so that app starts in background

then press CTRL+a+d so that you go back to normal shell
close putty terminal


## API url scheme
	"/cells/getAll"
	"/cells/getWaiting"
	"/cells/update"
	"/rendering/restart"