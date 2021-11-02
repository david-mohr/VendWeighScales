const SerialPort = require('serialport')
const ByteLength = require('@serialport/parser-byte-length')
const port = new SerialPort("COM3", { baudRate: 9600, dataBits: 8, parity: 'none', stopBits: 1})

const parser = new ByteLength({length: 1})
port.pipe(parser)

parser.on('data', line => console.log("resp: " + line));

function getReady() {
	port.write([0x05]);
}

function getWeight() {
	port.write([0x11]);
}
