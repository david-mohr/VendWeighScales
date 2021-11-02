const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const port = new SerialPort("COM15", { baudRate: 19200, dataBits: 8, parity: 'none', stopBits: 1})

const parser = new Readline()
port.pipe(parser)

parser.on('data', line => console.log("resp: " + line));

function openCashDraw() {
	port.write([0x1b, 0x70, 0x00, 0x32, 0xff]);
	port.drain();
}
