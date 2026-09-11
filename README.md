# @speckle/trb-sdk

SDK for **TrimBIM** (`.trb`) files, the format of Trimble Connect's Web3D
viewer: a reader, a corpus verifier, and example exporters. Zero runtime
dependencies, works in Node and in the browser.

The repository includes a diagram, output examples and quickstart site for GitHub Pages.
See [the release-site guide](docs/release-site.md) to preview or publish it.

TrimBIM is a FlatBuffers document with a columnar layout: entities, geometry
and properties live in pooled parallel arrays and reference each other by
index. This reader preserves that: opening is O(1) and nothing is materialised
until you ask for it. See [docs/format.md](docs/format.md) for the layout and
[docs/support-matrix.md](docs/support-matrix.md) for exactly what is decoded.

## Use

```ts
import { TrimBimReader, SUPPORTED_GEOMETRY_TYPES } from '@speckle/trb-sdk';

const trb = TrimBimReader.open(await file.arrayBuffer());

trb.header;                 // { identifier: 'TRB8', version: 8, ... }
trb.metadata();             // exporter key/values
trb.entityCount, trb.classNames;

for (const e of trb.allEntities()) {
  // e.className, e.ifcGuid, e.transform
}

trb.geometryTypeCounts();   // what this file contains, before decoding anything

for (const g of trb.allInstances()) {
  const d = trb.decode(g);  // discriminated union
  if (d.kind === 'triangles') {
    // d.positions / d.normals / d.uvs / d.indices
    // g.transform is entity global placement * instance local placement
  } else {
    // d.kind === 'unsupported': d.type says which GeometryType was skipped;
    // the low-level accessors in schema.ts can still reach it
  }
}

const props = trb.propertiesByEntity();   // Map<entityIndex, PropertyValue[]>
```

`transform` is a column-major `Float64Array(16)`, the order three.js
`Matrix4.elements` expects. `indices` is `Uint8Array | Uint16Array |
Uint32Array` — check, don't assume.

`decode()` is the primary entry point for converters: it distinguishes
"this geometry type is not decoded yet" from failure, and reserves a
`kind: 'polyline'` variant for alignment curves and grid lines. A future
minor version may emit new kinds — keep a default branch.

### Versions and malformed input

`open()` accepts any `TRB*` file and reports `header.version`; pass
`{ strict: true }` to reject anything but version 8. FlatBuffers vtables make
added table fields readable across versions; struct layout changes would not
be, and fail as range errors. Every followed offset and every
allocation-driving vector length is bounds-checked, so truncated or corrupt
files throw `TrbFormatError` instead of hanging or exhausting memory.

## CLI

```sh
trb-inspect    model.trb            # full-detail dump of a small file
trb-verify     samples/             # corpus check: decode everything, verify invariants
trb-export-csv model.trb out.csv    # every resolved property value, one row each
trb-export-usdz model.trb out.usdz  # example writer: instanced USD with materials
```

`trb-verify` recomputes every geometry's bounding box from decoded triangles
and compares it with the box stored in the file — which the decoder never
reads — so agreement is independent evidence the vertex pools and
triangulation are read correctly. Across the current corpus (Navisworks, IFC,
SketchUp and Tekla writers, 80k geometries, 15M+ triangles): 0 out-of-range
indices, 0 bbox mismatches. It exits non-zero on any failure, so it doubles
as the acceptance check for new corpus samples.

## Provenance

The schema was reconstructed for interoperability from the flatc-generated
TypeScript that Trimble publishes in the public source maps of its Web3D
viewer, and verified declaration-by-declaration against it (89/89, zero
layout mismatches). This package contains no Trimble code; the FlatBuffers
decoding is written from the published FlatBuffers specification, and face
triangulation vendors [mapbox/earcut](https://github.com/mapbox/earcut) (ISC,
see THIRD_PARTY_NOTICES.md) so the package stays zero-dependency. Details and
the regeneration pipeline: [docs/provenance.md](docs/provenance.md).

TrimBIM has no published specification and no compatibility promise. Treat
the schema as pinned to viewer build `v5.0.6649` and re-verify against new
builds. Trimble and TrimBIM are trademarks of Trimble Inc.

## License

GNU Affero General Public License v3.0 — see [LICENSE](LICENSE). The vendored
mapbox/earcut remains under its own ISC license (see
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)).
