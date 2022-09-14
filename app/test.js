const { SerialPort } = require('serialport')
const { ByteLengthParser } = require('@serialport/parser-byte-length')

const weighScaleID = 'Prolific'

async function detectCOMPorts () {
  let weighScale
  const ports = await SerialPort.list()
  for (const port of ports) {
    console.log(JSON.stringify(port))
    if (port.manufacturer === weighScaleID) {
      console.log('* Found weigh scale on ' + port.path)
      weighScale = port.path
    }
  }
  return { weighScale }
}

let counter = 0
function readScales (comPort) {
  return new Promise((resolve, reject) => {
    if (!comPort) {
      return reject(new Error('Couldn\'t detect COM port for weigh scales. Maybe scale is turned off or unplugged. Try http://localhost:3000 for more info'))
    }
    const port = new SerialPort({ path: comPort, baudRate: 9600, dataBits: 8, parity: 'none', stopBits: 1 }, err => {
      if (err) return reject(err)
    })
    port.on('error', err => {
      console.log('ERR:', err)
      if (err) return reject(err)
    })
    const parser = new ByteLengthParser({ length: 1 })
    port.pipe(parser)
    parser.on('data', onPrepare)
    const readTimeout = setTimeout(onTimeout, 1000)
    port.write([0x05], err => {
      if (!err) return
      console.log('write error:', err)
      reject(err)
    })

    function onPrepare (readyByte) {
      console.log('PREP:', readyByte)
      if (readyByte[0] === 0x06) {
        parser.removeListener('data', onPrepare)
        parser.on('data', onReadWeight)
        port.write([0x11])
      } else if (readyByte[0] === 0x05) {
        // this is the data we sent, increase the counter and try again
        if (counter > 5) closePort('Error: Scale was not ready code(loop) ' + readyByte)
        counter++
        //port.write([0x05])
      } else {
        closePort('Error: Scale was not ready code ' + readyByte)
      }
    }

    let readWeight = ''
    function onReadWeight (weightByte) {
      console.log('WEIGHT(byte):', weightByte)
      readWeight += weightByte
      if (readWeight.length >= 15) {
        clearTimeout(readTimeout)
        console.log('WEIGHT:', readWeight)
        console.log('WEIGHT(str):', readWeight.toString().substring(3, 10))
        const scaleWeight = parseFloat(readWeight.toString().substring(3, 10))
        closePort('Scale read ok', false, scaleWeight)
      }
    }

    function onTimeout () {
      console.log('--TIMEOUT--')
      closePort('Error: weigh scales are taking too long. Maybe scales are turned off or unplugged. Try http://localhost:3000 for more info')
    }

    function closePort (msg, errStatus = true, weight = -1) {
      clearTimeout(readTimeout)
      port.close(err => {
        if (err) { msg += ' and error on closing: ' + err.message }
        // finishScaleRead(msg, errStatus, weight)
        const retObj = { scaleWeight: weight, err: errStatus, msg }
        resolve(retObj)
      })
    }
  })
}

async function main () {
  const { weighScale } = await detectCOMPorts()
  try {
    const output = await readScales(weighScale)
    console.log('OUTPUT:', output)
  } catch (err) {
    console.log('FAIL:', err)
  }
}

main()
