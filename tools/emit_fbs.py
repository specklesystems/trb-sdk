#!/usr/bin/env python3
import json, re, sys
S = json.load(open('schema.json'))

def snake(n):
    s = re.sub(r'(.)([A-Z][a-z]+)', r'\1_\2', n)
    return re.sub(r'([a-z0-9])([A-Z])', r'\1_\2', s).lower()

ENUM_UNDER = {}   # flatc default for enums is byte unless values exceed range
def enum_underlying(vals):
    hi = max(v for _, v in vals); lo = min(v for _, v in vals)
    if lo >= 0 and hi <= 255: return 'ubyte'
    if -128 <= lo and hi <= 127: return 'byte'
    return 'short'

FBS_SCALARS = {'int8':'byte','uint8':'ubyte','int16':'short','uint16':'ushort',
               'int32':'int','uint32':'uint','int64':'long','uint64':'ulong',
               'float32':'float','float64':'double','bool':'bool','string':'string'}

def ty(t):
    if t.startswith('[') and t.endswith(']'):
        return '[%s]' % ty(t[1:-1])
    return FBS_SCALARS.get(t, t)

def default_of(raw, t):
    if raw is None: return ''
    raw = raw.strip()
    if raw in ('null','0','false'):
        # flatc omits explicit zero defaults only when they are the natural default
        if raw == 'null': return ''
        if t == 'bool': return ' = false'
        return ''
    if raw == 'true': return ' = true'
    m = re.match(r'^(\w+)\.(\w+)$', raw)     # enum default
    if m: return ' = %s' % m.group(2)
    m = re.match(r'^-?[\d.]+$', raw)
    if m: return ' = %s' % raw
    if raw == "''" or raw == '""': return ''
    return ''

deps = {}
for n, d in S.items():
    ds = set()
    for f in d['fields']:
        t = f[1]
        t = t[1:-1] if t.startswith('[') else t
        if t in S: ds.add(t)
    deps[n] = ds

def topo(names):
    out, seen = [], set()
    def visit(n, stack=()):
        if n in seen or n not in names: return
        if n in stack: return
        for d in sorted(deps.get(n, ())):
            if d in names: visit(d, stack + (n,))
        seen.add(n); out.append(n)
    for n in sorted(names): visit(n)
    return out

enums   = [n for n, d in S.items() if d['kind'] == 'enum']
structs = [n for n, d in S.items() if d['kind'] == 'struct']
tables  = [n for n, d in S.items() if d['kind'] == 'table']

L = []
L.append('// TrimBIM (.trb) schema, reconstructed for interoperability.')
L.append('//')
L.append('// Recovered from the flatc-generated TypeScript published in')
L.append('// TrimbimWorker.js.map (Trimble Connect Web3D build v5.0.6649).')
L.append('// Field names, slot order, types, defaults and required markers are')
L.append('// taken from the generated accessors, so the wire layout is exact.')
L.append('// Table names below match the generated class names.')
L.append('')
L.append('namespace TrimBim;')
L.append('')

for n in sorted(enums):
    d = S[n]
    L.append('enum %s : %s {' % (n, enum_underlying(d['values'])))
    for k, v in d['values']:
        L.append('  %s = %d,' % (k, v))
    L.append('}')
    L.append('')

L.append('// ---------------------------------------------------------------')
L.append('// structs (inline, fixed size, no vtable)')
L.append('// ---------------------------------------------------------------')
L.append('')
for n in topo(structs):
    d = S[n]
    L.append('struct %s {' % n)
    for f in d['fields']:
        L.append('  %s:%s;' % (snake(f[0]), ty(f[1])))
    L.append('}  // %d bytes' % d['size'] if d['size'] else '}')
    L.append('')

L.append('// ---------------------------------------------------------------')
L.append('// tables')
L.append('// ---------------------------------------------------------------')
L.append('')
root = None
for n in topo(tables):
    d = S[n]
    if d['identifier']: root = n
    L.append('table %s {' % n)
    req = set(d['required'])
    for f in d['fields']:
        name, t, dflt, slot = f
        line = '  %s:%s%s' % (snake(name), ty(t), default_of(dflt, t))
        if slot in req: line += ' (required)'
        L.append(line + ';')
    L.append('}')
    L.append('')

if root:
    L.append('root_type %s;' % root)
    L.append('file_identifier "%s";' % S[root]['identifier'])
    L.append('file_extension "trb";')

open('trimbim.fbs','w').write('\n'.join(L) + '\n')
print('wrote trimbim.fbs: %d enums, %d structs, %d tables, root=%s id=%s'
      % (len(enums), len(structs), len(tables), root, S[root]['identifier'] if root else '?'))
