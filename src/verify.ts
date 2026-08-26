#!/usr/bin/env node
/**
 * Corpus verification: `trb-verify <file-or-dir> [...]`.
 *
 * For every .trb file: decode everything and check the invariants that do not
 * need ground truth. The strong one is the bounding box: each
 * GeometryDefinition stores a box the decoder never reads, so recomputing it
 * from decoded triangles and comparing is independent evidence that the vertex
 * pools and triangulation are read correctly.
 *
 * Exits non-zero when any file fails (out-of-range index, bbox mismatch, or
 * throw), so a directory of samples can be checked in CI with one command.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  TrimBimReader, GeometryType, IdentifierType, PropertyType,
  SUPPORTED_GEOMETRY_TYPES, triangulateFace, faceNormal,
} from './index.js';

const EPS = 1e-3;           // relative bbox tolerance
const AREA_EPS = 1e-6;      // relative face-area tolerance
const AREA_ABS = 1e-8;      // m² — ignore sliver faces below visibility
const AREA_FAIL = 1e-4;     // m² — missing area that counts as dropped geometry

/**
 * Triangulation completeness: for every face of every BRep, the summed area of
 * the produced triangles must equal outer-loop area minus hole areas. The bbox
 * check cannot see a dropped INTERIOR face; this can. UNDER-coverage means
 * dropped triangles (a decoder defect, FAIL); OVER-coverage happens when the
 * source face is itself self-intersecting and the triangulation covers the
 * fold twice (messy input, reported but not a failure). Returns
 * Under-coverage below AREA_FAIL (sub-cm² slivers of self-intersecting
 * ornament faces) is reported as minor rather than failed. Returns
 * [checkedFaces, materialUnder, minorUnder, overCoveredFaces, worstRelUnder].
 */
function checkBRepAreas(r: TrimBimReader): [number, number, number, number, number] {
  const g = r.geometry;
  let checked = 0, under = 0, minor = 0, over = 0, worst = 0;
  const pools: [number, (i: number) => { outerWiresLength(): number; outerWires(i: number): { vertexIndices(): ArrayLike<number> }; innerWiresLength(): number; innerWires(i: number): { outerWire: number; vertexIndices(): ArrayLike<number> }; vertices(i: number): { x: number; y: number; z: number } | { position: { x: number; y: number; z: number } } }][] = [
    [g.bRepsLength(), (i) => g.bReps(i)],
    [g.bRepWithNormalsLength(), (i) => g.bRepWithNormals(i) as never],
    [g.bRepWithUvsLength(), (i) => g.bRepWithUvs(i) as never],
  ];
  for (const [count, pool] of pools) {
    for (let bi = 0; bi < count; bi++) {
      const b = pool(bi);
      const point = (i: number): [number, number, number] => {
        const v = b.vertices(i) as { x?: number; position?: { x: number; y: number; z: number } };
        const p = v.position ?? (v as { x: number; y: number; z: number });
        return [p.x, p.y, p.z];
      };
      const holesFor = new Map<number, number[][]>();
      for (let i = 0; i < b.innerWiresLength(); i++) {
        const w = b.innerWires(i);
        const list = holesFor.get(w.outerWire) ?? [];
        list.push(Array.from(w.vertexIndices()));
        holesFor.set(w.outerWire, list);
      }
      for (let f = 0; f < b.outerWiresLength(); f++) {
        const outer = Array.from(b.outerWires(f).vertexIndices());
        if (outer.length < 3) continue;
        const holes = holesFor.get(f) ?? [];
        const n = faceNormal(outer, point);
        const ax = Math.abs(n[0]), ay = Math.abs(n[1]), az = Math.abs(n[2]);
        const p2: (i: number) => [number, number] =
          az >= ax && az >= ay ? (i) => [point(i)[0], point(i)[1]]
          : ay >= ax ? (i) => [point(i)[2], point(i)[0]]
          : (i) => [point(i)[1], point(i)[2]];
        const ringArea = (ring: number[]): number => {
          let s = 0;
          for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const a = p2(ring[j]!), c = p2(ring[i]!);
            s += (a[0] - c[0]) * (a[1] + c[1]);
          }
          return Math.abs(s / 2);
        };
        const target = ringArea(outer) - holes.filter((h) => h.length >= 3).reduce((s, h) => s + ringArea(h), 0);
        if (target <= 0) continue;
        const tri = triangulateFace(outer, holes, point);
        let covered = 0;
        for (let i = 0; i < tri.length; i += 3) {
          const a = p2(tri[i]!), c = p2(tri[i + 1]!), d = p2(tri[i + 2]!);
          covered += Math.abs((c[0] - a[0]) * (d[1] - a[1]) - (c[1] - a[1]) * (d[0] - a[0])) / 2;
        }
        checked++;
        const missing = target - covered;
        if (missing > AREA_ABS && missing / target > AREA_EPS) {
          if (missing > AREA_FAIL) under++;
          else minor++;
          if (missing / target > worst) worst = missing / target;
        } else if (-missing > AREA_ABS && -missing / target > AREA_EPS) {
          over++;
        }
      }
    }
  }
  return [checked, under, minor, over, worst];
}

