# CBR Food Coop's* Vend Weigh Scale Extension
### *Adapted from Manly Food Coop's Vend Weigh Scale Extension

## What is it?

The Vend cloud based POS software has [no plans of supporting any kind of weigh scales](https://support.vendhq.com/hc/en-us/articles/360000716176-Can-I-connect-Vend-to-my-weighing-scale-) (for selling things like fruit and veg). Amazingly some people at the Manly Food Co-op worked out a way to do it. Manly Food Co-op has the CAS SW-IC RS model weigh scale whereas we in Canberra have the older CAS AP-1. We have adapted their Chrome extension to suit.

# Installation
If you need to get the weigh scale working on a new system try this:
1. Download the pre-built executable
2. Download nssm: https://nssm.cc/download
3. Install the pre-built executable as a service with nssm
4. Make sure the weigh scale is hooked up to a USB port with the special cable (this cable is a modified serial cable)
4. Test that server is working by going to http://localhost:3000/scale
4. Install the Chrome Extension and enable the extension

# Troubleshooting
If the scales don't function in Vend, try the following in this order:

1. Put something on the weigh scale so that it displays a weight that is not zero (e.g. put an empty jar or a banana on it).

2. Open a new browser tab and go to <http://localhost:3000/scale>

	* If the wheel turns forever or you see "server not found" type page. It means that the node server script is not running. You need to somehow run "node weigh_scale_server.js" or run the .vbs script or start the pre-built executable as a service.

	* If you see a message like this:

		```
		{"scaleWeight":-1,"err":true,"msg":"Couldn't detect COM port for weigh scales. Maybe scale is turned off or unplugged. Try <http://localhost:3000> for more info"}
		```

		It means that there is something wrong with the weigh scale or its connection to the computer.

		If you see a message like this:

		```
		{"scaleWeight":0.34,"err":false,"msg":"OK"}
		```

		It means that the scale is working fine and communicating with the computer but there is something wrong with the Chrome Extension.

3. To check the Chrome Extension side of things, go to the Vend window in Chrome and click on the puzzle icon to see the currently running extensions. Find the extension called `FoodCoop-scales` and make sure its switched on. You are going to have to be in "Developer Mode" to switch this extension on.

4. If none of this works, or is confusing, call for help and/or send and email to the manager!

# Development

## Quick release guide
```
./release.sh
```

Clone this github repo onto your local machine.

Make sure you have Node.js **version 14** install on your local machine. 

You can heck which version of Node you have by running:
```shell
node --version`
```

If you have a newer version of Node it might be useful to use the [Node Version Manager - nvm](https://github.com/nvm-sh/nvm) to install and manage older versions of Node. 

Install `nvm` with the curl or wget commands listed on the github page. On mac I think there is also a homebrew formula you can use.

Once `nvm` is installed, run 
```shell
nvm use 14
```
to switch to node version 10.

Check that you are now running the correct version of node with
```shell
node --version
```
Any 14.x version of Node.js should be fine.

Now change into the `app` directory and run 
```shell
yarn
```

Spin up a weigh scale server with the command 
```shell 
node weigh_scale_server.js
```

Test that the weigh scale is working properly by opening a browser tab to <http://localhost:3000/scale>

Now you're ready to start modifying weigh_scale_server.js with your changes.
### Packaging the Node Server as a Windows binary

We use [pkg](https://github.com/vercel/pkg) to package `weigh_scale_server.js` into a windows binary so you don't have to install the correct version of Node on the POS machine.

To package up a binary version of the server do the following...

Get into the server code directory:
```shell
cd app
```

Switch to Node.js version 10:
```shell
nvm use 14
```

Make sure version 10 is active:
```shell
node --version
```

Install the dependencies:
```shell
yarn
```

Package the binaries:
```shell
yarn pkg:win
```

This above command will run a script defined in package.json which uses pkg to generate binaries of the server for win, mac and linux. The generated binaries can be found in the /bin directory.


## How does it work?

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

## Roadmap - what's next?

Co-managers have had trouble installing the extension on other / newer computers. 
It would be great if this process was a bit more user friendly and "foolproof" (just using the expression here, not accusing anyone in particular of being a fool!)

Dave has suggested these aims could be achieved by using https://github.com/vercel/pkg to turn the node environment into a windows executable and then https://nssm.cc/ to turn it into a service that will automatically be started again in the event it crashes.

Also the extension seems to stop working intermittently, usually someone like myself has to come in and fix it. JM would love to have a troubleshooting guide so volunteers and coordinators could get it back up and running if it fails.

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
