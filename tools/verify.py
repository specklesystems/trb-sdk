#!/usr/bin/env python3
"""Round-trip check: regenerate TS from the reconstructed .fbs and compare the
binary-layout facts against Trimble's own generated TS."""
import os, re, sys
ORIG='src/src/TrimBim_generated'; NEW='/tmp/gen_check/trim-bim'

def facts(path):
    t=open(path).read()
    f={}
    f['sizeOf']=re.search(r'static sizeOf\(\):number \{\s*return (\d+);',t)
    f['sizeOf']=int(f['sizeOf'].group(1)) if f['sizeOf'] else None
    f['startObject']=re.search(r'builder\.startObject\((\d+)\)',t)
    f['startObject']=int(f['startObject'].group(1)) if f['startObject'] else None
    f['ident']=re.search(r"__has_identifier\('(\w+)'\)",t)
    f['ident']=f['ident'].group(1) if f['ident'] else None
    # per-accessor slot + read kind, keyed by lowercased method name
    slots={}
    for m in re.finditer(r'\n\s*(\w+)\(([^)]*)\)\s*:[^{]*\{(.*?)\n\}', t, re.S):
        name, body = m.group(1), m.group(3)
        if name.startswith('mutate_') or name=='__init': continue
        o=re.search(r'__offset\(this\.bb_pos, (\d+)\)', body)
        if o: slots[name.lower()]=int(o.group(1))
    f['slots']=slots
    # struct member byte offsets
    offs={}
    for m in re.finditer(r'\n\s*(\w+)\(([^)]*)\)\s*:[^{]*\{(.*?)\n\}', t, re.S):
        name, body = m.group(1), m.group(3)
        if name.startswith('mutate_') or name=='__init': continue
        o=re.search(r'this\.bb_pos(?:\s*\+\s*(\d+))?[,)]', body)
        if o and '__offset' not in body: offs[name.lower()]=int(o.group(1) or 0)
    f['offsets']=offs
    f['required']=sorted(int(x) for x in re.findall(r'requiredField\(offset, (\d+)\)', t))
    return f

files=sorted(x for x in os.listdir(ORIG) if x.endswith('.ts'))
missing=[x for x in files if not os.path.exists(os.path.join(NEW,x))]
bad=[]; checked=0
for fn in files:
    if fn in missing: continue
    a=facts(os.path.join(ORIG,fn)); b=facts(os.path.join(NEW,fn))
    checked+=1
    for k in ('sizeOf','startObject','ident','required'):
        if a[k]!=b[k]: bad.append((fn,k,a[k],b[k]))
    for name,slot in a['slots'].items():
        if b['slots'].get(name)!=slot:
            bad.append((fn,'slot:'+name,slot,b['slots'].get(name)))
    for name,off in a['offsets'].items():
        if name in a['slots']: continue
        if b['offsets'].get(name)!=off:
            bad.append((fn,'byteoffset:'+name,off,b['offsets'].get(name)))
print('files compared: %d   missing from regen: %d' % (checked,len(missing)))
if missing: print('  missing:',missing)
print('mismatches: %d' % len(bad))
for x in bad[:60]: print('   %-34s %-28s orig=%s regen=%s' % x)
