import { SerialPort } from 'serialport'
import { ByteLengthParser } from '@serialport/parser-byte-length'
import http from 'http'

const weighScaleID = 'Prolific'
const receiptPrinterID = 'Posiflex Technology Inc'

// Get server up and running to handle requests for scale weight
const hostname = '127.0.0.1'
const httpport = 3000

const server = http.createServer(onServerRequest)
server.listen(httpport, hostname, () => console.log(`Server running at http://${hostname}:${httpport}/`))

async function onServerRequest (req, res) {
  const endServerRequest = (outputText) => res.end(outputText)
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/plain')
  res.setHeader('Access-Control-Allow-Origin', '*')

  if (req.url === '/scale') {
    const { weighScale } = await detectCOMPorts()
    try {
      const output = await readScales(weighScale)
      res.end(output)
    } catch (err) {
      // TODO
      res.end('Didn\'t work')
    }
  }

  if (req.url === '/till') {
    const { receiptPrinter } = await detectCOMPorts()
    return openTill(receiptPrinter, endServerRequest)
  }

  const { portText } = await detectCOMPorts()
  endServerRequest(portText)
}

async function detectCOMPorts () {
  let weighScale, receiptPrinter
  const ports = await SerialPort.list()
  let portText = ''
  for (const port of ports) {
    portText += JSON.stringify(port) + '\n'
    if (port.manufacturer === weighScaleID) {
      portText += 'Found weigh scale on ' + port.path + '\n'
      weighScale = port.path
    }
    if (port.manufacturer === receiptPrinterID) {
      portText += 'Found receipt printer on ' + port.path + '\n'
      receiptPrinter = port.path
    }
  }
  return { portText, weighScale, receiptPrinter }
}

function readScales (comPort) {
  return new Promise((resolve, reject) => {
    if (!comPort) {
      return reject(new Error('Couldn\'t detect COM port for weigh scales. Maybe scale is turned off or unplugged. Try http://localhost:3000 for more info'))
    }
    let readTimeout
    let readWeight = ''
    let readWeightCount = 0

    const port = new SerialPort({ path: comPort, baudRate: 9600, dataBits: 8, parity: 'none', stopBits: 1 }, err => {
      if (err) return reject(err)
    })
    port.on('error', err => {
      if (err) return reject(err)
    })
    const parser = new ByteLengthParser({ length: 1 })
    port.pipe(parser)
    parser.on('data', onPrepare)
    readTimeout = setTimeout(onTimeout, 1000)
    port.write([0x05])

    function onPrepare (readyByte) {
      console.log('DATA:', readyByte)
      const bReady = ('' + readyByte).charCodeAt(0)
      if (bReady === 0x06) {
        parser.removeListener('data', onPrepare)
        parser.on('data', onReadWeight)
        port.write([0x11])
      } else {
        closePort('Error: Scale was not ready code ' + bReady)
      }
    }

    function onReadWeight (weightByte) {
      readWeight += weightByte
      readWeightCount++
      if (readWeightCount >= 15) {
        clearTimeout(readTimeout)
        const scaleWeight = parseFloat(readWeight.substring(3, 10))
        closePort('Scale read ok', false, scaleWeight)
      }
    }

    function onTimeout () {
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

function openTill (comPort, onTillOpened) {
  if (!comPort) {
    onTillOpened('Couldn\'t detect COM port for receipt printer. Maybe the printer is turned off or unplugged. Try http://localhost:3000 for more info')
    return
  }

  const port = new SerialPort(comPort, { baudRate: 19200, dataBits: 8, parity: 'none', stopBits: 1 }, onPortOpened)

  function onPortOpened (err) {
    if (err) {
      onTillOpened('Error opening port for till draw on ' + comPort + '\nError: ' + err.message + '\nTry http://localhost:3000 for more info')
      return
    }
    port.write([0x1b, 0x70, 0x00, 0x32, 0xff], onDataWritten)
  }

  function onDataWritten (err) {
    if (err) {
      closePort(port, 'error on write: ' + err.message, onTillOpened)
      return
    }
    port.drain(onDrained)
  }

  function onDrained (err) {
    if (err) {
      closePort(port, 'error on drain: ' + err.message)
      return
    }
    closePort(port, 'Till was succesfully opened', onTillOpened)
  }

  function closePort (openPort, msg, onPortClosed) {
    openPort.close(err => {
      if (err) { msg += ' and error on closing: ' + err.message }
      onPortClosed(msg)
    })
  }
}