function histogram<T>(xs: Iterable<T>): [T, number][] {
  const m = new Map<T, number>();
  for (const x of xs) m.set(x, (m.get(x) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function verifyFile(path: string): boolean {
  const t0 = Date.now();
  const buf = readFileSync(path);
  const r = TrimBimReader.open(buf);
  console.log(`\n=== ${path} (${(buf.byteLength / 1e6).toFixed(2)} MB)`);
  console.log('header      ', r.header, `(open in ${Date.now() - t0}ms)`);
  console.log('metadata    ', r.metadata());
  console.log('entities    ', r.entityCount, `(${r.classNames.length} classes)`);
  console.log('instances   ', r.instanceCount);
  console.log('hierarchy   ', r.entities.hierarchiesLength(), 'edges');

  const idTypes: string[] = [];
  for (let i = 0; i < r.entityCount; i++) {
    idTypes.push(IdentifierType[r.entities.entities(i).type] ?? '?');
  }
  console.log('id types    ', histogram(idTypes));

  // geometry type coverage: what this writer emitted vs what we decode
  const counts = [...r.geometryTypeCounts().entries()].sort((a, b) => b[1] - a[1]);
  const unsupported = counts.filter(([t]) => !SUPPORTED_GEOMETRY_TYPES.has(t));
  console.log('geom types  ', counts.map(([t, n]) =>
    `${GeometryType[t] ?? t}${SUPPORTED_GEOMETRY_TYPES.has(t) ? '' : ' (UNSUPPORTED)'}: ${n}`));
  if (unsupported.length) {
    const n = unsupported.reduce((s, [, c]) => s + c, 0);
    console.log('coverage    ', `${r.instanceCount - n} of ${r.instanceCount} instances decodable`,
      `— unsupported: ${unsupported.map(([t]) => GeometryType[t] ?? t).join(', ')}`);
  }

  // decode every instance; check indices, bbox agreement, degeneracy
  const t1 = Date.now();
  let meshes = 0, skipped = 0, verts = 0, tris = 0;
  let oob = 0, bboxBad = 0, worst = 0, degenerate = 0, empty = 0;
  const world = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
  for (const inst of r.allInstances()) {
    const d = r.decode(inst);
    if (d.kind === 'unsupported') { skipped++; continue; }
    meshes++;
    const nv = d.positions.length / 3;
    if (nv === 0) { empty++; continue; }
    verts += nv;
    for (let i = 0; i < d.indices.length; i++) if (d.indices[i]! >= nv) oob++;

    // recompute the definition-local bbox and compare with the stored one
    const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < d.positions.length; i += 3) {
      for (let k = 0; k < 3; k++) {
        const v = d.positions[i + k]!;
        if (v < mn[k]!) mn[k] = v;
        if (v > mx[k]!) mx[k] = v;
      }
    }
    const b = inst.boundingBox;
    let err = 0;
    for (let k = 0; k < 3; k++) {
      err = Math.max(err, Math.abs(mn[k]! - b.min[k]!), Math.abs(mx[k]! - b.max[k]!));
    }
    const scale = Math.max(1, ...b.max.map(Math.abs), ...b.min.map(Math.abs));
    if (err > EPS * scale) bboxBad++;
    worst = Math.max(worst, err / scale);

    // degenerate triangles (zero-area)
    for (let i = 0; i < d.indices.length; i += 3) {
      const a = d.indices[i]! * 3, c = d.indices[i + 1]! * 3, e = d.indices[i + 2]! * 3;
      const ux = d.positions[c]! - d.positions[a]!, uy = d.positions[c + 1]! - d.positions[a + 1]!, uz = d.positions[c + 2]! - d.positions[a + 2]!;
      const vx = d.positions[e]! - d.positions[a]!, vy = d.positions[e + 1]! - d.positions[a + 1]!, vz = d.positions[e + 2]! - d.positions[a + 2]!;
      if (Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) < 1e-12) degenerate++;
      tris++;
    }

    // world bbox from transformed corners, as a placement sanity check
    const T = inst.transform;
    for (const c of [b.min, b.max]) {
      const x = T[0]! * c[0]! + T[4]! * c[1]! + T[8]! * c[2]! + T[12]!;
      const y = T[1]! * c[0]! + T[5]! * c[1]! + T[9]! * c[2]! + T[13]!;
      const z = T[2]! * c[0]! + T[6]! * c[1]! + T[10]! * c[2]! + T[14]!;
      const p = [x, y, z];
      for (let k = 0; k < 3; k++) {
        world.min[k] = Math.min(world.min[k]!, p[k]!);
        world.max[k] = Math.max(world.max[k]!, p[k]!);
      }
    }
  }
  console.log('decoded     ', `${meshes} geometries (${empty} empty), ${skipped} skipped,`,
    `${verts.toLocaleString()} verts, ${tris.toLocaleString()} tris in ${Date.now() - t1}ms`);
  console.log('index oob   ', oob, oob === 0 ? 'OK' : 'FAIL');
  console.log('bbox check  ', `${bboxBad} mismatches, worst relative error ${worst.toExponential(2)}`,
    bboxBad === 0 ? 'OK' : 'FAIL');
  console.log('degenerate  ', tris ? `${degenerate} of ${tris.toLocaleString()} (${(100 * degenerate / tris).toFixed(3)}%)` : 'n/a');
  console.log('world bbox  ', {
    min: world.min.map((v) => +v.toFixed(3)),
    max: world.max.map((v) => +v.toFixed(3)),
  });

  const t3 = Date.now();
  const [facesChecked, facesUnder, facesMinor, facesOver, worstArea] = checkBRepAreas(r);
  console.log('face areas  ', `${facesUnder} under-covered of ${facesChecked} faces`,
    `(worst ${worstArea.toExponential(2)}), ${facesMinor} minor (<1cm²), ${facesOver} over-covered`,
    `(self-intersecting source), in ${Date.now() - t3}ms`, facesUnder === 0 ? 'OK' : 'FAIL');

  const t2 = Date.now();
  const props = r.propertiesByEntity();
  let pv = 0;
  for (const v of props.values()) pv += v.length;
  console.log('properties  ', `${props.size} entities carry ${pv.toLocaleString()} values in ${Date.now() - t2}ms`);
  const sample = [...props.entries()].find(([, v]) => v.length > 3);
  if (sample) {
    console.log(`sample entity ${sample[0]} (${r.entity(sample[0]).className}):`);
    for (const x of sample[1].slice(0, 8)) {
      console.log(`   ${x.set} / ${x.name} (${PropertyType[x.type]}) =`, x.value);
    }
  }
  return oob === 0 && bboxBad === 0 && facesUnder === 0;
}

const inputs = process.argv.slice(2);
if (inputs.length === 0) {
  console.error('usage: trb-verify <file-or-dir> [...]');
  process.exit(2);
}
const files = inputs.flatMap((p) =>
  statSync(p).isDirectory()
    ? readdirSync(p).filter((f) => f.toLowerCase().endsWith('.trb')).sort().map((f) => join(p, f))
    : [p]);
let failed = 0;
for (const f of files) {
  try {
    if (!verifyFile(f)) failed++;
  } catch (e) {
    console.error(`\n=== ${f}\nFAIL:`, e);
    failed++;
  }
}
console.log(`\n${files.length - failed}/${files.length} files OK`);
if (failed) process.exit(1);
