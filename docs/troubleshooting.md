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