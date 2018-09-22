// tslint:disable:member-ordering readonly-keyword
import { AbstractBinding, PortInfo, UpdateOptions, SetOptions } from '@serialport/binding-abstract'
import debug from 'debug'
const logger = debug('serialport/binding-mock')

interface DebugPortInfo extends PortInfo {}

interface MockPort {
  info: DebugPortInfo | any
  data: Buffer
  echo?: Buffer
  record: boolean
  readyData: Buffer
  openOpt: null | any
}

interface PortsList {
  [key: string]: MockPort
}

let ports: PortsList = {}
let serialNumber = 0

function resolveNextTick<T>(value?: T) {
  return new Promise(resolve => process.nextTick(() => resolve(value))) as Promise<T>
}

/**
 * Mock bindings for pretend serialport access
 */
export class MockBinding extends AbstractBinding {
  lastWrite: any
  pendingRead: any
  port: null | MockPort
  recording: Buffer
  serialNumber: number | null
  writeOperation: any
  isOpen: boolean

  constructor(opt: any) {
    super(opt)
    this.pendingRead = null // thunk for a promise or null
    this.isOpen = false
    this.port = null
    this.lastWrite = null
    this.recording = Buffer.alloc(0)
    this.writeOperation = null // in flight promise or null
    this.serialNumber = null
  }

  // Reset mocks
  static reset() {
    ports = {}
  }

  // Create a mock port
  static createPort(path: string, options: any) {
    serialNumber++
    const opt = {
      echo: false,
      record: false,
      readyData: Buffer.from('READY'),
      ...options,
    }

    ports[path] = {
      data: Buffer.alloc(0),
      echo: opt.echo,
      record: opt.record,
      readyData: Buffer.from(opt.readyData),
      openOpt: null,
      info: {
        comName: path,
        manufacturer: 'The J5 Robotics Company',
        serialNumber: String(serialNumber),
        pnpId: undefined,
        locationId: undefined,
        vendorId: undefined,
        productId: undefined,
      },
    }
    logger(serialNumber, 'created port', JSON.stringify({ path, opt }))
  }

  static async list() {
    return Object.keys(ports).map(path => {
      return ports[path].info
    })
  }

  // Emit data on a mock port
  // tslint:disable-next-line:member-ordering
  emitData(data: Buffer) {
    if (!this.isOpen || !this.port) {
      throw new Error('Port must be open to pretend to receive data')
    }
    if (!Buffer.isBuffer(data)) {
      // tslint:disable-next-line:no-parameter-reassignment
      data = Buffer.from(data)
    }
    logger(this.serialNumber, 'emitting data - pending read:', Boolean(this.pendingRead))
    this.port.data = Buffer.concat([this.port.data, data])
    if (this.pendingRead) {
      process.nextTick(this.pendingRead)
      this.pendingRead = null
    }
  }

  async open(path: string, options: any) {
    logger(this.serialNumber, 'open', path, options)
    if (!path) {
      throw new TypeError('"path" is not a valid port')
    }
    if (typeof options !== 'object') {
      throw new TypeError('"options" is not an object')
    }

    await resolveNextTick()
    const port = (this.port = ports[path])
    if (!port) {
      throw new Error(`Port does not exist - please call MockBinding.createPort('${path}') first`)
    }
    this.serialNumber = port.info.serialNumber

    if (port.openOpt && port.openOpt.lock) {
      throw new Error('Port is locked cannot open')
    }

    if (!this.isOpen || !this.port) {
      throw new Error('Open: binding is already open')
    }

    port.openOpt = Object.assign({}, options)
    this.isOpen = true
    logger(this.serialNumber, 'port is open')

    if (port.echo) {
      process.nextTick(() => {
        if (this.isOpen) {
          logger(this.serialNumber, 'emitting ready data')
          this.emitData(port.readyData)
        }
      })
    }
  }

  async close() {
    const port = this.port
    logger(this.serialNumber, 'closing port')
    if (!this.isOpen || !port) {
      throw new Error('already closed')
    }
    port.openOpt = null
    port.data = Buffer.alloc(0)
    logger(this.serialNumber, 'port is closed')
    this.port = null
    this.serialNumber = null
    // reset data on close
    this.isOpen = false
    if (this.pendingRead) {
      this.pendingRead(new Error('port is closed'))
    }
  }

  async read(buffer: Buffer, offset: number, length: number): Promise<number> {
    logger(this.serialNumber, 'read', offset, length)
    await resolveNextTick()
    if (!this.isOpen || !this.port) {
      throw new Error('Read canceled')
    }
    if (this.port.data.length <= 0) {
      return new Promise((resolve, reject) => {
        this.pendingRead = (err: Error) => {
          if (err) {
            return reject(err)
          }
          this.read(buffer, offset, length).then(resolve, reject)
        }
      }) as Promise<number>
    }
    const data = this.port.data.slice(0, length)
    const readLength = data.copy(buffer, offset)
    this.port.data = this.port.data.slice(length)
    logger(this.serialNumber, 'read', readLength, 'bytes')
    return readLength
  }

  async write(buffer: Buffer) {
    if (!Buffer.isBuffer(buffer)) {
      logger(this.serialNumber, 'writing')
      throw new TypeError('"buffer" is not a Buffer')
    }
    logger(this.serialNumber, 'write', buffer.length, 'bytes')
    if (!this.isOpen) {
      throw new Error('Port is not open')
    }

    logger(this.serialNumber, 'writing')
    if (this.writeOperation) {
      throw new Error('Overlapping writes are not supported and should be queued by the serialport object')
    }
    this.writeOperation = (async () => {
      await resolveNextTick()
      if (!this.isOpen || !this.port) {
        throw new Error('Write canceled')
      }
      const data = (this.lastWrite = Buffer.from(buffer)) // copy
      if (this.port.record) {
        this.recording = Buffer.concat([this.recording, data])
      }
      if (this.port.echo) {
        process.nextTick(() => {
          if (this.isOpen) {
            this.emitData(data)
          }
        })
      }
      this.writeOperation = null
      logger(this.serialNumber, 'writing finished')
    })()
    return this.writeOperation
  }

  async update(options: UpdateOptions) {
    logger('update', options)
    if (typeof options !== 'object') {
      throw TypeError('"options" is not an object')
    }

    if (typeof options.baudRate !== 'number') {
      throw new TypeError('"options.baudRate" is not a number')
    }

    if (!this.isOpen || !this.port) {
      throw new Error('Port is not open')
    }

    await resolveNextTick()
    this.port.openOpt.baudRate = options.baudRate
  }

  async set(options: SetOptions) {
    logger('set', options)
    if (!this.isOpen || !this.port) {
      throw new Error('Port is not open')
    }
    await resolveNextTick()
  }

  async get() {
    logger(this.serialNumber, 'get')
    if (!this.isOpen || !this.port) {
      throw new Error('Port is not open')
    }
    await resolveNextTick()
    return {
      cts: true,
      dsr: false,
      dcd: false,
    }
  }

  async getBaudRate() {
    if (!this.isOpen || !this.port) {
      throw new Error('Port is not open')
    }
    await resolveNextTick()
    return this.port.openOpt.baudRate as number
  }

  async flush() {
    if (!this.isOpen || !this.port) {
      throw new Error('Port is not open')
    }
    await resolveNextTick()
    this.port.data = Buffer.alloc(0)
  }

  async drain() {
    if (!this.isOpen || !this.port) {
      throw new Error('Port is not open')
    }
    await this.writeOperation
    await resolveNextTick()
  }
}
