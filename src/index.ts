/**
 * Reader for TrimBIM (.trb) files.
 *
 * TrimBIM is a FlatBuffers document with root table `Model` and file identifier
 * `TRB8`. The layout is columnar: entities, geometry and properties are pooled
 * into parallel arrays and referenced by index, which is what allows random
 * access without decoding the whole file. This reader keeps that property; it
 * decodes lazily and only materialises what you ask for.
 */
import { ByteBuffer, TrbFormatError } from './buffer.js';
import { bytesToIfcGuid, bytesToMsGuid } from './guid.js';
import {
  GeometryType, HierarchyType, IdentifierType, PropertyType, Sidedness, LineStyle,
  Model, ModelEntities, ModelGeometry, ModelProperties,
  TriangleMesh, TriangleMesh8, TexturedTriangleMesh, TexturedTriangleMesh8,
  BRep, BRepWithNormal, BRepWithUV, InnerWire, OuterWire,
} from './schema.js';
import { triangulateFace, faceNormal } from './earcut.js';
import { tessellateSweptDisk } from './sweep.js';

export * from './schema.js';
export { triangulateFace, faceNormal } from './earcut.js';
export { tessellateSweptDisk } from './sweep.js';
export * from './guid.js';
export { ByteBuffer, TrbFormatError } from './buffer.js';

export const FILE_IDENTIFIER = 'TRB8';

/** The schema version this reader was reconstructed against. */
export const SUPPORTED_VERSION = 8;

/**
 * Geometry types `decode()` can currently turn into triangles. Everything else
 * comes back as `{ kind: 'unsupported' }` but stays reachable through the
 * low-level accessors in `schema.ts`.
 */
export const SUPPORTED_GEOMETRY_TYPES: ReadonlySet<GeometryType> = new Set([
  GeometryType.TriangleMesh,
  GeometryType.TriangleMesh8,
  GeometryType.TexturedTriangleMesh,
  GeometryType.TexturedTriangleMesh8,
  GeometryType.BRep,
  GeometryType.BRepWithNormals,
  GeometryType.BRepWithUV,
  GeometryType.SweptDiskSolid,
]);

/** Column-major 4x4, the order three.js `Matrix4.elements` expects. */
export type Matrix4 = Float64Array;

export interface TrbHeader {
  identifier: string;
  version: number;
  byteLength: number;
}

export interface EntityRef {
  index: number;
  identifierType: IdentifierType;
  /** Microsoft GUID form, when identifierType is Guid. */
  guid?: string;
  /** IFC GlobalId, 22 chars, when identifierType is Guid. */
  ifcGuid?: string;
  /** Present when identifierType is String or DwgHandle. */
  identifier?: string;
  /** Present when identifierType is SpatialHash: the anchor point. */
  spatialHash?: [number, number, number];
  /** IFC-style class name, e.g. IfcWall. */
  className: string;
  /** World placement of the entity. */
  transform: Matrix4;
}

export interface PropertyValue {
  set: string;
  name: string;
  type: PropertyType;
  value: string | number | boolean | bigint | null;
}

export interface HierarchyEdge {
  parent: number;
  child: number;
  type: HierarchyType;
}

export interface MeshData {
  /** Interleaved xyz, one triple per vertex. */
  positions: Float32Array;
  /** Interleaved xyz, one triple per vertex, as stored (not smoothed). */
  normals: Float32Array;
  /** Interleaved uv, present only for textured meshes. */
  uvs: Float32Array | null;
  /** Triangle indices into the vertex arrays. */
  indices: Uint8Array | Uint16Array | Uint32Array;
}

/**
 * Result of `decode()`. A discriminated union so a converter can tell
 * "this geometry type is not decoded yet" apart from a decode failure, and so
 * future non-triangle outputs can be added without a breaking change:
 * a `kind: 'polyline'` variant is reserved for alignment curves and grid
 * lines. Always keep a default branch for kinds this version does not emit.
 */
export type DecodedGeometry =
  | ({ kind: 'triangles' } & MeshData)
  | { kind: 'unsupported'; type: GeometryType };

export interface GeometryRef {
  instanceIndex: number;
  entityIndex: number;
  definitionIndex: number;
  geometryType: GeometryType;
  /** Index into the pool for this geometry type. */
  geometryIndex: number;
  layer: string;
  material: MaterialData;
  /** entity global placement multiplied by instance local placement. */
  transform: Matrix4;
  boundingBox: { min: [number, number, number]; max: [number, number, number] };
}

export interface MaterialData {
  index: number;
  color: { r: number; g: number; b: number; a: number };
  textureId: number;
  sidedness: Sidedness;
  lineStyle: LineStyle;
  metallic: number;
  roughness: number;
}

