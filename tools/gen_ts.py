#!/usr/bin/env python3
"""Emit TypeScript accessors for the TrimBIM schema from schema.json.

Our own generator, our own reader runtime, driven by the reconstructed schema.
"""
import json, re, sys
# schema.json is the intermediate produced by fbs_from_ts.py; it is not checked
# in because it derives from Trimble's published source maps. Rebuild it first
# when regenerating (see docs/provenance.md).
S = json.load(open(sys.argv[1] if len(sys.argv) > 1 else 'schema.json'))
OUT = sys.argv[2] if len(sys.argv) > 2 else 'src/schema.ts'

def lower1(n): return n[0].lower() + n[1:]
def prop(n):
    n = re.sub(r'_([a-z0-9])', lambda m: m.group(1).upper(), n)
    return n[0].lower() + n[1:]

SC = {'int8':'int8','uint8':'uint8','int16':'int16','uint16':'uint16',
      'int32':'int32','uint32':'uint32','int64':'int64','uint64':'uint64',
      'float32':'float32','float64':'float64','bool':'bool'}
TSNUM = {'int64':'bigint','uint64':'bigint','bool':'boolean'}
ARR = {'int8':'Int8Array','uint8':'Uint8Array','int16':'Int16Array','uint16':'Uint16Array',
       'int32':'Int32Array','uint32':'Uint32Array','float32':'Float32Array','float64':'Float64Array'}
WIDTH = {'int8':1,'uint8':1,'bool':1,'int16':2,'uint16':2,'int32':4,'uint32':4,
         'int64':8,'uint64':8,'float32':4,'float64':8}

def tsret(t):
    if t in TSNUM: return TSNUM[t]
    if t in SC: return 'number'
    if t == 'string': return 'string'
    return t

L = ["// Generated from trimbim.fbs by tools/gen_ts.py. Do not edit by hand.",
     "// Low-level accessors over the TrimBIM FlatBuffers layout.",
     "",
     "import { ByteBuffer, Table } from './buffer.js';", ""]

for n, d in sorted(S.items()):
    if d['kind'] != 'enum': continue
    L.append('export enum %s {' % n)
    for k, v in d['values']:
        L.append('  %s = %d,' % (k, v))
    L.append('}')
    L.append('')

# structs: fixed inline layout, accessed by absolute position
for n, d in sorted(S.items()):
    if d['kind'] != 'struct': continue
    L.append('/** inline struct, %s bytes */' % d['size'])
    L.append('export class %s {' % n)
    L.append('  constructor(readonly bb: ByteBuffer, readonly pos: number) {}')
    L.append('  static readonly SIZE = %d;' % d['size'])
    for fname, ftype, off in d['fields']:
        p = prop(fname)
        if ftype in SC:
            L.append('  get %s(): %s { return this.bb.%s(this.pos + %d); }' % (p, tsret(ftype), SC[ftype], off))
        elif ftype in S and S[ftype]['kind'] == 'enum':
            und = 'int8' if min(v for _, v in S[ftype]['values']) < 0 else 'uint8'
            hi = max(v for _, v in S[ftype]['values'])
            und = und if hi < 128 else 'uint8'
            L.append('  get %s(): %s { return this.bb.%s(this.pos + %d) as %s; }' % (p, ftype, und, off, ftype))
        else:
            L.append('  get %s(): %s { return new %s(this.bb, this.pos + %d); }' % (p, ftype, ftype, off))
    L.append('}')
    L.append('')

