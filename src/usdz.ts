/**
 * Minimal USDZ container writer.
 *
 * A .usdz file is a plain zip archive with two extra rules (from the USDZ
 * specification): every entry is STORED (no compression), and every entry's
 * file DATA begins at a multiple of 64 bytes within the archive. The
 * alignment is achieved the standard way, by padding each local file header
 * with a zip "extra" field, so the result is still a perfectly ordinary zip.
 *
 * Only what the exporter needs is implemented: local file headers, central
 * directory, end-of-central-directory, CRC-32. No zip64, so the archive must
 * stay under 4 GB — far above any realistic export here.
 */

export interface UsdzEntry {
  /** Archive-relative file name; the first entry must be the root USD file. */
  name: string;
  data: Uint8Array;
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    c = CRC_TABLE[(c ^ data[i]!) & 0xff]! ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

const ALIGN = 64;
// Arbitrary but stable extra-field id for the alignment padding; readers skip
// ids they do not recognise.
const PAD_ID = 0x1986;

/** Build a USDZ (aligned, stored zip) from the given entries. */
export function createUsdz(entries: UsdzEntry[]): Uint8Array {
  const te = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = te.encode(entry.name);
    const crc = crc32(entry.data);

    // extra-field length so the data starts 64-byte aligned; the field needs
    // at least its own 4-byte header, hence the +4 fold
    const dataStartUnpadded = offset + 30 + name.length + 4;
    const extraLen = 4 + ((ALIGN - (dataStartUnpadded % ALIGN)) % ALIGN);
    const extra = new Uint8Array(extraLen);
    const ev = new DataView(extra.buffer);
    ev.setUint16(0, PAD_ID, true);
    ev.setUint16(2, extraLen - 4, true);

    const local = new Uint8Array(30);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);  // local file header signature
    lv.setUint16(4, 20, true);          // version needed
    lv.setUint16(6, 0, true);           // flags
    lv.setUint16(8, 0, true);           // method: STORE
    lv.setUint16(10, 0, true);          // mod time
    lv.setUint16(12, 0x21, true);       // mod date (1980-01-01)
    lv.setUint32(14, crc, true);
    lv.setUint32(18, entry.data.length, true);
    lv.setUint32(22, entry.data.length, true);
    lv.setUint16(26, name.length, true);
    lv.setUint16(28, extraLen, true);

    const cd = new Uint8Array(46 + name.length);
    const cv = new DataView(cd.buffer);
    cv.setUint32(0, 0x02014b50, true);  // central directory signature
    cv.setUint16(4, 20, true);          // version made by
    cv.setUint16(6, 20, true);          // version needed
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0x21, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, entry.data.length, true);
    cv.setUint32(24, entry.data.length, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);     // local header offset
    cd.set(name, 46);
    central.push(cd);

    chunks.push(local, name, extra, entry.data);
    offset += 30 + name.length + extraLen + entry.data.length;
  }

  const cdStart = offset;
  let cdSize = 0;
  for (const cd of central) {
    chunks.push(cd);
    cdSize += cd.length;
  }

  const eocd = new Uint8Array(22);
  const evd = new DataView(eocd.buffer);
  evd.setUint32(0, 0x06054b50, true);
  evd.setUint16(8, entries.length, true);
  evd.setUint16(10, entries.length, true);
  evd.setUint32(12, cdSize, true);
  evd.setUint32(16, cdStart, true);
  chunks.push(eocd);

  const total = offset + cdSize + 22;
  const out = new Uint8Array(total);
  let pos = 0;
  for (const c of chunks) {
    out.set(c, pos);
    pos += c.length;
  }
  return out;
}
