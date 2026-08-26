# TrimBIM format notes

A FlatBuffers document. Root table `Model`, file identifier `TRB8`, uint32
little-endian root offset at byte 0, not size-prefixed.

The layout is columnar. Entities, geometry and properties live in pooled
parallel arrays and reference each other by index, which is what lets a viewer
random-access a large model without decoding it. The reader preserves that:
nothing is materialised until you ask for it.

The data model is IFC-shaped. Relationship kinds, property measure types and
owner history all map closely onto IFC concepts, and object GUIDs convert to
IFC `GlobalId` without loss.

## Structure

```
Model
├─ entities: ModelEntities
│  ├─ entities[]              Entity struct: identifier type + index, class index, global placement
│  ├─ hierarchies[]           parent/child/relationship-kind edges
│  ├─ guid_identifiers[]      16-byte MS GUIDs
│  ├─ string_identifiers[]
│  ├─ spatial_hash_identifiers[]
│  ├─ dwg_handle_identifiers[]
│  └─ entity_classes[]        "IfcWall", "IfcSlab", ...
├─ properties: ModelProperties
│  ├─ definitions[]           property set definitions: name + (name, type) pairs
│  ├─ property_set_bindings[] definition + flat value indices + entity list
│  └─ typed value pools       length/area/volume/mass/angle measures, strings,
│                             doubles, date-times
├─ geometry: ModelGeometry
│  ├─ definitions[]           (GeometryType, index into that type's pool, bbox)
│  ├─ instances[]             (local placement, entity, definition, material, layer)
│  ├─ local_placements[]      origin + x/y axes; z is their cross product
│  ├─ surface_materials[]     rgba, texture id, sidedness, line style, metallic, roughness
│  ├─ triangle_meshes[] / triangle_meshes8[]
│  ├─ textured_triangle_meshes[] / ...8[]
│  ├─ b_reps[] / b_rep_with_uvs[] / b_rep_with_normals[]
│  ├─ swept_disk_solids[], alignment_curves[], grid_line_containers[]
│  ├─ billboards[], billboard_texts[], bolts[], graphics_containers[]
│  ├─ textures[]              PNG or JPEG bytes
│  └─ layers[]
├─ map_conversions[]          georeferencing
├─ metadata[]                 key/value
└─ xrefs[]                    external references
```

## Geometry

`GeometryDefinition` names a `GeometryType` and an index into that type's pool.
`GeometryInstance` ties a definition to an entity, a local placement, a material
and a layer. World transform is the entity's global placement multiplied by the
instance's local placement. `Placement3` stores an origin and the x and y axes;
z is their cross product.

Real exports lean heavily on `BRep`. The three sample files validated so far
(Navisworks and IFC converter output) are all-but-entirely BRep, so BRep
decoding is not an edge case.

## BReps

A BRep is a list of planar faces over a shared vertex pool. Each outer wire is
a loop of vertex indices; each inner wire is a hole and names the outer wire it
belongs to. `brep()` triangulates by ear clipping on the face plane, bridging
holes into the outer loop first.

Plain `BRep` carries no normals, so a face normal is computed per face and
written to each of its vertices, which gives flat shading. `BRepWithNormals`
and `BRepWithUV` carry per-vertex data and use it directly. Vertices are emitted
per face rather than shared, because a shared corner belongs to several faces
with different normals.

Inner wires are not the only hole encoding. The SketchUp writer
(`SkpPlugin.dll`), and occasionally the IFC writer, emits **self-touching
"keyhole" outer wires**: the wire traces the boundary, revisits a bridge
position under a fresh vertex index, walks the hole in opposite winding, and
returns through the same position again — so one loop contains the same
coordinates two or three times with zero-width bridge edges. The ear clipper
handles this by never letting a corner-coincident point block an ear, with a
relaxed strictly-interior sweep as the deadlock fallback. A decoder that
treats these loops as invalid silently drops whole faces.

## Meshes

A mesh holds three pools. `positions` and `normals` are `Vec3f` arrays,
`vertices` is a list of `(positionIndex, normalIndex)` pairs, and `indices`
addresses the *vertices* list. UVs, when present, are addressed by
`positionIndex` rather than by vertex slot. The `...8` variants are the same
thing with `ubyte` indices, used for small meshes.

Normals are stored per vertex as written by the exporter. Trimble's own viewer
additionally averages them against computed triangle normals for smooth
shading; that is a rendering choice, not part of the file, so this reader
returns what is stored.

## Sidedness and front/back shell pairs

`SurfaceMaterial.sidedness` is load-bearing, not a hint. The SketchUp writer
models a two-sided SketchUp face as **two coincident mirror shells** on the
same entity: a `FrontFace` instance (typically textured) and a `BackFace`
instance carrying the back material — identical vertex positions, reversed
windings, exactly negated normals. Trimble's viewer renders each shell with
sidedness-aware backface culling, so they never overlap on screen. A consumer
that renders double-sided must either honor `sidedness` or drop each
`BackFace` instance whose entity carries a coincident non-`BackFace` twin
(same bounding box); rendering both produces severe z-fighting. Orphan back
shells (no front twin) do occur and must be kept. The Tekla, IFC and
Navisworks writers emit only `Single`/`Double` materials and are unaffected.

## Swept disk solids

A `SweptDiskSolidContainer` is one reinforcement group as written by the Tekla
exporter: one directrix per bar and one radius per directrix
(`radius.length == directrices.length`). A directrix is an ordered list of
segments — `types[i]` names the pool (line / polyline / arc), `indexes[i]` the
element — that chain end-to-end within float32 noise. Arc parameterisation,
verified against that continuity in real files:

```
point(t) = center + r·(cos t · ref_direction + sin t · (axis × ref_direction)),  t ∈ [0, angle]
```

Bar ends are **hemispherical, not flat**: the stored per-definition bounding
boxes extend exactly one radius past the path endpoints along the path
direction. A flat-capped tessellation fails the bbox cross-check on ~3,200 of
4,991 rebar geometries in the Tekla sample; hemispherical caps bring all of
them into agreement.

## Properties

A `PropertySet` binds one definition to **one** list of value indices plus the
list of entities that share those exact values, so `values.length` always equals
`definition.properties.length`. A set covering 52 entities stores its values
once. Getting this wrong is easy and silently produces plausible output for the
first entity in each set only.

Most value indices address a typed pool named by the property's `PropertyType`.
The exceptions are `IntValue`, `Boolean` and `Logical`, where the index *is* the
value; `IntValue` is a uint32 to be reinterpreted as int32, which is why Revit
category ids come back negative.
