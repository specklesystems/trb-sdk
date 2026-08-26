#!/usr/bin/env node
/** Full-detail dump of a small .trb file: `trb-inspect <file>`. */
import { readFileSync } from 'node:fs';
import { TrimBimReader, GeometryType, IdentifierType, PropertyType } from './index.js';

const path = process.argv[2] ?? new URL('../test/fixtures/synthetic.trb', import.meta.url).pathname;
const r = TrimBimReader.open(readFileSync(path));

console.log('header      ', r.header);
console.log('metadata    ', r.metadata());
console.log('entities    ', r.entityCount, 'classes:', r.classNames);
for (const e of r.allEntities()) {
  console.log(`  [${e.index}] ${e.className}`,
    e.guid ?? e.identifier ?? '(none)',
    e.ifcGuid ? `ifc=${e.ifcGuid}` : '',
    'origin=', [e.transform[12], e.transform[13], e.transform[14]]);
}
console.log('hierarchy   ', r.hierarchy());
console.log('layers      ', r.layers);
console.log('instances   ', r.instanceCount);
for (const g of r.allInstances()) {
  console.log(`  inst ${g.instanceIndex}: entity=${g.entityIndex} type=${GeometryType[g.geometryType]}`,
    'layer=', g.layer, 'colour=', g.material.color,
    'metal/rough=', g.material.metallic, g.material.roughness);
  console.log('    world origin=', [g.transform[12], g.transform[13], g.transform[14]]);
  console.log('    bbox=', g.boundingBox);
  const m = r.mesh(g);
  if (m) {
    console.log('    verts=', m.positions.length / 3, 'tris=', m.indices.length / 3);
    console.log('    positions=', Array.from(m.positions));
    console.log('    normals  =', Array.from(m.normals));
    console.log('    indices  =', Array.from(m.indices));
  }
}
const props = r.propertiesByEntity();
for (const [entity, list] of props) {
  console.log(`props for entity ${entity}:`);
  for (const p of list) console.log(`   ${p.set}.${p.name} (${PropertyType[p.type]}) =`, p.value);
}
