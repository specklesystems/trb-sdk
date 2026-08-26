import { readFileSync, writeFileSync } from 'node:fs';
import { TrimBimReader } from './index.js';

/** Dump a whole model to Wavefront OBJ, world space, for eyeballing. */
const [, , input, output] = process.argv;
const r = TrimBimReader.open(readFileSync(input!));
const pos: string[] = [];
const faces: string[] = [];
let base = 1;

for (const inst of r.allInstances()) {
  const m = r.triangles(inst);
  if (!m || m.positions.length === 0) continue;
  const T = inst.transform;
  const n = m.positions.length / 3;
  for (let i = 0; i < n; i++) {
    const x = m.positions[i * 3]!, y = m.positions[i * 3 + 1]!, z = m.positions[i * 3 + 2]!;
    pos.push(`v ${(T[0]! * x + T[4]! * y + T[8]! * z + T[12]!).toFixed(5)} ` +
             `${(T[1]! * x + T[5]! * y + T[9]! * z + T[13]!).toFixed(5)} ` +
             `${(T[2]! * x + T[6]! * y + T[10]! * z + T[14]!).toFixed(5)}`);
  }
  for (let i = 0; i < m.indices.length; i += 3) {
    faces.push(`f ${base + m.indices[i]!} ${base + m.indices[i + 1]!} ${base + m.indices[i + 2]!}`);
  }
  base += n;
}
writeFileSync(output!, pos.join('\n') + '\n' + faces.join('\n') + '\n');
console.log(`${output}: ${pos.length.toLocaleString()} vertices, ${faces.length.toLocaleString()} faces`);
