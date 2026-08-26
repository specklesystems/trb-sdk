#!/usr/bin/env node
/**
 * Dump every resolved property value to CSV: `trb-export-csv <in.trb> [out.csv]`.
 *
 * One row per (entity, property) pair, prefixed with the entity's identity and
 * class, so the output diffs cleanly across writers and converter versions —
 * this doubles as the corpus's parameter-extraction regression surface.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { TrimBimReader, PropertyType, IdentifierType } from './index.js';

const [input, output] = process.argv.slice(2);
if (!input) {
  console.error('usage: trb-export-csv <in.trb> [out.csv]   (default out: <in>.csv)');
  process.exit(2);
}

const r = TrimBimReader.open(readFileSync(input));

const esc = (v: unknown): string => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const rows: string[] = ['entity_index,identifier_type,guid,ifc_guid,identifier,class,set,name,type,value'];
const props = r.propertiesByEntity();
for (let i = 0; i < r.entityCount; i++) {
  const e = r.entity(i);
  const list = props.get(i);
  if (!list) continue;
  const prefix = [
    i,
    IdentifierType[e.identifierType],
    esc(e.guid),
    esc(e.ifcGuid),
    esc(e.identifier),
    esc(e.className),
  ].join(',');
  for (const p of list) {
    rows.push(`${prefix},${esc(p.set)},${esc(p.name)},${PropertyType[p.type] ?? p.type},${esc(p.value)}`);
  }
}

const out = output ?? input.replace(/\.trb$/i, '') + '.csv';
writeFileSync(out, rows.join('\n') + '\n');
console.log(`${out}: ${rows.length - 1} property rows across ${props.size} entities`);
