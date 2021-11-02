const http = require('http');
//const express = require('express');
//const app = express();

const hostname = '127.0.0.1';
const httpport = 3000;
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

// path /dev/tty.XXX on Mac/Linux, or COM3 on Windows
const port = new SerialPort("COM3", { baudRate: 9600, dataBits: 8, parity: 'none', function (err) {
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  var payload = GetScaleData();
  
  
});


server.listen(httpport, hostname, () => {
  console.log(`Server running at http://${hostname}:${httpport}/`);
});

var retryloop = 0;

function GetScaleData() {
	
	scaleWeight="";
	scaleStatus="99";
	retryloop=0;
	port.write('\x05\x11');
	

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


