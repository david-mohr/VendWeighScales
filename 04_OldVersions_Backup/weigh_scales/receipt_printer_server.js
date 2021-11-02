const SerialPort = require('serialport')
const ByteLength = require('@serialport/parser-byte-length')
const http = require('http')


// Get server up and running to handle requests for scale weight

const hostname = '127.0.0.1'
const httpport = 3001
let serverResponse = undefined

const server = http.createServer(onServerRequest)

server.listen(httpport, hostname, () => console.log(`Server running at http://${hostname}:${httpport}/`))

function onServerRequest(req, res) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Access-Control-Allow-Origin', '*');
  serverResponse = res;
  console.log("got a request...");
  openTillDrawer();
}

// Run the open drawer function once at startup to establish baud rate on the port
openTillDrawer();

function openTillDrawer() {
	// Establish serial link with printer

	const portName = "COM26"
	const port = new SerialPort(portName, { baudRate: 19200, dataBits: 8, parity: 'none', stopBits: 1}, onPortOpened)

	function onPortOpened(err) {
		if (err) {
			reportError("Error: could not open serial port " + portName + " maybe the receipt printer has been unplugged. You'll need to edit the code");
			return;
		}
		console.log("Serial link established with printer on port " + portName);
		port.write([0x1b, 0x70, 0x00, 0x32, 0xff], onDataWritten);
	}
	
	function onDataWritten(err) {
		if (err) {
			reportError("error on write: " + err.message);
			return;
		}
		port.drain(onDrained);
	}
	
	function onDrained(err) {
		if (err) {
			reportError("error on drain: " + err.message);
			return;
		}
		port.close(onClosed);
	}
	
	function onClosed(err) {
		if (err) {
			reportError("error on close: " + err.message);
		}
		reportError("Till drawer opened!");
	}
	
	function reportError(err) {
		console.log(err);
		if (serverResponse) { 
			serverResponse.end(err);			
		}	
	}

}






