# Support matrix

Status legend:

- **decoded** — `decode()` returns triangles; validated against real files
- **low-level** — reachable through the generated accessors in `src/schema.ts`,
  not yet surfaced by the high-level API; `decode()` reports `unsupported`
- **planned: polyline** — will surface through the reserved
  `kind: 'polyline'` variant of `DecodedGeometry`

## Geometry types

| GeometryType | Status | Notes |
|---|---|---|
| BRep | decoded | hole-aware ear-clip triangulation, computed flat normals |
| BRepWithNormals | decoded | per-vertex normals as stored |
| BRepWithUV | decoded | per-vertex UVs |
| TriangleMesh | decoded | pooled positions/normals |
| TriangleMesh8 | decoded | ubyte-index variant |
| TexturedTriangleMesh | decoded | UVs decoded; texture bytes not yet surfaced (see below) |
| TexturedTriangleMesh8 | decoded | ubyte-index variant |
| SweptDiskSolid | decoded | rebar tube sweeps, tessellated with parallel-transported frames and hemispherical end caps |
| AlignmentCurve | low-level, planned: polyline | civil alignments (lines, circular/clothoidal/transition arcs) |
| GridLineContainer | low-level, planned: polyline | grid lines and arcs |
| GraphicsContainer | low-level | mixed line/polyline/arc container; 382 instances across Navisworks and SketchUp samples — the first unsupported type worth surfacing |
| CoordinateGeometryPoint | low-level | |
| Billboard / TexturedBillboard | low-level | camera-facing sprites |
| BillboardText | low-level | text records |
| Bolt | low-level | bolt/washer/nut/hole assemblies |
| None | n/a | |

## Everything else

| Area | Status |
|---|---|
| Header, metadata | high-level |
| Entities + all four identifier kinds (GUID, string, spatial hash, DWG handle) | high-level |
| IFC GlobalId conversion (both directions) | high-level |
| Hierarchy edges | high-level |
| Property sets with typed value resolution | high-level |
| Layers, surface materials | high-level |
| Instances with composed world transforms | high-level |
| Stored bounding boxes | high-level (and used as a decode invariant by `trb-verify`) |
| Texture bytes (PNG/JPEG pool) | low-level — deliberately punted for now |
| Map conversions (georeferencing) | low-level |
| XRefs, products, owner history | low-level |

## Writer coverage

Validated against real files from these writers (all TrimBimConverter 3.1.1):

| Writer | Sample | Geometry seen |
|---|---|---|
| `NWDPlugin.dll` (Navisworks) | 1.0 MB, 259 entities | BRep ×84, GraphicsContainer ×1 |
| `IFCPlugin.dll` (IFC) | 7.1 MB, 14,884 entities | BRep ×28,880 |
| `IFCPlugin.dll` (IFC) | 2.9 MB, 9,118 entities | BRep ×21,447 |
| `SkpPlugin.dll` (SketchUp) | 28.7 MB, 804 entities | BRep ×905, BRepWithUV ×412, BRepWithNormals ×339, GraphicsContainer ×106 |
| SketchUp, PBR metadata | 14.0 MB, 3,951 entities | BRepWithNormals ×3,063, BRep ×852, BRepWithUV ×626, GraphicsContainer ×275 |
| Tekla Structures 2026 direct | 12.7 MB, 31,493 entities | BRep ×19,051, SweptDiskSolid ×4,991, GridLineContainer ×16 |

All: 0 out-of-range indices, 0 bbox mismatches. Worst relative bbox error is
`0.00e+0` for the exact decoders and `5.8e-4` for the Tekla file, where the
8-sided swept-tube tessellation legitimately under-inscribes the stored box
(within the 1e-3 tolerance). The SketchUp samples were the first to exercise
the `BRepWithNormals`/`BRepWithUV` paths on real data and surfaced the
keyhole hole encoding (see [format.md](format.md)); they also carry
`None`-type identifiers heavily and ~0.4% degenerate sliver triangles, which
is the geometry itself, not a decode error. SketchUp also emits two-sided
faces as coincident FrontFace/BackFace shell pairs — consumers rendering
double-sided must dedupe or honor `sidedness` (see
[format.md](format.md#sidedness-and-frontback-shell-pairs)). The Tekla sample
surfaced SweptDiskSolid (rebar) at scale and pinned down its hemispherical
end caps.
Revit-written samples are still wanted; run `trb-verify <dir>` to check new
files.
