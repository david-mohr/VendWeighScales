const { SerialPort } = require('serialport')
const { ByteLengthParser } = require('@serialport/parser-byte-length')
const http = require('http')

const weighScaleID = 'Prolific'
const receiptPrinterID = 'Posiflex Technology Inc'

// Get server up and running to handle requests for scale weight
const hostname = '127.0.0.1'
const httpport = 3000
let scale = 'COM3'

const server = http.createServer(onServerRequest)
server.listen(httpport, hostname, () => console.log(`Server running at http://${hostname}:${httpport}/`))

async function onServerRequest (req, res) {
  const endServerRequest = (outputText) => res.end(outputText)
  res.statusCode = 200
  res.setHeader('Access-Control-Allow-Origin', '*')

  if (req.url === '/scale') {
    res.setHeader('Content-Type', 'text/plain')
    if (!scale) {
      const { weighScale } = await detectCOMPorts()
      scale = weighScale
    }
    try {
      const output = await readScales(scale)
      return res.end(JSON.stringify(output))
    } catch (err) {
      // TODO
      console.log(err)
      return res.end(err.message || 'Didn\'t work')
    }
  }

  if (req.url === '/till') {
    res.setHeader('Content-Type', 'text/plain')
    const { receiptPrinter } = await detectCOMPorts()
    return openTill(receiptPrinter, endServerRequest)
  }

  const { portText } = await detectCOMPorts()
  res.setHeader('Content-Type', 'text/html')
  endServerRequest(portText)
}

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
