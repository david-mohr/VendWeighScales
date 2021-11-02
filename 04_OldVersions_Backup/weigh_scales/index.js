const http = require('http');

const hostname = '127.0.0.1';
const httpport = 3000;
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

// path /dev/tty.XXX on Mac/Linux, or COM3 on Windows
console.log("About to open serial port...");

const port = new SerialPort(
		"COM17", 
		{ baudRate: 9600, dataBits: 8, stopBits: 1, parity: 'none', onSerialPortOpened}
	);

function onSerialPortOpened(err) {
  	if (err) {
    		return console.log('Error opening serial port. Edit index.js file: ', err.message)
	} 
	console.log("Opened serial connection to weigh scale");
}

const parser = new Readline();

port.pipe(parser);
parser.on('data', onPortDataReceived);


var scaleWeight;
var scaleStatus;
var serverResponse;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Access-Control-Allow-Origin', '*');
  serverResponse = res;
  res.end("dead");
  console.log("got somethign");
	readScale();
  
});


server.listen(httpport, hostname, () => {
  console.log(`Server running at http://${hostname}:${httpport}/`);
});


function readScale(res) {
	port.write('\x05');
console.log("wrote");
}

function onPortDataReceived(line) {
	console.log("]] " + line + " [[");
	const scaleResponse = {scaleStatus: "timeout", scaleWeight: 6};
	serverResponse.end(JSON.stringify(scaleResponse));
}




var retryloop = 0;

function GetScaleData() {
	
	scaleWeight="";
	scaleStatus="99";
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
		 scaleStatus = line.substring(1,3);
	 }
	 
    if (scaleStatus != "" && scaleWeight != "")
	{
		var res = '{"scaleWeight": "' + scaleWeight + '","scaleStatus": "' + scaleStatus + '"}';
		console.log(res);
		Response.end(res);
	}

	
}


