## Change History

11/12/2021: 12h30 -> 13h30 (1 hour) fixed:
 - Tested http://localhost:3000/scale and it worked
 - Checked the Chrome extension and it wasn't turned on, turned it on and everything worked fine.
 - Couldn't get compiled executable to work on a windows machine
 - Tried nssm and couldn't work it out either

10/12/2021: 11h45 -> 13h45 (2 hours)
 - Try and get nssm and pkg worked out so installation and fixing can be much easier.

7/12/2021 broken:
 - Dave let me know that when plugging and unplugging a USB hub the weigh scales stopped working and in the time he had left he was unable to get them working again.

16/11/2021 fixed:
 - Weigh scale back on old till computer
 - Tested http://localhost:3000 and seems to work
 - No chrome extension installed, try to install it
  - got error: 
		File
		~\Dropbox\PointOfSale\Vend\WeighScales\03_ChromeExtension
		Error
		The "background.scripts" key cannot be used with manifest_version 3. Use the "background.service_worker" key instead.
		Could not load manifest.
 - Got it working!
    changed manifest.json version to 2 (it was 3 for some reason) which meant the extension installed ok
    then had to restart chrome and turn the scale on and off
    test the scale in the browser with http://localhost:3000/scale
 - Did this all while waiting for the board meeting to start
    
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
