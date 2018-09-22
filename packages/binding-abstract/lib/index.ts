export interface ConstructorOptions extends PortInfo, LocalState {
  readonly descriptor: number
}

export interface OpenOptions extends LocalState {
  readonly path: string
}

export interface PortInfo {
  readonly path: string
  readonly locationId?: string
  readonly manufacturer?: string
  readonly pnpId?: string
  readonly productId?: string
  readonly serialNumber?: string
  readonly vendorId?: string
}

export interface LocalState {
  /* The system reported baud rate */
  readonly baudRate: number
  /* Break Suspends character transmission local status */
  readonly brk: boolean
  readonly dataBits: 5 | 6 | 7 | 8
  /* Data terminal Ready local status (local DTR => remote DSR) */
  readonly dtr: boolean
  readonly lock: boolean
  readonly parity: 'none' | 'even' | 'mark' | 'odd' | 'space'
  /* Request To Send local status (local RTS => remote CTS) */
  readonly rts: boolean
  /* enable rts/cts control flow, disables manually setting rts */
  readonly rtscts: boolean
  readonly stopBits: 1 | 1.5 | 2
}

export interface RemoteState {
  /* Clear To Send remote status (remote RTS => local CTS) */
  readonly cts: boolean
  /* Data Carrier Detect remote status */
  readonly dcd: boolean
  /* Data Set Ready remote status (local DSR => remote DTR) */
  readonly dsr: boolean
}

/**
 * You never have to use `Binding` objects directly. SerialPort uses them to access the underlying hardware. This documentation is geared towards people who are making bindings for different platforms. This class can be inherited from to get type checking for each method.
 */
export class AbstractBinding implements PortInfo, LocalState {
  locationId?: string
  manufacturer?: string
  path: string
  pnpId?: string
  productId?: string
  serialNumber?: string
  vendorId?: string
  baudRate: number
  brk: boolean
  dataBits: 5 | 6 | 7 | 8
  dtr: boolean
  lock: boolean
  parity: 'none' | 'even' | 'mark' | 'odd' | 'space'
  rts: boolean
  rtscts: boolean
  stopBits: 1 | 1.5 | 2
  descriptor: number
  hasClosed: boolean

  /**
   * Retrieves a list of available serial ports with metadata. The `comName` must be guaranteed, and all other fields should be undefined if unavailable. The `comName` is either the path or an identifier (eg `COM1`) used to open the serialport.
   */
  static async list(): Promise<ReadonlyArray<PortInfo>> {
    throw new Error('#list is not implemented')
  }

  /**
   * Opens a connection to the serial port referenced by the path.
   * @param options openOptions for the serialport
   */
  static async open<T>(this: T, options: OpenOptions): Promise<T> {
    throw new Error('#open is not implemented')
  }

  constructor(opt: ConstructorOptions) {
    throw new Error('Cannot create an AbstractBinding Implemented')
  }

  /**
   * Closes an open connection
   * @returns Resolves once the connection is closed.
   * @throws When given invalid arguments, a `TypeError` is thrown.
   */
  async close() {
    throw new Error('.close is not implemented')
  }

  /**
   * Drain waits until all output data is transmitted to the serial port. An in progress write should be completed before this returns.
   */
  async drain() {
    throw new Error('.drain is not implemented')
  }

  /**
   * Flush (discard) data received but not read, and written but not transmitted.
   */
  async flush() {
    throw new Error('.flush is not implemented')
  }

  /**
   * Get the control flags (CTS, DSR, DCD) on the open port.
   * @returns {Promise} Resolves with the retrieved flags.
   * @throws {TypeError} When given invalid arguments, a `TypeError` is thrown.
   */
  async getRemoteState(): Promise<RemoteState> {
    throw new Error('.get is not implemented')
  }

  /**
   * Request a number of bytes from the SerialPort. This function is similar to Node's [`fs.read`](http://nodejs.org/api/fs.html#fs_fs_read_fd_buffer_offset_length_position_callback) except it will always read at least one byte while the port is open. In progress reads must resolve with any available data when the port is closed, if there is no data when a port is closed read 0 bytes.
   * @param buffer Accepts a [`Buffer`](http://nodejs.org/api/buffer.html) object.
   * @param offset The offset in the buffer to start writing at.
   * @param length Specifies the maximum number of bytes to read.
   */
  async read(buffer: Buffer, offset: number, length: number): Promise<number> {
    throw new Error('.read is not implemented')
  }

  /**
   * Set local state on an open port including updating baudRate and control flags. The state is represented on the object as well as resolved in the promise.
   */
  async setLocalState(options: Partial<LocalState>): Promise<LocalState> {
    throw new Error('.setLocalState is not implemented')
  }

  /**
   * Write bytes to the SerialPort. Only call when there is no pending write operation. In progress writes must error when the port is closed.
   */
  async write(buffer: Buffer): Promise<void> {
    throw new Error('.write is not implemented')
  }
}
