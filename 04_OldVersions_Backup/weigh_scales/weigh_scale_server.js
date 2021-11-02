const SerialPort = require('serialport')
const ByteLength = require('@serialport/parser-byte-length')
const http = require('http')

// Establish serial link with weigh scale

const portName = "COM25"
const port = new SerialPort(portName, { baudRate: 9600, dataBits: 8, parity: 'none', stopBits: 1}, onPortOpened)
const parser = new ByteLength({length: 1})
port.pipe(parser)
parser.on('data', onData);
function onPortOpened(err) {
	if (err) {
		console.log("Error: could not open serial port " + portName + " maybe the scale has been unplugged. You'll need to edit the ");
		return;
	}
	console.log("Serial link established with weigh scale on port " + portName);
}


// Get server up and running to handle requests for scale weight

const hostname = '127.0.0.1'
const httpport = 3000
let serverResponse = undefined

const server = http.createServer(onServerRequest)

server.listen(httpport, hostname, () => console.log(`Server running at http://${hostname}:${httpport}/`))

function onServerRequest(req, res) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Access-Control-Allow-Origin', '*');
  serverResponse = res;
  console.log("got a request...");
  readScale();
}


// Scale handling code...

const scaleState = {IDLE: 1, PREPARE: 2, READWEIGHT:3}

let scaleStatus = scaleState.IDLE;
let readTimeout = undefined;
let readWeight = "";
let readWeightCount = 0;

function readScale() {
	scaleStatus = scaleState.PREPARE;
	readTimeout = setTimeout(scaleTimeout, 1000);
	readWeight = "";
	readWeightCount = 0;
	port.write([0x05]);
}

function onData(byte) {
	
	const bInt = ("" + byte).charCodeAt(0);
	
	if (scaleStatus == scaleState.PREPARE) {
		if (bInt == 0x06) {
			scaleStatus = scaleState.READWEIGHT;
			port.write([0x11]);
		} else {
			console.log("Error: Scale was not ready code " + bInt)
		}
		return;
	}

	if (scaleStatus == scaleState.READWEIGHT) {
		readWeight += byte;
		readWeightCount++;

		if (readWeightCount >= 15) {
			scaleStatus = scaleState.IDLE;
			clearTimeout(readTimeout);
			const scaleWeight = parseFloat(readWeight.substring(3, 10));
			console.log("read the weight as: " + scaleWeight + " whole weight: " + readWeight);
			if (serverResponse) {
				const r = 
				serverResponse.end(makeResultJSON(scaleWeight, scaleStatus, "ok"));
				serverResponse = undefined;
			}
		}
		return;
	}
	
	if (scaleStatus == scaleState.IDLE) {
		console.log("Error: unknown codes " + bInt);
		if (serverResponse) {
			serverResponse.end(makeResultJSON(0, scaleStatus, "Error: unknown codes!"));
			serverResponse = undefined;
		}
	}
}

function scaleTimeout() {
	console.log("Error: this is taking too long");
	if (serverResponse) {
		serverResponse.end(makeResultJSON(0, scaleStatus, "Error: this is taking too long" + " com port is set to " + portName));
		serverResponse = undefined;
	}
}

function makeResultJSON(weight, sStatus, msg) {
	return '{"scaleWeight": "' + weight + '","scaleStatus": "' + sStatus + '","scaleMessage": "' + msg + '"}';
}