export class TrimBimReader {
  readonly bb: ByteBuffer;
  readonly model: Model;
  readonly entities: ModelEntities;
  readonly geometry: ModelGeometry;
  readonly properties: ModelProperties;
  readonly header: TrbHeader;

  private _classes?: string[];
  private _layers?: string[];
  private _stringIds?: string[];

  private constructor(bb: ByteBuffer, header: TrbHeader) {
    this.bb = bb;
    this.header = header;
    this.model = Model.root(bb);
    const e = this.model.entities;
    const g = this.model.geometry;
    const p = this.model.properties;
    if (!e || !g || !p) throw new Error('TrimBIM: root Model is missing a required table');
    this.entities = e;
    this.geometry = g;
    this.properties = p;
  }

  /**
   * Open a TrimBIM file.
   *
   * By default any `TRB*` identifier is accepted and `header.version` reports
   * what was found: FlatBuffers vtables make added table fields readable across
   * versions, so a newer file usually still opens (struct layout changes would
   * not, and fail as out-of-range reads). Pass `strict: true` to reject any
   * version other than {@link SUPPORTED_VERSION}.
   */
  static open(input: ArrayBuffer | Uint8Array, opts?: { strict?: boolean }): TrimBimReader {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    const header = readHeader(bytes);
    if (opts?.strict && header.version !== SUPPORTED_VERSION) {
      throw new TrbFormatError(
        `version ${header.version} (${header.identifier}) is not the supported version ${SUPPORTED_VERSION}`);
    }
    return new TrimBimReader(new ByteBuffer(bytes), header);
  }

  // ---- entities -------------------------------------------------------

  get entityCount(): number {
    return this.entities.entitiesLength();
  }

  get classNames(): string[] {
    return (this._classes ??= this.entities.entityClasses());
  }

  entity(i: number): EntityRef {
    const e = this.entities.entities(i);
    const type = e.type;
    const idx = e.identifierIndex;
    const out: EntityRef = {
      index: i,
      identifierType: type,
      className: this.classNames[e.classIndex] ?? '',
      transform: placementToMatrix(this.entities.entities(i).globalPlacement),
    };
    if (type === IdentifierType.Guid) {
      const g = this.entities.guidIdentifiers(idx);
      const raw = this.bb.bytes.subarray(g.pos, g.pos + 16);
      out.guid = bytesToMsGuid(raw);
      out.ifcGuid = bytesToIfcGuid(raw);
    } else if (type === IdentifierType.String) {
      this._stringIds ??= this.entities.stringIdentifiers();
      out.identifier = this._stringIds[idx];
    } else if (type === IdentifierType.SpatialHash) {
      const h = this.entities.spatialHashIdentifiers(idx);
      out.spatialHash = [h.x, h.y, h.z];
    } else if (type === IdentifierType.DwgHandle) {
      const h = this.entities.dwgHandleIdentifiers();
      out.identifier = h[idx] !== undefined ? h[idx]!.toString(16) : undefined;
    }
    return out;
  }

  *allEntities(): Generator<EntityRef> {
    for (let i = 0; i < this.entityCount; i++) yield this.entity(i);
  }

  // ---- hierarchy ------------------------------------------------------

  hierarchy(): HierarchyEdge[] {
    const n = this.entities.hierarchiesLength();
    const out: HierarchyEdge[] = new Array(n);
    for (let i = 0; i < n; i++) {
      const h = this.entities.hierarchies(i);
      out[i] = { parent: h.parentElementId, child: h.childElementId, type: h.type };
    }
    return out;
  }

  // ---- properties -----------------------------------------------------

