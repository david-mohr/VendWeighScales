import { SerialPort } from 'serialport'
import { ByteLengthParser } from '@serialport/parser-byte-length'

const weighScaleID = 'Prolific'
const receiptPrinterID = 'Posiflex Technology Inc'

async function detectCOMPorts () {
  let weighScale, receiptPrinter
  const ports = await SerialPort.list()
  let portText = '<html><body><a href="/scale">Scale</a><br>'
  for (const port of ports) {
    portText += `<pre>${JSON.stringify(port)}</pre>`
    if (port.manufacturer === weighScaleID) {
      portText += 'Found weigh scale on ' + port.path + '\n'
      weighScale = port.path
    }
    if (port.manufacturer === receiptPrinterID) {
      portText += 'Found receipt printer on ' + port.path + '\n'
      receiptPrinter = port.path
    }
  }
  portText += '</body></html>'
  return { portText, weighScale, receiptPrinter }
}

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