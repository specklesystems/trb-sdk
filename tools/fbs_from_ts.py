#!/usr/bin/env python3
"""Reconstruct a FlatBuffers .fbs schema from flatc-generated TypeScript.

Reads the generated *.ts files and emits schema declarations. Purely a
translation of machine-generated accessor code back into the schema it was
generated from.
"""
import os, re, sys, json
from collections import OrderedDict

GEN = sys.argv[1] if len(sys.argv) > 1 else 'src/src/TrimBim_generated'

READ2FBS = {
    'readInt8':'int8','readUint8':'uint8','readInt16':'int16','readUint16':'uint16',
    'readInt32':'int32','readUint32':'uint32','readInt64':'int64','readUint64':'uint64',
    'readFloat32':'float32','readFloat64':'float64',
}
SIZEOF = {'int8':1,'uint8':1,'bool':1,'int16':2,'uint16':2,'int32':4,'uint32':4,
          'int64':8,'uint64':8,'float32':4,'float64':8}

def camel_to_snake(n):
    s = re.sub(r'(.)([A-Z][a-z]+)', r'\1_\2', n)
    return re.sub(r'([a-z0-9])([A-Z])', r'\1_\2', s).lower()

class Decl:
    def __init__(self, kind, name):
        self.kind, self.name, self.fields, self.values = kind, name, [], []
        self.identifier = None
        self.root = False
        self.size = None
        self.notes = []

def split_methods(body):
    """Yield (signature, body) for each top-level method in a class body."""
    out, i, n = [], 0, len(body)
    while i < n:
        m = re.compile(r'\n(static\s+)?(\w+)\s*\(([^)]*)\)\s*:?\s*([^{]*)\{').search(body, i)
        if not m: break
        depth, j = 1, m.end()
        while j < n and depth:
            if body[j] == '{': depth += 1
            elif body[j] == '}': depth -= 1
            j += 1
        out.append((bool(m.group(1)), m.group(2), m.group(3), m.group(4).strip(), body[m.end():j-1]))
        i = j
    return out

def parse_enum(text, name):
    d = Decl('enum', name)
    m = re.search(r'export enum %s\s*\{(.*?)\n\}' % re.escape(name), text, re.S)
    for k, v in re.findall(r'(\w+)\s*=\s*(-?\d+)', m.group(1)):
        d.values.append((k, int(v)))
    # flatc emits the underlying type only in the .fbs; infer smallest signed that fits
    hi = max(v for _, v in d.values) if d.values else 0
    lo = min(v for _, v in d.values) if d.values else 0
    d.underlying = 'byte' if -128 <= lo and hi <= 127 else ('short' if hi <= 32767 else 'int')
    return d

def parse_struct(name, methods, text):
    d = Decl('struct', name)
    for is_static, mname, args, ret, body in methods:
        if is_static or mname.startswith('mutate_') or mname in ('__init',):
            continue
        b = ' '.join(body.split())
        m = re.match(r'return this\.bb!\.(\w+)\(this\.bb_pos(?:\s*\+\s*(\d+))?\);', b)
        if m:
            typ = READ2FBS[m.group(1)]
            if ret and ret not in ('number','boolean','bigint'):
                typ = ret            # enum-typed field
            if ret == 'boolean': typ = 'bool'
            d.fields.append((camel_to_snake(mname), typ, int(m.group(2) or 0)))
            continue
        m = re.match(r'return \(obj \|\| new (\w+)\(\)\)\.__init\(this\.bb_pos(?:\s*\+\s*(\d+))?, this\.bb!\);', b)
        if m:
            d.fields.append((camel_to_snake(mname), m.group(1), int(m.group(2) or 0)))
            continue
        m = re.match(r'return !!this\.bb!\.read(?:Int|Uint)8\(this\.bb_pos(?:\s*\+\s*(\d+))?\);', b)
        if m:
            d.fields.append((camel_to_snake(mname), 'bool', int(m.group(1) or 0)))
            continue
        d.notes.append('unparsed struct member: %s -> %s' % (mname, b[:120]))
    d.fields.sort(key=lambda f: f[2])
    m = re.search(r'static sizeOf\(\):number \{\s*return (\d+);', text)
    if m: d.size = int(m.group(1))
    return d

VEC_SCALAR = re.compile(r'(!!)?this\.bb!\.(\w+)\(this\.bb!\.__vector\(this\.bb_pos \+ offset\) \+ index(?:\s*\*\s*(\d+))?\)')