  /**
   * Properties grouped by entity index.
   *
   * A PropertySet binds one definition to ONE list of value indices and the
   * list of entities that share those exact values. So `values.length` always
   * equals `definition.properties.length`, and a set covering 50 entities
   * stores the values once. That deduplication is why a model with tens of
   * thousands of property values stays small.
   *
   * Each index addresses the typed pool named by the property's PropertyType,
   * except IntValue, Boolean and Logical, where the index IS the value.
   */
  propertiesByEntity(): Map<number, PropertyValue[]> {
    const p = this.properties;
    const setNames = p.propertySetNames();
    const propNames = p.propertyNames();
    const strings = p.stringValues();
    const doubles = p.doubleValues();
    const lengths = p.lengthMeasures();
    const areas = p.areaMeasures();
    const volumes = p.volumeMeasures();
    const masses = p.massMeasures();
    const angles = p.angleMeasures();
    const dates = p.dateTimeValues();

    const pick = (type: PropertyType, i: number): PropertyValue['value'] => {
      switch (type) {
        case PropertyType.LengthMeasure: return lengths[i] ?? null;
        case PropertyType.AreaMeasure: return areas[i] ?? null;
        case PropertyType.VolumeMeasure: return volumes[i] ?? null;
        case PropertyType.MassMeasure: return masses[i] ?? null;
        case PropertyType.AngleMeasure: return angles[i] ?? null;
        case PropertyType.StringValue: return strings[i] ?? null;
        case PropertyType.DoubleValue: return doubles[i] ?? null;
        case PropertyType.DateTime: return dates[i] ?? null;
        // the index is the value; reinterpret the uint32 as int32
        case PropertyType.IntValue: return i & 0x80000000 ? i - 0x100000000 : i;
        // TriState: 0 false, 1 true, 2 unknown
        case PropertyType.Logical: return i === 2 ? null : i === 1;
        case PropertyType.Boolean: return i !== 0;
        default: return null;
      }
    };

    const out = new Map<number, PropertyValue[]>();
    for (let s = 0; s < p.propertySetBindingsLength(); s++) {
      const set = p.propertySetBindings(s);
      const def = p.definitions(set.definition);
      const setName = setNames[def.name] ?? '';
      const defs: { name: string; type: PropertyType }[] = [];
      for (let d = 0; d < def.propertiesLength(); d++) {
        const sp = def.properties(d);
        defs.push({ name: propNames[sp.name] ?? '', type: sp.type });
      }
      const values = set.values();
      const ents = set.entities();
      // resolve once, then share across every entity bound to this set
      const resolved: PropertyValue[] = [];
      for (let d = 0; d < defs.length; d++) {
        const vi = values[d];
        if (vi === undefined) continue;
        resolved.push({ set: setName, name: defs[d]!.name, type: defs[d]!.type, value: pick(defs[d]!.type, vi) });
      }
      for (const entity of ents) {
        let list = out.get(entity);
        if (!list) out.set(entity, (list = []));
        for (const rv of resolved) list.push(rv);
      }
    }
    return out;
  }

  // ---- geometry -------------------------------------------------------

  get layers(): string[] {
    return (this._layers ??= this.geometry.layers());
  }

  get instanceCount(): number {
    return this.geometry.instancesLength();
  }

  instance(i: number): GeometryRef {
    const g = this.geometry;
    const inst = g.instances(i);
    const def = g.definitions(inst.definitionId);
    const bbx = def.boundingBox;
    const entityXf = placementToMatrix(this.entities.entities(inst.entityId).globalPlacement);
    const localXf = placementToMatrix(g.localPlacements(inst.localPlacementId));
    return {
      instanceIndex: i,
      entityIndex: inst.entityId,
      definitionIndex: inst.definitionId,
      geometryType: def.type,
      geometryIndex: def.index,
      layer: this.layers[inst.layerId] ?? '',
      material: this.material(inst.surfaceMaterialId),
      transform: multiply(entityXf, localXf),
      boundingBox: {
        min: [bbx.min.x, bbx.min.y, bbx.min.z],
        max: [bbx.max.x, bbx.max.y, bbx.max.z],
      },
    };
  }

  *allInstances(): Generator<GeometryRef> {
    for (let i = 0; i < this.instanceCount; i++) yield this.instance(i);
  }

  /**
   * How many geometry instances use each GeometryType. Cheap (no decoding),
   * and together with {@link SUPPORTED_GEOMETRY_TYPES} tells a converter up
   * front what fraction of a file it will decode and what it will skip.
   */
  geometryTypeCounts(): Map<GeometryType, number> {
    const g = this.geometry;
    const out = new Map<GeometryType, number>();
    for (let i = 0; i < g.instancesLength(); i++) {
      const t = g.definitions(g.instances(i).definitionId).type;
      out.set(t, (out.get(t) ?? 0) + 1);
    }
    return out;
  }

  material(i: number): MaterialData {
    const m = this.geometry.surfaceMaterials(i);
    return {
      index: i,
      color: { r: m.r, g: m.g, b: m.b, a: m.a },
      textureId: m.textureId,
      sidedness: m.sidedness,
      lineStyle: m.lineStyle,
      metallic: m.metallic,
      roughness: m.roughness,
    };
  }

