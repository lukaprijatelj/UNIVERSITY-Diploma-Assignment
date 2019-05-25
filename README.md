# UNIVERSITY-Diploma-Assignment

Run VS code debugger and go to browser and type "http://localhost:30000/"

## Demo verzija
http://lukaprij.wwwnl1-ss11.a2hosted.com/clientAdmin

## Libraries used
- SocketIO (bidirectional communication between server and client. It can also send to all clients at once)
- glMatrix (vector and matrix operations )

## NPM packages used
- MongoDB
- ExpressJS
- uuidv1 (for GUID key generation for database tables)

# UI design inspiration
https://www.behance.net/gallery/80267021/Xave-Expense-Tracker


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
Username (cPanel/SSH/FTP):  lukaprij
Password (cPanel/SSH/FTP):  dg[OC3tS.86tC4

Open putty SSH and type
screen
cd University-Diploma
nohup npm start --production &     // so that app starts in background

then press CTRL+a+d so that you go back to normal shell
close putty terminal