for n, d in sorted(S.items()):
    if d['kind'] != 'table': continue
    L.append('export class %s extends Table {' % n)
    if d['identifier']:
        L.append("  static readonly FILE_IDENTIFIER = '%s';" % d['identifier'])
        L.append('  static root(bb: ByteBuffer): %s { return new %s(bb, bb.rootPosition()); }' % (n, n))
    for f in d['fields']:
        fname, ftype, dflt, slot = f
        vslot = 4 + slot * 2
        p = prop(fname)
        if ftype in SC:
            dv = '0'
            if dflt not in (None, 'null'):
                dv = dflt if not dflt.startswith(('true','false')) else dflt
            if ftype == 'bool': dv = 'false' if dv in ('0','null',None) else dv
            if ftype in ('int64','uint64'):
                dv = '0n'
            L.append('  get %s(): %s { const o = this.off(%d); return o ? this.bb.%s(this.pos + o) : %s; }'
                     % (p, tsret(ftype), vslot, SC[ftype], dv))
        elif ftype in S and S[ftype]['kind'] == 'enum':
            dv = '0'
            if dflt and '.' in str(dflt): dv = '%s.%s' % (ftype, str(dflt).split('.')[-1])
            L.append('  get %s(): %s { const o = this.off(%d); return o ? this.bb.uint8(this.pos + o) as %s : %s as %s; }'
                     % (p, ftype, vslot, ftype, dv, ftype))
        elif ftype == 'string':
            L.append('  get %s(): string | null { const o = this.off(%d); return o ? this.bb.string(this.pos + o) : null; }'
                     % (p, vslot))
        elif ftype == '[string]':
            L.append('  %s(): string[] { return this.stringVector(%d); }' % (p, vslot))
        elif ftype.startswith('['):
            inner = ftype[1:-1]
            if inner in SC:
                arr = ARR.get(inner)
                w = WIDTH[inner]
                if arr:
                    L.append('  %s(): %s { const v = this.scalarVectorInfo(%d); if (!v) return new %s(0);'
                             ' return copy%s(this.bb, v.base, v.length); }' % (p, arr, vslot, arr, arr))
                else:
                    et = TSNUM.get(inner, 'number')
                    L.append('  %s(): %s[] { const v = this.scalarVectorInfo(%d); if (!v) return [];'
                             ' const out: %s[] = []; for (let i = 0; i < v.length; i++)'
                             ' out.push(this.bb.%s(v.base + i * %d)); return out; }' % (p, et, vslot, et, SC[inner], w))
            elif inner in S and S[inner]['kind'] == 'enum':
                L.append('  %s(): %s[] { const v = this.scalarVectorInfo(%d); if (!v) return [];'
                         ' const out: %s[] = []; for (let i = 0; i < v.length; i++)'
                         ' out.push(this.bb.uint8(v.base + i) as %s); return out; }' % (p, inner, vslot, inner, inner))
            elif inner in S and S[inner]['kind'] == 'struct':
                L.append('  %sLength(): number { return this.structVector(%d, %s.SIZE).length; }' % (p, vslot, inner))
                L.append('  %s(i: number): %s { const v = this.structVector(%d, %s.SIZE);'
                         ' return new %s(this.bb, v.at(i)); }' % (p, inner, vslot, inner, inner))
            else:
                L.append('  %sLength(): number { return this.offsetVector(%d).length; }' % (p, vslot))
                L.append('  %s(i: number): %s { const v = this.offsetVector(%d);'
                         ' return new %s(this.bb, this.bb.indirect(v.at(i))); }' % (p, inner, vslot, inner))
        elif ftype in S and S[ftype]['kind'] == 'struct':
            L.append('  get %s(): %s | null { const o = this.off(%d); return o ? new %s(this.bb, this.pos + o) : null; }'
                     % (p, ftype, vslot, ftype))
        else:
            L.append('  get %s(): %s | null { const o = this.off(%d);'
                     ' return o ? new %s(this.bb, this.bb.indirect(this.pos + o)) : null; }'
                     % (p, ftype, vslot, ftype))
    L.append('}')
    L.append('')

L.append('''
// Typed-array copies. FlatBuffers aligns vector elements, but the containing
// Uint8Array may sit at any byteOffset, so copy rather than view when the
// alignment does not permit a zero-copy view.
''')
for base, arr in ARR.items():
    w = WIDTH[base]
    L.append('''function copy%s(bb: ByteBuffer, base: number, len: number): %s {
  bb.check(base, len * %d);
  const abs = bb.bytes.byteOffset + base;
  if (abs %% %d === 0) return new %s(bb.bytes.buffer, abs, len);
  const out = new %s(len);
  for (let i = 0; i < len; i++) out[i] = bb.%s(base + i * %d);
  return out;
}''' % (arr, arr, w, w, arr, arr, SC[base], w))
    L.append('')

open(OUT,'w').write('\n'.join(L) + '\n')
print('wrote', OUT)
