import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  TrimBimReader, GeometryType, IdentifierType, PropertyType,
  bytesToIfcGuid, bytesToMsGuid, ifcGuidToBytes, readHeader,
  TrbFormatError, SUPPORTED_GEOMETRY_TYPES, type MeshData, triangulateFace,
} from './index.js';

const FIXTURE = new URL('../test/fixtures/synthetic.trb', import.meta.url);
const open = () => TrimBimReader.open(readFileSync(FIXTURE));

test('header', () => {
  const r = open();
  assert.equal(r.header.identifier, 'TRB8');
  assert.equal(r.header.version, 8);
});

test('rejects non-TrimBIM input', () => {
  assert.throws(() => readHeader(new Uint8Array(4)), /too small/);
  const junk = new Uint8Array(32);
  junk.set([0x50, 0x4b, 0x03, 0x04], 4);
  assert.throws(() => readHeader(junk), /bad file identifier/);
});

test('entities and identifiers', () => {
  const r = open();
  assert.equal(r.entityCount, 2);
  assert.deepEqual(r.classNames, ['IfcWall', 'IfcSlab']);
  const e0 = r.entity(0);
  assert.equal(e0.identifierType, IdentifierType.Guid);
  assert.equal(e0.guid, '2f3d4e5a-1122-3344-5566-778899aabbcc');
  assert.equal(e0.ifcGuid!.length, 22);
  assert.deepEqual([e0.transform[12], e0.transform[13], e0.transform[14]], [10, 20, 30]);
});

test('entity 1 carries a rotated basis', () => {
  const r = open();
  const e1 = r.entity(1);
  // x axis (0,1,0), y axis (-1,0,0) implies z (0,0,1)
  assert.deepEqual(Array.from(e1.transform.slice(0, 3)), [0, 1, 0]);
  assert.deepEqual(Array.from(e1.transform.slice(4, 7)), [-1, 0, 0]);
  assert.deepEqual(Array.from(e1.transform.slice(8, 11)), [0, 0, 1]);
});

test('hierarchy', () => {
  const r = open();
  assert.deepEqual(r.hierarchy(), [{ parent: 0, child: 1, type: 3 }]);
});

test('geometry instance composes entity and local placement', () => {
  const r = open();
  assert.equal(r.instanceCount, 1);
  const g = r.instance(0);
  assert.equal(g.geometryType, GeometryType.TriangleMesh);
  assert.equal(g.layer, 'A-WALL');
  assert.deepEqual(g.material.color, { r: 200, g: 100, b: 50, a: 255 });
  // entity at (10,20,30), local placement at (1.5,2.5,3.5)
  assert.deepEqual([g.transform[12], g.transform[13], g.transform[14]], [11.5, 22.5, 33.5]);
});

test('mesh decoding resolves the shared pools', () => {
  const r = open();
  const m = r.mesh(r.instance(0))!;
  assert.ok(m);
  assert.equal(m.positions.length, 12);
  assert.deepEqual(Array.from(m.positions), [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0]);
  // every vertex points at the single pooled normal
  assert.deepEqual(Array.from(m.normals), [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]);
  assert.deepEqual(Array.from(m.indices), [0, 1, 2, 1, 3, 2]);
  assert.equal(m.uvs, null);
});

test('properties resolve through the typed pools', () => {
  const r = open();
  const props = r.propertiesByEntity().get(0)!;
  assert.equal(props.length, 3);
  assert.deepEqual(props.map((p) => [p.name, p.value]), [
    ['LoadBearing', true],
    ['FireRating', 'REI 60'],
    ['Volume', 42.5],
  ]);
  assert.equal(props[2]!.type, PropertyType.VolumeMeasure);
  assert.equal(props[0]!.set, 'Pset_WallCommon');
});

test('metadata', () => {
  const r = open();
  assert.deepEqual(r.metadata(), { exporter: 'synthetic-test' });
});

test('decode() distinguishes supported from unsupported geometry', () => {
  const r = open();
  const d = r.decode(r.instance(0));
  assert.equal(d.kind, 'triangles');
  if (d.kind === 'triangles') assert.equal(d.positions.length, 12);
  // fabricate a ref pointing at a type we do not decode yet
  const u = r.decode({ ...r.instance(0), geometryType: GeometryType.GridLineContainer });
  assert.deepEqual(u, { kind: 'unsupported', type: GeometryType.GridLineContainer });
  assert.ok(!SUPPORTED_GEOMETRY_TYPES.has(GeometryType.GridLineContainer));
});