def parse_table(name, methods, text):
    d = Decl('table', name)
    slots = {}
    names = {m[1] for m in methods}
    for is_static, mname, args, ret, body in methods:
        if is_static or mname.startswith('mutate_') or mname == '__init':
            continue
        # xxxLength / xxxArray are vector helpers only when xxx is itself a
        # vector accessor; otherwise they are genuine fields (e.g. segmentLength)
        if mname.endswith('Length') and mname[:-6] in names:
            continue
        if mname.endswith('Array') and mname[:-5] in names:
            continue
        b = ' '.join(body.split())
        m = re.search(r'__offset\(this\.bb_pos, (\d+)\)', b)
        if not m:
            continue
        slot = (int(m.group(1)) - 4) // 2
        fname = camel_to_snake(mname)
        typ = None
        # vector of tables
        if re.search(r'__indirect\(this\.bb!\.__vector\(this\.bb_pos \+ offset\) \+ index \* 4\)', b):
            t = re.search(r'new (\w+)\(\)', b)
            typ = '[%s]' % t.group(1)
        # vector of strings
        elif re.search(r'__string\(this\.bb!\.__vector\(this\.bb_pos \+ offset\) \+ index \* 4', b):
            typ = '[string]'
        # vector of structs
        elif re.search(r'__init\(this\.bb!\.__vector\(this\.bb_pos \+ offset\) \+ index \* (\d+), this\.bb!\)', b):
            t = re.search(r'new (\w+)\(\)', b)
            typ = '[%s]' % t.group(1)
        # vector of scalars
        elif VEC_SCALAR.search(b):
            mm = VEC_SCALAR.search(b)
            base = READ2FBS.get(mm.group(2), mm.group(2))
            if mm.group(1):
                base = 'bool'
            rt = ret.split('|')[0].strip()
            if rt not in ('number','boolean','string','bigint','') and not rt.startswith('flatbuffers') \
               and not rt.endswith('Array') and rt != 'null':
                base = rt
            typ = '[%s]' % base
        # string
        elif '__string(this.bb_pos + offset' in b:
            typ = 'string'
        # nested table
        elif re.search(r'__init\(this\.bb!\.__indirect\(this\.bb_pos \+ offset\), this\.bb!\)', b):
            t = re.search(r'new (\w+)\(\)', b)
            typ = t.group(1)
        # inline struct
        elif re.search(r'__init\(this\.bb_pos \+ offset, this\.bb!\)', b):
            t = re.search(r'new (\w+)\(\)', b)
            typ = t.group(1)
        # scalar with default
        else:
            mm = re.search(r'this\.bb!\.(\w+)\(this\.bb_pos \+ offset\)\s*:\s*(.+?);', b)
            if mm:
                base = READ2FBS.get(mm.group(1), mm.group(1))
                default = mm.group(2).strip()
                rt = ret.split('|')[0].strip()
                if rt not in ('number','boolean','string','bigint','') and not rt.startswith('flatbuffers'):
                    base = rt
                if rt == 'boolean': base = 'bool'
                typ = base
                d_default = default
                slots[slot] = (fname, typ, d_default)
                continue
        if typ:
            slots[slot] = (fname, typ, None)
        else:
            d.notes.append('unparsed table member: %s -> %s' % (mname, b[:140]))
    for slot in sorted(slots):
        d.fields.append((slots[slot][0], slots[slot][1], slots[slot][2], slot))
    m = re.search(r"__has_identifier\('(\w+)'\)", text)
    if m: d.identifier = m.group(1); d.root = True
    m = re.search(r"builder\.finish\(offset, '(\w+)'\)", text)
    if m: d.identifier = m.group(1); d.root = True
    # required fields
    d.required = set()
    for off in re.findall(r'builder\.requiredField\(offset, (\d+)\)', text):
        d.required.add((int(off) - 4)//2)
    m = re.search(r'builder\.startObject\((\d+)\)', text)
    if m: d.slotcount = int(m.group(1))
    return d

def parse_file(path):
    text = open(path).read()
    m = re.search(r'export enum (\w+)', text)
    if m: return parse_enum(text, m.group(1))
    m = re.search(r'export class (\w+) \{(.*)\n\}\s*$', text, re.S)
    if not m: return None
    name, body = m.group(1), m.group(2)
    methods = split_methods(body)
    if 'startObject(' in text:
        return parse_table(name, methods, text)
    return parse_struct(name, methods, text)

decls = OrderedDict()
for fn in sorted(os.listdir(GEN)):
    if not fn.endswith('.ts'): continue
    d = parse_file(os.path.join(GEN, fn))
    if d: decls[d.name] = d
    else: print('!! could not parse', fn, file=sys.stderr)

json.dump({n: {'kind': d.kind, 'fields': d.fields, 'values': d.values,
               'identifier': d.identifier, 'size': d.size,
               'required': sorted(getattr(d,'required',[])), 'notes': d.notes}
           for n, d in decls.items()}, open('schema.json','w'), indent=1)

notes = [(n, x) for n, d in decls.items() for x in d.notes]
print('parsed %d declarations (%d enums, %d structs, %d tables), %d unparsed members'
      % (len(decls),
         sum(1 for d in decls.values() if d.kind=='enum'),
         sum(1 for d in decls.values() if d.kind=='struct'),
         sum(1 for d in decls.values() if d.kind=='table'), len(notes)), file=sys.stderr)
for n, x in notes[:40]: print('   ', n, x, file=sys.stderr)