  /**
   * Decode a triangle mesh into flat arrays.
   *
   * The pools are shared: `vertices` is a list of (positionIndex, normalIndex)
   * pairs, `indices` addresses that list, and UVs are addressed by
   * positionIndex rather than by vertex slot.
   *
   * Returns null when the geometry type is not one of the four mesh types.
   */
  mesh(ref: GeometryRef): MeshData | null {
    const g = this.geometry;
    let m: TriangleMesh | TriangleMesh8 | TexturedTriangleMesh | TexturedTriangleMesh8;
    let textured = false;
    switch (ref.geometryType) {
      case GeometryType.TriangleMesh: m = g.triangleMeshes(ref.geometryIndex); break;
      case GeometryType.TriangleMesh8: m = g.triangleMeshes8(ref.geometryIndex); break;
      case GeometryType.TexturedTriangleMesh:
        m = g.texturedTriangleMeshes(ref.geometryIndex); textured = true; break;
      case GeometryType.TexturedTriangleMesh8:
        m = g.texturedTriangleMeshes8(ref.geometryIndex); textured = true; break;
      default: return null;
    }
    const n = m.verticesLength();
    const positions = new Float32Array(n * 3);
    const normals = new Float32Array(n * 3);
    const uvs = textured ? new Float32Array(n * 2) : null;
    for (let i = 0; i < n; i++) {
      const v = m.vertices(i);
      const pi = v.positionIndex;
      const p = m.positions(pi);
      const nrm = m.normals(v.normalIndex);
      positions[i * 3] = p.x; positions[i * 3 + 1] = p.y; positions[i * 3 + 2] = p.z;
      normals[i * 3] = nrm.x; normals[i * 3 + 1] = nrm.y; normals[i * 3 + 2] = nrm.z;
      if (uvs) {
        const uv = (m as TexturedTriangleMesh).uvs(pi);
        uvs[i * 2] = uv.u; uvs[i * 2 + 1] = uv.v;
      }
    }
    return { positions, normals, uvs, indices: m.indices() };
  }

  /**
   * Decode a boundary representation into triangles.
   *
   * A BRep is a list of planar faces. Each outer wire is a loop of indices into
   * the shared vertex pool; each inner wire is a hole and names the outer wire
   * it belongs to. Faces are triangulated by ear clipping on the face plane.
   *
   * Plain `BRep` stores no normals, so a face normal is computed per face and
   * written to every vertex of that face, which gives flat shading. The
   * `BRepWithNormals` and `BRepWithUV` variants carry per-vertex data and use
   * it directly.
   *
   * Vertices are emitted per face rather than shared, because a shared corner
   * belongs to several faces with different normals.
   *
   * Returns null when the geometry type is not a BRep variant.
   */
  brep(ref: GeometryRef): MeshData | null {
    const g = this.geometry;
    let b: BRep | BRepWithNormal | BRepWithUV;
    let kind: 'plain' | 'normal' | 'uv';
    switch (ref.geometryType) {
      case GeometryType.BRep: b = g.bReps(ref.geometryIndex); kind = 'plain'; break;
      case GeometryType.BRepWithNormals: b = g.bRepWithNormals(ref.geometryIndex); kind = 'normal'; break;
      case GeometryType.BRepWithUV: b = g.bRepWithUvs(ref.geometryIndex); kind = 'uv'; break;
      default: return null;
    }

    const point = (i: number): [number, number, number] => {
      if (kind === 'plain') {
        const v = (b as BRep).vertices(i);
        return [v.x, v.y, v.z];
      }
      if (kind === 'normal') {
        const v = (b as BRepWithNormal).vertices(i).position;
        return [v.x, v.y, v.z];
      }
      const v = (b as BRepWithUV).vertices(i).position;
      return [v.x, v.y, v.z];
    };

    // group holes by the outer wire they belong to
    const holesFor = new Map<number, number[][]>();
    for (let i = 0; i < b.innerWiresLength(); i++) {
      const w = b.innerWires(i);
      const list = holesFor.get(w.outerWire) ?? [];
      list.push(Array.from(w.vertexIndices()));
      holesFor.set(w.outerWire, list);
    }

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] | null = kind === 'uv' ? [] : null;
    const indices: number[] = [];

    for (let f = 0; f < b.outerWiresLength(); f++) {
      const outer = Array.from(b.outerWires(f).vertexIndices());
      if (outer.length < 3) continue;
      const holes = holesFor.get(f) ?? [];
      const tri = triangulateFace(outer, holes, point);
      if (tri.length === 0) continue;

      const fn = kind === 'plain' ? faceNormal(outer, point) : null;
      // remap this face's vertices into a face-local block
      const local = new Map<number, number>();
      for (const vi of tri) {
        if (local.has(vi)) continue;
        const slot = positions.length / 3;
        local.set(vi, slot);
        const p = point(vi);
        positions.push(p[0], p[1], p[2]);
        if (kind === 'normal') {
          const n = (b as BRepWithNormal).vertices(vi).normal;
          normals.push(n.x, n.y, n.z);
        } else if (fn) {
          normals.push(fn[0], fn[1], fn[2]);
        } else {
          const n = faceNormal(outer, point);
          normals.push(n[0], n[1], n[2]);
        }
        if (uvs) {
          const uv = (b as BRepWithUV).vertices(vi).uv;
          uvs.push(uv.u, uv.v);
        }
      }
      for (const vi of tri) indices.push(local.get(vi)!);
    }

