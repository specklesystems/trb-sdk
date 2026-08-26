/**
 * Minimal FlatBuffers reader.
 *
 * Implements only the read side of the FlatBuffers binary encoding, which is a
 * published, documented format. Written from the specification so this package
 * carries no third-party code and no build-time dependency on `flatc`.
 *
 * Layout recap, all little-endian:
 *   - A table is preceded by a signed int32 giving the negative distance to its
 *     vtable.
 *   - A vtable is: uint16 vtable byte length, uint16 table byte length, then one
 *     uint16 per field slot holding the field's offset from the table start, or
 *     0 when the field is absent.
 *   - Offsets to tables, vectors and strings are uint32 relative to their own
 *     position.
 *   - A vector is a uint32 length followed by the elements.
 *   - A string is a vector of UTF-8 bytes.
 *
 * Every offset that is followed and every vector length that drives an
 * allocation is bounds-checked against the buffer, so a truncated or corrupt
 * file fails with TrbFormatError instead of hanging or exhausting memory.
 * Scalar reads rely on DataView's own range checking.
 */

/** A structural problem in the file: bad offset, oversized vector, truncation. */
export class TrbFormatError extends Error {
  constructor(message: string) {
    super(`TrimBIM: ${message}`);
    this.name = 'TrbFormatError';
  }
}

export class ByteBuffer {
  readonly bytes: Uint8Array;
  private readonly view: DataView;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  static fromArrayBuffer(b: ArrayBuffer): ByteBuffer {
    return new ByteBuffer(new Uint8Array(b));
  }

  get capacity(): number {
    return this.bytes.byteLength;
  }

  /** Throw unless [offset, offset + size) lies inside the buffer. */
  check(offset: number, size: number): void {
    if (offset < 0 || size < 0 || offset + size > this.capacity) {
      throw new TrbFormatError(
        `range [${offset}, ${offset + size}) outside buffer of ${this.capacity} bytes`);
    }
  }

  int8(o: number): number { return this.view.getInt8(o); }
  uint8(o: number): number { return this.view.getUint8(o); }
  int16(o: number): number { return this.view.getInt16(o, true); }
  uint16(o: number): number { return this.view.getUint16(o, true); }
  int32(o: number): number { return this.view.getInt32(o, true); }
  uint32(o: number): number { return this.view.getUint32(o, true); }
  int64(o: number): bigint { return this.view.getBigInt64(o, true); }
  uint64(o: number): bigint { return this.view.getBigUint64(o, true); }
  float32(o: number): number { return this.view.getFloat32(o, true); }
  float64(o: number): number { return this.view.getFloat64(o, true); }
  bool(o: number): boolean { return this.view.getInt8(o) !== 0; }

  /** Byte offset of a field within a table, or 0 when the field is absent. */
  fieldOffset(tablePos: number, vtableSlot: number): number {
    this.check(tablePos, 4);
    const vtable = tablePos - this.int32(tablePos);
    this.check(vtable, 4);
    const vtableLen = this.uint16(vtable);
    if (vtableSlot >= vtableLen) return 0;
    this.check(vtable + vtableSlot, 2);
    return this.uint16(vtable + vtableSlot);
  }

  /** Follow a uint32 relative offset. */
  indirect(o: number): number {
    this.check(o, 4);
    const pos = o + this.uint32(o);
    this.check(pos, 4);
    return pos;
  }

  /** Position of a vector's first element. */
  vector(o: number): number {
    return this.indirect(o) + 4;
  }

  vectorLength(o: number): number {
    return this.uint32(this.indirect(o));
  }

  string(o: number): string {
    const start = this.indirect(o);
    const len = this.uint32(start);
    this.check(start + 4, len);
    return utf8Decode(this.bytes, start + 4, len);
  }

  /** The 4-byte file identifier at offset 4, as ASCII. */
  fileIdentifier(): string {
    if (this.capacity < 8) return '';
    let s = '';
    for (let i = 4; i < 8; i++) s += String.fromCharCode(this.uint8(i));
    return s;
  }

  /** Position of the root table. */
  rootPosition(): number {
    this.check(0, 4);
    const pos = this.uint32(0);
    this.check(pos, 4);
    return pos;
  }
}

const TD = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null;

function utf8Decode(bytes: Uint8Array, start: number, len: number): string {
  if (len === 0) return '';
  if (TD) return TD.decode(bytes.subarray(start, start + len));
  let s = '';
  for (let i = 0; i < len; i++) s += String.fromCharCode(bytes[start + i]!);
  return s;
}

/** Base for a generated-style table accessor. */
export class Table {
  constructor(public readonly bb: ByteBuffer, public readonly pos: number) {}

  protected off(slot: number): number {
    return this.bb.fieldOffset(this.pos, slot);
  }

  /** A vector of fixed-size inline structs: returns element positions. */
  protected structVector(slot: number, stride: number): { at: (i: number) => number; length: number } {
    const o = this.off(slot);
    if (!o) return { at: () => -1, length: 0 };
    const base = this.bb.vector(this.pos + o);
    const len = this.bb.vectorLength(this.pos + o);
    this.bb.check(base, len * stride);
    return { at: (i: number) => base + i * stride, length: len };
  }

  /** A vector of offsets to tables or strings: returns element positions. */
  protected offsetVector(slot: number): { at: (i: number) => number; length: number } {
    const o = this.off(slot);
    if (!o) return { at: () => -1, length: 0 };
    const base = this.bb.vector(this.pos + o);
    const len = this.bb.vectorLength(this.pos + o);
    this.bb.check(base, len * 4);
    return { at: (i: number) => base + i * 4, length: len };
  }

  protected scalarVectorInfo(slot: number): { base: number; length: number } | null {
    const o = this.off(slot);
    if (!o) return null;
    const base = this.bb.vector(this.pos + o);
    const len = this.bb.vectorLength(this.pos + o);
    // every scalar is at least one byte; the copy helpers re-check exact widths
    this.bb.check(base, len);
    return { base, length: len };
  }

  protected stringVector(slot: number): string[] {
    const v = this.offsetVector(slot);
    const out = new Array<string>(v.length);
    for (let i = 0; i < v.length; i++) out[i] = this.bb.string(v.at(i));
    return out;
  }
}
