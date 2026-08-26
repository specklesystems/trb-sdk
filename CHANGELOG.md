# Changelog

## 0.1.0 — unreleased

Initial release.

- FlatBuffers reader written from the published specification; zero runtime
  dependencies, Node and browser.
- High-level API: header, metadata, entities with all four identifier kinds,
  IFC GlobalId conversion, hierarchy, property sets with typed value
  resolution, layers, materials, instances with composed world transforms.
- Geometry decoding via `decode()` (discriminated union): the four triangle
  mesh types and all three BRep variants with hole-aware triangulation.
  Unsupported types are reported, not silently dropped, and remain reachable
  through the low-level `schema.ts` accessors.
- `geometryTypeCounts()` + `SUPPORTED_GEOMETRY_TYPES` for coverage telemetry.
- Version-tolerant `open()` with a `strict` option; `TrbFormatError` with
  bounds-checked offsets and vector lengths against hostile/corrupt files.
- CLIs: `trb-inspect` (full dump), `trb-verify` (corpus invariant checks:
  index ranges, stored-vs-recomputed bounding boxes, degenerate triangles).
- Face triangulation is mapbox/earcut (vendored, ISC), robust against the
  weakly simple faces real writers emit: SketchUp's self-touching "keyhole"
  outer wires and Tekla slab faces with dozens of hole penetrations, both of
  which deadlocked a hand-rolled ear clipper and silently dropped triangles.
- `trb-verify` gains a face-area completeness check (triangle area vs
  outer-minus-holes area per BRep face) — the invariant that catches dropped
  interior faces, which the bounding-box check cannot see.
- SweptDiskSolid decoding (Tekla rebar): directrix sampling (lines, polylines,
  arcs), parallel-transported tube frames, hemispherical end caps — the cap
  shape pinned down by the stored-bounding-box invariant.
- Validated against Navisworks-, IFC-, SketchUp- and Tekla-written files: 0
  out-of-range indices, 0 bbox mismatches across 80k+ geometries and 15M+
  triangles.