    return {
      positions: new Float32Array(positions),
      normals: new Float32Array(normals),
      uvs: uvs ? new Float32Array(uvs) : null,
      indices: positions.length / 3 > 65535
        ? new Uint32Array(indices)
        : new Uint16Array(indices),
    };
  }

  /**
   * Tessellate a swept disk solid (rebar-style tube sweeps) into triangles.
   * Returns null when the geometry type is not SweptDiskSolid.
   */
  sweptDiskSolid(ref: GeometryRef): MeshData | null {
    if (ref.geometryType !== GeometryType.SweptDiskSolid) return null;
    return tessellateSweptDisk(this.geometry.sweptDiskSolids(ref.geometryIndex));
  }

  /** Triangles for any geometry type this reader can decode, else null. */
  triangles(ref: GeometryRef): MeshData | null {
    return this.mesh(ref) ?? this.brep(ref) ?? this.sweptDiskSolid(ref);
  }

  /**
   * Decode an instance's geometry, telling supported and unsupported types
   * apart. This is the primary decode entry point for converters:
   * `triangles()`, `mesh()` and `brep()` are the specific paths and return
   * null both for "wrong type" and "type not decoded yet".
   */
  decode(ref: GeometryRef): DecodedGeometry {
    const m = this.triangles(ref);
    return m ? { kind: 'triangles', ...m } : { kind: 'unsupported', type: ref.geometryType };
  }

  /** Key/value metadata written by the exporter. */
  metadata(): Record<string, string> {
    const out: Record<string, string> = {};
    for (let i = 0; i < this.model.metadataLength(); i++) {
      const e = this.model.metadata(i);
      const k = e.key;
      if (k !== null) out[k] = e.value ?? '';
    }
    return out;
  }
}

export function readHeader(bytes: Uint8Array): TrbHeader {
  if (bytes.byteLength < 10) throw new Error('TrimBIM: file is too small');
  let ident = '';
  for (let i = 4; i < 8; i++) ident += String.fromCharCode(bytes[i]!);
  if (!ident.startsWith('TRB')) {
    throw new Error(`TrimBIM: bad file identifier ${JSON.stringify(ident)}, expected TRB*`);
  }
  const digits = /\d+/.exec(ident);
  return {
    identifier: ident,
    version: digits ? Number(digits[0]) : NaN,
    byteLength: bytes.byteLength,
  };
}

/**
 * Placement3 stores an origin and the x and y axes; z is their cross product.
 * Emitted column-major.
 */
export function placementToMatrix(p: {
  origin: { x: number; y: number; z: number };
  xAxis: { x: number; y: number; z: number };
  yAxis: { x: number; y: number; z: number };
} | null): Matrix4 {
  const m = new Float64Array(16);
  if (!p) { m[0] = m[5] = m[10] = m[15] = 1; return m; }
  const o = p.origin, x = p.xAxis, y = p.yAxis;
  const zx = x.y * y.z - x.z * y.y;
  const zy = x.z * y.x - x.x * y.z;
  const zz = x.x * y.y - x.y * y.x;
  m[0] = nz(x.x); m[1] = nz(x.y); m[2] = nz(x.z); m[3] = 0;
  m[4] = nz(y.x); m[5] = nz(y.y); m[6] = nz(y.z); m[7] = 0;
  m[8] = nz(zx); m[9] = nz(zy); m[10] = nz(zz); m[11] = 0;
  m[12] = nz(o.x); m[13] = nz(o.y); m[14] = nz(o.z); m[15] = 1;
  return m;
}

// normalise NaN and negative zero so matrices compare cleanly
const nz = (v: number) => (Number.isNaN(v) || v === 0 ? 0 : v);

/** Column-major 4x4 multiply, a then b applied as a*b. */
export function multiply(a: Matrix4, b: Matrix4): Matrix4 {
  const o = new Float64Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      o[c * 4 + r] =
        a[r]! * b[c * 4]! +
        a[4 + r]! * b[c * 4 + 1]! +
        a[8 + r]! * b[c * 4 + 2]! +
        a[12 + r]! * b[c * 4 + 3]!;
    }
  }
  return o;
}
