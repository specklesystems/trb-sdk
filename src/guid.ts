/**
 * TrimBIM stores object identifiers as 16 raw bytes in Microsoft GUID layout.
 * IFC GlobalId is the same 128 bits re-ordered and re-encoded in IFC's own
 * base64 alphabet, so the two are interchangeable without loss.
 */
const IFC64 =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$';

/** Byte permutation from MS GUID order to the IFC packing order. */
const TO_IFC = [15, 14, 13, -1, 12, 11, 10, -1, 9, 8, 6, -1, 7, 4, 5, -1, 0, 1, 2, -1, 3];

export function bytesToMsGuid(b: Uint8Array): string {
  const h = (i: number) => b[i]!.toString(16).padStart(2, '0');
  // first three groups are little-endian integers, the rest are byte order
  return (
    h(3) + h(2) + h(1) + h(0) + '-' +
    h(5) + h(4) + '-' +
    h(7) + h(6) + '-' +
    h(8) + h(9) + '-' +
    h(10) + h(11) + h(12) + h(13) + h(14) + h(15)
  );
}

export function bytesToIfcGuid(b: Uint8Array): string {
  const t = new Uint8Array(24);
  for (let i = 0; i < TO_IFC.length; i++) {
    const src = TO_IFC[i]!;
    if (src >= 0) t[i] = b[src]!;
  }
  // six little-endian uint32 groups, most significant group first,
  // 8 bits then five lots of 24
  const u32 = (o: number) => t[o]! | (t[o + 1]! << 8) | (t[o + 2]! << 16) | (t[o + 3]! << 24);
  const g = [u32(0), u32(4), u32(8), u32(12), u32(16), u32(20)];
  return (
    enc(g[5]!, 8) + enc(g[4]!, 24) + enc(g[3]!, 24) +
    enc(g[2]!, 24) + enc(g[1]!, 24) + enc(g[0]!, 24)
  );
}

function enc(value: number, bits: number): string {
  let out = '';
  let v = value >>> 0;
  for (let b = 0; b < bits; b += 6) {
    out = IFC64[v & 63] + out;
    v = v >>> 6;
  }
  return out;
}

export function ifcGuidToBytes(guid: string): Uint8Array {
  if (guid.length !== 22) throw new Error('IFC GlobalId must be 22 characters');
  const dec = (c: string) => {
    const i = IFC64.indexOf(c);
    if (i < 0) throw new Error(`invalid IFC base64 character: ${c}`);
    return i;
  };
  const group = (start: number, n: number) => {
    let v = 0;
    for (let i = 0; i < n; i++) v = v * 64 + dec(guid[start + i]!);
    return v >>> 0;
  };
  const g = [
    group(0, 2), group(2, 4), group(6, 4), group(10, 4), group(14, 4), group(18, 4),
  ];
  const t = new Uint8Array(24);
  const put = (o: number, v: number) => {
    t[o] = v & 0xff; t[o + 1] = (v >>> 8) & 0xff;
    t[o + 2] = (v >>> 16) & 0xff; t[o + 3] = (v >>> 24) & 0xff;
  };
  put(0, g[5]!); put(4, g[4]!); put(8, g[3]!);
  put(12, g[2]!); put(16, g[1]!); put(20, g[0]!);
  const b = new Uint8Array(16);
  for (let i = 0; i < TO_IFC.length; i++) {
    const dst = TO_IFC[i]!;
    if (dst >= 0) b[dst] = t[i]!;
  }
  return b;
}