test('geometryTypeCounts reports instance coverage', () => {
  const r = open();
  assert.deepEqual([...r.geometryTypeCounts()], [[GeometryType.TriangleMesh, 1]]);
});

test('version tolerance: unknown TRB version opens unless strict', () => {
  const bytes = new Uint8Array(readFileSync(FIXTURE));
  bytes[7] = '9'.charCodeAt(0); // TRB8 -> TRB9
  const r = TrimBimReader.open(bytes);
  assert.equal(r.header.version, 9);
  assert.throws(() => TrimBimReader.open(bytes, { strict: true }), TrbFormatError);
  assert.doesNotThrow(() => TrimBimReader.open(readFileSync(FIXTURE), { strict: true }));
});

test('truncated file fails with TrbFormatError, not a hang', () => {
  // 12 bytes: enough for the header, but the root table at offset 24 is gone
  const bytes = new Uint8Array(readFileSync(FIXTURE)).subarray(0, 12);
  assert.throws(() => TrimBimReader.open(bytes), TrbFormatError);
});

test('hostile root offset fails with TrbFormatError', () => {
  const bytes = new Uint8Array(readFileSync(FIXTURE));
  new DataView(bytes.buffer).setUint32(0, 0xffffffff, true);
  assert.throws(() => TrimBimReader.open(bytes), TrbFormatError);
});

test('bit-flip fuzz: corrupt offsets throw instead of hanging or over-allocating', () => {
  const original = new Uint8Array(readFileSync(FIXTURE));
  const step = Math.max(4, Math.floor(original.byteLength / 64));
  for (let pos = 0; pos + 4 <= original.byteLength; pos += step) {
    const bytes = original.slice();
    new DataView(bytes.buffer).setUint32(pos, 0xfffffff0, true);
    try {
      const r = TrimBimReader.open(bytes);
      for (const e of r.allEntities()) void e;
      for (const g of r.allInstances()) void r.decode(g);
      r.propertiesByEntity();
      r.hierarchy();
      r.metadata();
    } catch (e) {
      // corruption must surface as an Error (TrbFormatError or RangeError),
      // never as a hang, OOM, or non-Error throw
      assert.ok(e instanceof Error, `non-Error thrown for corruption at ${pos}: ${e}`);
    }
  }
});

// compile-time check: large BReps legitimately return Uint32Array indices
const _indicesMayBeU32: MeshData['indices'] = new Uint32Array(0);
void _indicesMayBeU32;

test('keyhole outer wire (SketchUp inline hole encoding) triangulates fully', () => {
  // 10x10 square with a 6x6 hole traced inline through a self-touching wire:
  // the bridge position (0,0) appears three times under different indices.
  // SkpPlugin.dll writes holes this way instead of using inner wires.
  const pts: [number, number, number][] = [
    [0, 0, 0], [10, 0, 0], [10, 10, 0], [0, 10, 0],
    [0, 0, 0], [2, 2, 0], [2, 8, 0], [8, 8, 0], [8, 2, 0], [2, 2, 0], [0, 0, 0],
  ];
  const tri = triangulateFace([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [], (i) => pts[i]!);
  assert.ok(tri.length > 0, 'keyhole face must not be dropped');
  let area = 0;
  for (let i = 0; i < tri.length; i += 3) {
    const a = pts[tri[i]!]!, b = pts[tri[i + 1]!]!, c = pts[tri[i + 2]!]!;
    area += Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2;
  }
  // outer 100 minus hole 36; any overlap or filled hole breaks this
  assert.ok(Math.abs(area - 64) < 1e-9, `covered area ${area}, expected 64`);
});

test('GUID conversion round-trips', () => {
  const bytes = new Uint8Array([
    0x5a, 0x4e, 0x3d, 0x2f, 0x22, 0x11, 0x44, 0x33,
    0x55, 0x66, 0x77, 0x88, 0x99, 0xaa, 0xbb, 0xcc,
  ]);
  assert.equal(bytesToMsGuid(bytes), '2f3d4e5a-1122-3344-5566-778899aabbcc');
  const ifc = bytesToIfcGuid(bytes);
  assert.equal(ifc.length, 22);
  assert.deepEqual(Array.from(ifcGuidToBytes(ifc)), Array.from(bytes));
});
