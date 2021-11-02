const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

// path /dev/tty.XXX on Mac/Linux, or COM3 on Windows
console.log("About to open serial port...");
/*
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

//port.pipe(parser);
//parser.on('data', onPortDataReceived);

function onPortDataReceived(line) {
	console.log("]] " + line + " [[");
}
*/



  SerialPort.list((err, ports) => {
    ports.forEach((port) => {
      //portsList.push(port.comName);
	  console.log("port ", port.comName);
	  console.log(port);
  })});
	
	console.log("done");


