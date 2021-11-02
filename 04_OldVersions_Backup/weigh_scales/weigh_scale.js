const SerialPort = require('serialport')
const ByteLength = require('@serialport/parser-byte-length')
const portName = "COM3"
const port = new SerialPort(portName, { baudRate: 9600, dataBits: 8, parity: 'none', stopBits: 1}, onPortOpened)

function onPortOpened(err) {
	if (err) {
		console.log("Error: could not open serial port " + portName + " maybe the scale has been unplugged. You'll need to edit the ");
		return;
	}
	console.log("Port " + portName + " opened successfully");
}

const parser = new ByteLength({length: 1})
port.pipe(parser)
parser.on('data', onData);

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
			console.log("read the weight as: " + parseFloat(readWeight.substring(3, 10)) + " whole weight: " + readWeight);
		}
		return;
	}
	
	if (scaleStatus == scaleState.IDLE) {
		console.log("Error: unknown codes " + bInt);
	}
}

function scaleTimeout() {
	console.log("Error: this is taking too long");
}



