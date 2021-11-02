# Food Coop Shop Adaption of Manly Food Co-ops Vend Weigh Scale Extension

How does it work?

Startup script located in C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Startup
Two scripts are run: start_cash_drawer_server.vbs and start_weigh_scale_server.vbs

	start_weigh_scale_server.vbs 
	- just runs: node C:\Users\user\weigh_scales\weigh_scale_server.js

	weigh_scale_server.js
	 - starts a node server on localhost:3000
	 - it can't be run twice so if its not running then it wasn't running in the first place!
	 
	 
	Chrome extension running in Vend window queries this server in response 
	- read the weight from the scales or 
	- open the cash draw
	
	
	start_cash_drawer_server.vbs 
	- just runs: node C:\Users\user\weigh_scales\receipt_printer_server.js
	
	receipt_printer_server.js
		- starts a node server on localhost:3001

24/10/2021 attempt to fix:
 - JM moved the scales over to the cafe side and was hoping to get them working on a different computer
 - looks like the problem is the installed version of node on the new machine is 14 and the version on the old till computer is 10
 - the server is giving errors saying that the API of the serial port has changed... so either rewrite code and update or downgrade the node version
 
30/23/2019 improvements:
 - Auto detect com ports at each scale or till draw request
 - Just down to one chrome extension and one node server program

28/12/2019 fix:
 - Check extensions running: yes
 - Use task manager to see if node processes are running
 - Check manual IP address scales: http://localhost:3000 ->  "Error: this is taking too long com port is set to COM19"
	- Open Termite, it automatically opens COM25... 
		- How can I tell which COM port the scales are on?
		- Change the connection settings on Termite to the COM port you want to test (e.g. COM25)...
		and these settings: 9600 8N1 no handshake
		- Type "0x05" into termite -> should get back 06
		- Type "0x11" ... should get back the current weight
	- COM was set to COM19 but it is actually COM25 now.
	- Is there a way to detect the com port on startup the way that termite does?
		- If you go to StartMenu -> Devices and Printers... you can see "Prolific USB to Serial Com port (COM25)" listed as a device.
		- Press "windows key" then type "printers" and enter to get a shortcut to this.
		- This lets you know the com port...
 - Receipt printer not working either... was set to COM15
	- How do I find the number of the receipt printer?
		- Listed under printers and devices as "USB Communcation Device (COM26)"
		- You can use termite to test this by opening COM26 19200 bps, 8N1, no handshake
			- then type "0x1b700032ff"
			- make sure no node processes are running with the task manager
 - To do: 
	* need to alert people somehow if there is an error in the startup scripts. 
	* Need to make a vbs script which takes the port name as a command line option
	* Need coordinators to be able to look at the "printers", change the port numbers (e.g. in a file), and restart the node processes
	 * could we set the port name from a server request? Or need a popup status once those node processes are running
 
		
			
		
		
6/9/2019 fix:
 - Check extensions running: yes
 - Check manual IP address scales: http://localhost:3000 -> "scale status: 2 -> this is taking too long
	- Check USB port with Termite (code has it set to COM )
	- Receipt printer wasn't turned on - don't know why
	- Looks like weigh_scale_server.js was set to wrong COM port (COM18) where termite is saying the scale is COM19.
		- Change code and restart server. But how to restart server or service? Without restarting computer
		- Open task manager and shut down the node processes. start them back up by running the batch files.
		- So that was the problem: COM port number had changed probably because things had been unplugged and plugged back in.
		
17/7/2019 fix: 
	- for some reason the startup scripts weren't run or were stopped so there were no servers running.
	- Also the chrome browser didn't have the extensions enabled.
 
 


# Manly Food Co-op's setup notes below (probably written by Mcgennes Weate)

Setup

Architecture:  Chrome Extension (hotkeys) calls --> NodeJS APP that reads scales <-- Scales via RS232

Configure scale
---------------

Scale model: CAS SW-IC RS
1) Power off
2) hold down "0" and press power button
3) at "U Set" press 0
4) keep pressing "T" until display reads "typ 4"
5) keep pressing "0" till scale starts

(for info on protocol type 4 see: http://www.cas-usa.com/media/software/interface-scales/OPOS%20scale%20Protocol%20sheet_v14%20-%2020160726.pdf
but basically it means the scale is waiting at 9600, 7 bits, 1 stop bit, even parity for: W<CR> (or 57h + odh) before respoding with weight)

Plug in USB serial cable and install its driver
-----------------------------------------------
(see https://www.jaycar.com.au/usb-to-db9m-rs-232-converter-1-5m/p/XC4834)
It will probably install to COM3

Install NODE JS
---------------
This platform + app forms the GW between the serial port and scales.    
1) go to https://nodejs.org/en/, download and install
2) At the Node JS command prompt, run: "npm install serialport"
3) Add go.vbs to startup folder

Install the Chrome Extension
----------------------------
1) go to chrome menu "extentions" and start "developer" model
2) load "unpacked" manifest from install folder













APPENDIX
--------
APP.JS code
const http = require('http');
//const express = require('express');
//const app = express();

const hostname = '127.0.0.1';
const httpport = 3000;
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

// path /dev/tty.XXX on Mac/Linux, or COM3 on Windows
const port = new SerialPort("COM3", { baudRate: 9600, dataBits: 7, parity: 'even', function (err) {
  if (err) {
    return console.log('Error opening serial port. Edit APP.JS file: ', err.message)
} }});

const parser = new Readline();

port.pipe(parser);
parser.on('data', DataReceived);


var scaleWeight;
var scaleStatus
var Response;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  Response = res;
  res.setHeader('Content-Type', 'text/plain');
  var payload = GetScaleData();
  
  
});


server.listen(httpport, hostname, () => {
  console.log(`Server running at http://${hostname}:${httpport}/`);
});

var retryloop = 0;

function GetScaleData() {
	
	scaleWeight="";
	scaleStatus="";
	retryloop=0;
	port.write('\x57\x0d');
	

}

function DataReceived(line)
{
	 console.log("]]" + line + "[[");
	 if (line.indexOf("KG") > -1)
	 {
		 scaleWeight = line.substring(0,6);
	 }
	 else
	 {
		 scaleStatus = line.substring(1,2);
	 }
	 
    if (scaleStatus != "" && scaleWeight != "")
	{
		var res = "{scaleWeight: " + scaleWeight + ",scaleStatus: " + scaleStatus + "}";
		console.log(res);
		Response.end(res);
	}
		
	
}