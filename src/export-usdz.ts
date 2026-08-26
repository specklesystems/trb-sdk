#!/usr/bin/env node
/**
 * Export a whole model to USDZ: `trb-to-usdz <in.trb> <out.usdz>`.
 *
 * Preserves the file's instancing. Geometry is decoded once per
 * (definition, material) pair into a prototype Mesh under a root-level
 * `over "Prototypes"` (an over prim is not itself composed into the render
 * hierarchy, the standard prototype-parking pattern), and every TRB geometry
 * instance becomes an `instanceable` Xform that internally references its
 * prototype and carries the composed world transform.
 *
 * TRB transforms are column-major (three.js order); USD's matrix4d rows are
 * row vectors with the translation in the fourth row, which is byte-for-byte
 * the same 16-double sequence, so the array is emitted in storage order.
 *
 * Materials become UsdPreviewSurface materials, bound on the instance prims
 * (binding inherits down to the referenced mesh, and binding at the instance
 * rather than inside the prototype sidesteps the UsdShade limitation on
 * bindings that live inside instance prototypes).
 *
 * The container holds a single ASCII .usda layer, which usdview, Omniverse
 * and most DCCs open directly. Apple's QuickLook/ARKit historically expects
 * binary .usdc inside a usdz; converting the layer with Pixar's usdcrush /
 * usdzip covers that case.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { TrimBimReader, MaterialData, MeshData } from './index.js';
import { createUsdz } from './usdz.js';

const [, , input, output] = process.argv;
if (!input || !output) {
  console.error('usage: trb-to-usdz <in.trb> <out.usdz>');
  process.exit(2);
}

const r = TrimBimReader.open(readFileSync(input));

// ~6 significant digits keeps the text compact; sub-micron noise is dropped
const f = (v: number): string => {
  const n = Number(v.toPrecision(6));
  return Object.is(n, -0) ? '0' : String(n);
};

// ---- collect prototypes (deduped by definition+material) and instances ----

interface Proto {
  name: string;
  mesh: MeshData;
  material: MaterialData;
}

const protos = new Map<string, Proto | null>();
const materials = new Map<number, MaterialData>();
const instances: { proto: string; matIndex: number; transform: Float64Array }[] = [];
let skipped = 0;

for (const g of r.allInstances()) {
  const key = `${g.definitionIndex}:${g.material.index}`;
  if (!protos.has(key)) {
    const d = r.decode(g);
    if (d.kind !== 'triangles' || d.positions.length === 0) {
      protos.set(key, null);
    } else {
      protos.set(key, {
        name: `p${g.definitionIndex}_${g.material.index}`,
        mesh: d,
        material: g.material,
      });
      if (!materials.has(g.material.index)) materials.set(g.material.index, g.material);
    }
  }
  const proto = protos.get(key);
  if (!proto) {
    skipped++;
    continue;
  }
  instances.push({ proto: proto.name, matIndex: g.material.index, transform: g.transform });
}

// ---- author the usda layer ----

const L: string[] = [];
L.push('#usda 1.0');
L.push('(');
L.push(`    defaultPrim = "Model"`);
L.push('    metersPerUnit = 1');
L.push('    upAxis = "Z"');
L.push(`    doc = "Exported from ${basename(input)} by @speckle/trb-sdk"`);
L.push(')');
L.push('');
L.push('def Xform "Model"');
L.push('{');

L.push('    def Scope "Materials"');
L.push('    {');
for (const [idx, m] of materials) {
  const c = m.color;
  L.push(`        def Material "m${idx}"`);
  L.push('        {');
  L.push(`            token outputs:surface.connect = </Model/Materials/m${idx}/pbr.outputs:surface>`);
  L.push('            def Shader "pbr"');
  L.push('            {');
  L.push('                uniform token info:id = "UsdPreviewSurface"');
  L.push(`                color3f inputs:diffuseColor = (${f(c.r / 255)}, ${f(c.g / 255)}, ${f(c.b / 255)})`);
  L.push(`                float inputs:opacity = ${f(c.a / 255)}`);
  L.push(`                float inputs:metallic = ${f(m.metallic)}`);
  L.push(`                float inputs:roughness = ${f(m.roughness)}`);
  L.push('                token outputs:surface');
  L.push('            }');
  L.push('        }');
}
L.push('    }');
L.push('');

let instanceCount = 0;
for (const inst of instances) {
  const t = inst.transform;
  const rows: string[] = [];
  for (let rI = 0; rI < 4; rI++) {
    rows.push(`(${f(t[rI * 4]!)}, ${f(t[rI * 4 + 1]!)}, ${f(t[rI * 4 + 2]!)}, ${f(t[rI * 4 + 3]!)})`);
  }
  L.push(`    def Xform "i${instanceCount}" (`);
  L.push('        instanceable = true');
  L.push(`        prepend references = </Prototypes/${inst.proto}>`);
  L.push('    )');
  L.push('    {');
  L.push(`        matrix4d xformOp:transform = ( ${rows.join(', ')} )`);
  L.push('        uniform token[] xformOpOrder = ["xformOp:transform"]');
  L.push(`        rel material:binding = </Model/Materials/m${inst.matIndex}>`);
  L.push('    }');
  instanceCount++;
}
L.push('}');
L.push('');

L.push('over "Prototypes"');
L.push('{');
for (const proto of protos.values()) {
  if (!proto) continue;
  const m = proto.mesh;
  const nTris = m.indices.length / 3;
  const counts = new Array<string>(nTris).fill('3');
  const idx = Array.from(m.indices, String);
  const pts: string[] = [];
  const nrm: string[] = [];
  for (let i = 0; i < m.positions.length; i += 3) {
    pts.push(`(${f(m.positions[i]!)}, ${f(m.positions[i + 1]!)}, ${f(m.positions[i + 2]!)})`);
    nrm.push(`(${f(m.normals[i]!)}, ${f(m.normals[i + 1]!)}, ${f(m.normals[i + 2]!)})`);
  }
  L.push(`    def Mesh "${proto.name}"`);
  L.push('    {');
  L.push(`        int[] faceVertexCounts = [${counts.join(', ')}]`);
  L.push(`        int[] faceVertexIndices = [${idx.join(', ')}]`);
  L.push(`        point3f[] points = [${pts.join(', ')}]`);
  L.push(`        normal3f[] normals = [${nrm.join(', ')}] (`);
  L.push('            interpolation = "vertex"');
  L.push('        )');
  L.push('        uniform token subdivisionScheme = "none"');
  L.push('        uniform bool doubleSided = 1');
  L.push('    }');
}
L.push('}');

const usda = new TextEncoder().encode(L.join('\n') + '\n');
const layerName = basename(output).replace(/\.usdz$/i, '') + '.usda';
writeFileSync(output, createUsdz([{ name: layerName, data: usda }]));

const protoCount = [...protos.values()].filter(Boolean).length;
console.log(`${output}: ${protoCount} prototypes, ${instanceCount} instances, ` +
  `${materials.size} materials, ${skipped} unsupported instances skipped, ` +
  `${(usda.length / 1e6).toFixed(2)} MB usda`);
