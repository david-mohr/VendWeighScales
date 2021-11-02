const SerialPort = require('serialport')
const ByteLength = require('@serialport/parser-byte-length')
const http = require('http')
const weighScaleID = "Prolific";
const receiptPrinterID = "Posiflex Technology Inc";


// Get server up and running to handle requests for scale weight
const hostname = '127.0.0.1'
const httpport = 3000
let serverResponse = undefined
let portListText = undefined
let weighScaleCOM = undefined // Should be COM26 or similar
let receiptPrinterCOM = undefined // Should be COM27 or similar

const server = http.createServer(onServerRequest)

server.listen(httpport, hostname, () => console.log(`Server running at http://${hostname}:${httpport}/`))

function onServerRequest(req, res) {
	res.statusCode = 200;
	res.setHeader('Content-Type', 'text/plain');
	res.setHeader('Access-Control-Allow-Origin', '*');
	serverResponse = res;

	if (req.url == "/scale") {
	detectCOMPorts((portText, weighScale) => {readScales(weighScale, endServerRequest)});
	return;
	}

	if (req.url == "/till") {
	detectCOMPorts((portText, weighScale, receiptPrinter) => {openTill(receiptPrinter, endServerRequest)});
	return;
	}

	detectCOMPorts((portText) => endServerRequest(portText));

	function endServerRequest(outputText) {
	res.end(outputText)
	}
}

function detectCOMPorts(onPortsDetected) {
	weighScaleCOM = undefined
	receiptPrinterCOM = undefined
	SerialPort.list((err, ports) => {
		if (err) { onPortsDetected("Port listing error " + err.message); return; }
		portListText = ""
		ports.forEach((port) => { 
			portListText += JSON.stringify(port) + "\n"; 
			if (port.manufacturer == weighScaleID) {
				portListText += "Found weigh scale on " + port.comName + "\n";
				weighScaleCOM = port.comName;
			}
			if (port.manufacturer == receiptPrinterID) {
				portListText += "Found receipt printer on " + port.comName + "\n";
				receiptPrinterCOM = port.comName;
			}
		});
		onPortsDetected(portListText, weighScaleCOM, receiptPrinterCOM);
	});	
}


function readScales(comPort, onScaleRead) {
	
	if (!comPort) {
		finishScaleRead("Couldn't detect COM port for weigh scales. Try http://localhost:3000 for more info"); 
		return;
	}
	
	let readTimeout = undefined;
	let readWeight = "";
	let readWeightCount = 0;
	
	const port = new SerialPort(comPort, { baudRate: 9600, dataBits: 8, parity: 'none', stopBits: 1}, onPortOpened)
	
	function onPortOpened(err) {
		
		if (err) {
			finishScaleRead("Error opening port for weigh scales on " + comPort + "\nError: " + err.message + "\n Try http://localhost:3000 for more info"); 
			return; 
		}
		
		const parser = new ByteLength({length: 1})
		port.pipe(parser)
		parser.on('data', onPrepare);
		readTimeout = setTimeout(onTimeout, 1000);
		port.write([0x05]);	
		
		function onPrepare(readyByte) {
			const bReady = ("" + readyByte).charCodeAt(0);
			if (bReady == 0x06) {
				parser.removeListener('data', onPrepare)
				parser.on('data', onReadWeight)
				port.write([0x11]);
			} else {
				closePort("Error: Scale was not ready code " + bReady)
			}		
		}
		
		function onReadWeight(weightByte) {
			readWeight += weightByte;
			readWeightCount++;
			if (readWeightCount >= 15) {
				clearTimeout(readTimeout);
				const scaleWeight = parseFloat(readWeight.substring(3, 10));
				closePort("Scale read ok", false, scaleWeight)
			}	
		}
		
		function onTimeout() {
			closePort("Error: weigh scales are taking too long");
		}
		
		function closePort(msg, errStatus = true, weight = -1) {
			clearTimeout(readTimeout);
			port.close(err => {
				if (err) { msg += " and error on closing: " + err.message }
				finishScaleRead(msg, errStatus, weight);
			})
		}
		
		function finishScaleRead(msg, err = true, weight = -1) {
			const retObj = { scaleWeight: weight, err: err, msg: msg}
			onScaleRead(JSON.stringify(retObj));
		}
		
	}
}


function openTill(comPort, onTillOpened) {

	const port = new SerialPort(comPort, { baudRate: 19200, dataBits: 8, parity: 'none', stopBits: 1}, onPortOpened)

	function onPortOpened(err) {
		if (err) { 
			onTillOpened("Error opening port for till draw on " + comPort + "\nError: " + err.message + "\nTry http://localhost:3000 for more info");
			return;
		}
		port.write([0x1b, 0x70, 0x00, 0x32, 0xff], onDataWritten);
	}
	
	function onDataWritten(err) {
		if (err) {
			closePort(port, "error on write: " + err.message, onTillOpened);
			return;
		}
		port.drain(onDrained);
	}
	
	function onDrained(err) {
		if (err) {
			closePort(port, "error on drain: " + err.message);
			return;
		}
		closePort(port, "Till was succesfully opened", onTillOpened);
	}

	function closePort(openPort, msg, onPortClosed) {
		openPort.close(err => {
			if (err) { msg += " and error on closing: " + err.message }
			onPortClosed(msg);
		})
	}
}


