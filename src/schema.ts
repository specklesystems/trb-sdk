// Generated from trimbim.fbs by tools/gen_ts.py. Do not edit by hand.
// Low-level accessors over the TrimBIM FlatBuffers layout.

import { ByteBuffer, Table } from './buffer.js';

export enum AlignmentType {
  Invalid = 0,
  LeftTop = 1,
  LeftCenter = 2,
  LeftBottom = 3,
  CenterTop = 4,
  CenterCenter = 5,
  CenterBottom = 6,
  RightTop = 7,
  RightCenter = 8,
  RightBottom = 9,
  LeftBaseLine = 10,
  CenterBaseLine = 11,
  RightBaseLine = 12,
  LeftBottomBaseLine = 13,
  CenterBottomBaseLine = 14,
  RightBottomBaseLine = 15,
}

export enum BoltType {
  None = 0,
  Normal = 1,
  Round = 2,
  Countersunk = 3,
  Stud = 4,
}

export enum GeometryType {
  None = 0,
  BRep = 1,
  TriangleMesh = 2,
  TriangleMesh8 = 3,
  SweptDiskSolid = 4,
  GraphicsContainer = 5,
  BRepWithUV = 6,
  BRepWithNormals = 7,
  AlignmentCurve = 8,
  GridLineContainer = 9,
  TexturedTriangleMesh = 10,
  TexturedTriangleMesh8 = 11,
  CoordinateGeometryPoint = 12,
  BillboardText = 13,
  Billboard = 14,
  TexturedBillboard = 15,
  Bolt = 16,
}

export enum HierarchyType {
  Unknown = 0,
  SpatialHierarchy = 1,
  SpatialContainment = 2,
  Containment = 3,
  ElementAssembly = 4,
  Group = 5,
  System = 6,
  Zone = 7,
  VoidsElement = 8,
  FillsElement = 9,
  ConnectsPortToElement = 10,
  ConnectsPorts = 11,
  ServicesBuildings = 12,
  Positions = 13,
}

export enum HorizontalSegmentType {
  Invalid = 0,
  LineSegment = 1,
  CircularArcSegment = 2,
  ClothoidalArcSegment = 3,
  TransientCurveSegment = 4,
}

export enum HorizontalTransitionCurveType {
  Invalid = 0,
  BiquadraticParabola = 1,
  BlossCurve = 2,
  ClothoidCurve = 3,
  CosineCurve = 4,
  CubicParabola = 5,
  SineCurve = 6,
}

export enum IdentifierType {
  Guid = 0,
  String = 1,
  SpatialHash = 2,
  DwgHandle = 3,
  None = 4,
}

export enum LayoutType {
  Invalid = 0,
  LeftToRight = 1,
  RightToLeft = 2,
  Vertical = 3,
}

export enum LineStyle {
  Normal = 0,
  Border = 1,
  Center = 2,
  DashDot = 3,
  Dashed = 4,
  Divide = 5,
  Dot = 6,
  Hidden = 7,
  ISO02W100 = 8,
  ISO03W100 = 9,
  ISO04W100 = 10,
  ISO05W100 = 11,
  ISO06W100 = 12,
  ISO07W100 = 13,
  ISO08W100 = 14,
  ISO09W100 = 15,
  ISO10W100 = 16,
  ISO11W100 = 17,
  ISO12W100 = 18,
  ISO13W100 = 19,
  ISO14W100 = 20,
  ISO15W100 = 21,
}

export enum Logical {
  False = 0,
  True = 1,
  Unknown = 2,
}

export enum OwnerHistoryChangeAction {
  NoChange = 0,
  Modified = 1,
  Added = 2,
  Deleted = 3,
}

export enum OwnerHistoryState {
  Undefined = 0,
  ReadWrite = 1,
  ReadOnly = 2,
  Locked = 3,
  ReadWriteLocked = 4,
  ReadOnlyLocked = 5,
}

export enum PropertyType {
  LengthMeasure = 0,
  AreaMeasure = 1,
  VolumeMeasure = 2,
  MassMeasure = 3,
  AngleMeasure = 4,
  StringValue = 5,
  IntValue = 6,
  DoubleValue = 7,
  DateTime = 8,
  Logical = 9,
  Boolean = 10,
}

export enum SegmentType {
  LineSegment = 0,
  PolyLine = 1,
  Arc = 2,
}

export enum Sidedness {
  Single = 0,
  Double = 1,
  FrontFace = 2,
  BackFace = 3,
}

export enum TextureType {
  None = 0,
  Png = 1,
  JPeg = 2,
}

export enum VerticalSegmentType {
  Invalid = 0,
  LineSegment = 1,
  CircularArcSegment = 2,
  ParabolicArcSegment = 3,
}

/** inline struct, 24 bytes */
export class AABB3f {
  constructor(readonly bb: ByteBuffer, readonly pos: number) {}
  static readonly SIZE = 24;
  get min(): Vec3f { return new Vec3f(this.bb, this.pos + 0); }
  get max(): Vec3f { return new Vec3f(this.bb, this.pos + 12); }
}

/** inline struct, 88 bytes */
export class Arc3d {
  constructor(readonly bb: ByteBuffer, readonly pos: number) {}
  static readonly SIZE = 88;
  get center(): Vec3d { return new Vec3d(this.bb, this.pos + 0); }
  get axis(): Vec3d { return new Vec3d(this.bb, this.pos + 24); }
  get refDirection(): Vec3d { return new Vec3d(this.bb, this.pos + 48); }
  get radius(): number { return this.bb.float64(this.pos + 72); }
  get angle(): number { return this.bb.float64(this.pos + 80); }
}

/** inline struct, 44 bytes */
export class Arc3f {
  constructor(readonly bb: ByteBuffer, readonly pos: number) {}
  static readonly SIZE = 44;
  get center(): Vec3f { return new Vec3f(this.bb, this.pos + 0); }
  get axis(): Vec3f { return new Vec3f(this.bb, this.pos + 12); }
  get refDirection(): Vec3f { return new Vec3f(this.bb, this.pos + 24); }
  get radius(): number { return this.bb.float32(this.pos + 36); }
  get angle(): number { return this.bb.float32(this.pos + 40); }
}

/** inline struct, 20 bytes */
export class BoltTop {
  constructor(readonly bb: ByteBuffer, readonly pos: number) {}
  static readonly SIZE = 20;
  get topDiameter(): number { return this.bb.float32(this.pos + 0); }
  get thickness(): number { return this.bb.float32(this.pos + 4); }
  get diameter(): number { return this.bb.float32(this.pos + 8); }
  get length(): number { return this.bb.float32(this.pos + 12); }
  get type(): BoltType { return this.bb.uint8(this.pos + 16) as BoltType; }
}

/** inline struct, 64 bytes */
export class Entity {
  constructor(readonly bb: ByteBuffer, readonly pos: number) {}
  static readonly SIZE = 64;
  get type(): IdentifierType { return this.bb.uint8(this.pos + 0) as IdentifierType; }
  get identifierIndex(): number { return this.bb.uint32(this.pos + 4); }
  get classIndex(): number { return this.bb.uint32(this.pos + 8); }
  get globalPlacement(): Placement3 { return new Placement3(this.bb, this.pos + 16); }
}

/** inline struct, 32 bytes */
export class GeometryDefinition {
  constructor(readonly bb: ByteBuffer, readonly pos: number) {}
  static readonly SIZE = 32;
  get type(): GeometryType { return this.bb.uint8(this.pos + 0) as GeometryType; }
  get index(): number { return this.bb.uint32(this.pos + 4); }
  get boundingBox(): AABB3f { return new AABB3f(this.bb, this.pos + 8); }
}

/** inline struct, 20 bytes */
export class GeometryInstance {
  constructor(readonly bb: ByteBuffer, readonly pos: number) {}
  static readonly SIZE = 20;
  get localPlacementId(): number { return this.bb.uint32(this.pos + 0); }
  get entityId(): number { return this.bb.uint32(this.pos + 4); }
  get definitionId(): number { return this.bb.uint32(this.pos + 8); }
  get surfaceMaterialId(): number { return this.bb.uint32(this.pos + 12); }
  get layerId(): number { return this.bb.uint32(this.pos + 16); }
}

/** inline struct, 16 bytes */
export class Guid {
  constructor(readonly bb: ByteBuffer, readonly pos: number) {}
  static readonly SIZE = 16;
  get data1(): number { return this.bb.uint32(this.pos + 0); }
  get data2(): number { return this.bb.uint16(this.pos + 4); }
  get data3(): number { return this.bb.uint16(this.pos + 6); }
  get data41(): number { return this.bb.uint8(this.pos + 8); }
  get data42(): number { return this.bb.uint8(this.pos + 9); }
  get data43(): number { return this.bb.uint8(this.pos + 10); }
  get data44(): number { return this.bb.uint8(this.pos + 11); }
  get data45(): number { return this.bb.uint8(this.pos + 12); }
  get data46(): number { return this.bb.uint8(this.pos + 13); }
  get data47(): number { return this.bb.uint8(this.pos + 14); }
  get data48(): number { return this.bb.uint8(this.pos + 15); }
}

/** inline struct, 12 bytes */
export class HierarchyNode {
  constructor(readonly bb: ByteBuffer, readonly pos: number) {}
  static readonly SIZE = 12;
  get parentElementId(): number { return this.bb.uint32(this.pos + 0); }
  get childElementId(): number { return this.bb.uint32(this.pos + 4); }
  get type(): HierarchyType { return this.bb.uint8(this.pos + 8) as HierarchyType; }
}

/** inline struct, 24 bytes */
export class History {
  constructor(readonly bb: ByteBuffer, readonly pos: number) {}
  static readonly SIZE = 24;
  get state(): OwnerHistoryState { return this.bb.uint8(this.pos + 0) as OwnerHistoryState; }
  get changeAction(): OwnerHistoryChangeAction { return this.bb.uint8(this.pos + 1) as OwnerHistoryChangeAction; }
  get creationDate(): bigint { return this.bb.int64(this.pos + 8); }
  get lastModificationDate(): bigint { return this.bb.int64(this.pos + 16); }
}

/** inline struct, 20 bytes */
export class Hole {
  constructor(readonly bb: ByteBuffer, readonly pos: number) {}
  static readonly SIZE = 20;
  get offset(): number { return this.bb.float32(this.pos + 0); }
  get length(): number { return this.bb.float32(this.pos + 4); }
  get diameter(): number { return this.bb.float32(this.pos + 8); }
  get xslot(): number { return this.bb.float32(this.pos + 12); }
  get yslot(): number { return this.bb.float32(this.pos + 16); }
}

/** inline struct, 4 bytes */
export class IndexedVertex {
  constructor(readonly bb: ByteBuffer, readonly pos: number) {}
  static readonly SIZE = 4;
  get positionIndex(): number { return this.bb.uint16(this.pos + 0); }
  get normalIndex(): number { return this.bb.uint16(this.pos + 2); }
}

/** inline struct, 2 bytes */
export class IndexedVertex8 {
  constructor(readonly bb: ByteBuffer, readonly pos: number) {}
  static readonly SIZE = 2;
  get positionIndex(): number { return this.bb.uint8(this.pos + 0); }
  get normalIndex(): number { return this.bb.uint8(this.pos + 1); }
}

/** inline struct, 48 bytes */
export class Line3d {
  constructor(readonly bb: ByteBuffer, readonly pos: number) {}
  static readonly SIZE = 48;
  get start(): Vec3d { return new Vec3d(this.bb, this.pos + 0); }
  get end(): Vec3d { return new Vec3d(this.bb, this.pos + 24); }
}

/** inline struct, 24 bytes */
export class Line3f {
  constructor(readonly bb: ByteBuffer, readonly pos: number) {}
  static readonly SIZE = 24;
  get start(): Vec3f { return new Vec3f(this.bb, this.pos + 0); }
  get end(): Vec3f { return new Vec3f(this.bb, this.pos + 12); }
}

/** inline struct, 16 bytes */
export class Nut {
  constructor(readonly bb: ByteBuffer, readonly pos: number) {}
  static readonly SIZE = 16;
  get offset(): number { return this.bb.float32(this.pos + 0); }
  get innerDiameter(): number { return this.bb.float32(this.pos + 4); }
  get outerDiameter(): number { return this.bb.float32(this.pos + 8); }
  get thickness(): number { return this.bb.float32(this.pos + 12); }
}

/** inline struct, 48 bytes */
export class Placement3 {
  constructor(readonly bb: ByteBuffer, readonly pos: number) {}
  static readonly SIZE = 48;
  get origin(): Vec3d { return new Vec3d(this.bb, this.pos + 0); }
  get xAxis(): Vec3f { return new Vec3f(this.bb, this.pos + 24); }
  get yAxis(): Vec3f { return new Vec3f(this.bb, this.pos + 36); }
}

/** inline struct, 24 bytes */
export class PositionNormal {
  constructor(readonly bb: ByteBuffer, readonly pos: number) {}
  static readonly SIZE = 24;
  get position(): Vec3f { return new Vec3f(this.bb, this.pos + 0); }
  get normal(): Vec3f { return new Vec3f(this.bb, this.pos + 12); }
}

/** inline struct, 20 bytes */
export class PositionUV {
  constructor(readonly bb: ByteBuffer, readonly pos: number) {}
  static readonly SIZE = 20;
  get position(): Vec3f { return new Vec3f(this.bb, this.pos + 0); }
  get uv(): UV { return new UV(this.bb, this.pos + 12); }
}

/** inline struct, 20 bytes */
export class Product {
  constructor(readonly bb: ByteBuffer, readonly pos: number) {}
  static readonly SIZE = 20;
  get owner(): number { return this.bb.uint32(this.pos + 0); }
  get history(): number { return this.bb.uint32(this.pos + 4); }
  get name(): number { return this.bb.uint32(this.pos + 8); }
  get description(): number { return this.bb.uint32(this.pos + 12); }
  get objectType(): number { return this.bb.uint32(this.pos + 16); }
}

/** inline struct, 8 bytes */
export class ProductBinding {
  constructor(readonly bb: ByteBuffer, readonly pos: number) {}
  static readonly SIZE = 8;
  get entityId(): number { return this.bb.uint32(this.pos + 0); }
  get productId(): number { return this.bb.uint32(this.pos + 4); }
}

/** inline struct, 8 bytes */
export class SinglePropertyDefinition {
  constructor(readonly bb: ByteBuffer, readonly pos: number) {}
  static readonly SIZE = 8;
  get name(): number { return this.bb.uint32(this.pos + 0); }
  get type(): PropertyType { return this.bb.uint8(this.pos + 4) as PropertyType; }
}

/** inline struct, 88 bytes */
export class SpatialHash {
  constructor(readonly bb: ByteBuffer, readonly pos: number) {}
  static readonly SIZE = 88;
  get x(): number { return this.bb.float64(this.pos + 0); }
  get y(): number { return this.bb.float64(this.pos + 8); }
  get z(): number { return this.bb.float64(this.pos + 16); }
  get d0(): number { return this.bb.float64(this.pos + 24); }
  get d1(): number { return this.bb.float64(this.pos + 32); }
  get d2(): number { return this.bb.float64(this.pos + 40); }
  get d3(): number { return this.bb.float64(this.pos + 48); }
  get d4(): number { return this.bb.float64(this.pos + 56); }
  get d5(): number { return this.bb.float64(this.pos + 64); }
  get d6(): number { return this.bb.float64(this.pos + 72); }
  get d7(): number { return this.bb.float64(this.pos + 80); }
}

/** inline struct, 20 bytes */
export class SurfaceMaterial {
  constructor(readonly bb: ByteBuffer, readonly pos: number) {}
  static readonly SIZE = 20;
  get r(): number { return this.bb.uint8(this.pos + 0); }
  get g(): number { return this.bb.uint8(this.pos + 1); }
  get b(): number { return this.bb.uint8(this.pos + 2); }
  get a(): number { return this.bb.uint8(this.pos + 3); }
  get textureId(): number { return this.bb.uint32(this.pos + 4); }
  get sidedness(): Sidedness { return this.bb.uint8(this.pos + 8) as Sidedness; }
  get lineStyle(): LineStyle { return this.bb.uint8(this.pos + 9) as LineStyle; }
  get metallic(): number { return this.bb.float32(this.pos + 12); }
  get roughness(): number { return this.bb.float32(this.pos + 16); }
}

/** inline struct, 72 bytes */
export class TexturedBillboard {
  constructor(readonly bb: ByteBuffer, readonly pos: number) {}
  static readonly SIZE = 72;
  get leftUpXy(): Vec2d { return new Vec2d(this.bb, this.pos + 0); }
  get leftUpUv(): Vec2d { return new Vec2d(this.bb, this.pos + 16); }
  get rightDownXy(): Vec2d { return new Vec2d(this.bb, this.pos + 32); }
  get rightDownUv(): Vec2d { return new Vec2d(this.bb, this.pos + 48); }
  get isInWorldUnits(): boolean { return this.bb.bool(this.pos + 64); }
}

/** inline struct, 8 bytes */
export class UV {
  constructor(readonly bb: ByteBuffer, readonly pos: number) {}
  static readonly SIZE = 8;
  get u(): number { return this.bb.float32(this.pos + 0); }
  get v(): number { return this.bb.float32(this.pos + 4); }
}

/** inline struct, 16 bytes */
export class Vec2d {
  constructor(readonly bb: ByteBuffer, readonly pos: number) {}
  static readonly SIZE = 16;
  get x(): number { return this.bb.float64(this.pos + 0); }
  get y(): number { return this.bb.float64(this.pos + 8); }
}

/** inline struct, 24 bytes */
export class Vec3d {
  constructor(readonly bb: ByteBuffer, readonly pos: number) {}
  static readonly SIZE = 24;
  get x(): number { return this.bb.float64(this.pos + 0); }
  get y(): number { return this.bb.float64(this.pos + 8); }
  get z(): number { return this.bb.float64(this.pos + 16); }
}

/** inline struct, 12 bytes */
export class Vec3f {
  constructor(readonly bb: ByteBuffer, readonly pos: number) {}
  static readonly SIZE = 12;
  get x(): number { return this.bb.float32(this.pos + 0); }
  get y(): number { return this.bb.float32(this.pos + 4); }
  get z(): number { return this.bb.float32(this.pos + 8); }
}

/** inline struct, 16 bytes */
export class Washer {
  constructor(readonly bb: ByteBuffer, readonly pos: number) {}
  static readonly SIZE = 16;
  get offset(): number { return this.bb.float32(this.pos + 0); }
  get innerDiameter(): number { return this.bb.float32(this.pos + 4); }
  get outerDiameter(): number { return this.bb.float32(this.pos + 8); }
  get thickness(): number { return this.bb.float32(this.pos + 12); }
}

export class AlignmentCurve extends Table {
  get horizontalCurve(): HorizontalCurve | null { const o = this.off(4); return o ? new HorizontalCurve(this.bb, this.bb.indirect(this.pos + o)) : null; }
  get verticalCurve(): VerticalCurve | null { const o = this.off(6); return o ? new VerticalCurve(this.bb, this.bb.indirect(this.pos + o)) : null; }
  get name(): string | null { const o = this.off(8); return o ? this.bb.string(this.pos + o) : null; }
}

export class BRep extends Table {
  outerWiresLength(): number { return this.offsetVector(4).length; }
  outerWires(i: number): OuterWire { const v = this.offsetVector(4); return new OuterWire(this.bb, this.bb.indirect(v.at(i))); }
  innerWiresLength(): number { return this.offsetVector(6).length; }
  innerWires(i: number): InnerWire { const v = this.offsetVector(6); return new InnerWire(this.bb, this.bb.indirect(v.at(i))); }
  verticesLength(): number { return this.structVector(8, Vec3f.SIZE).length; }
  vertices(i: number): Vec3f { const v = this.structVector(8, Vec3f.SIZE); return new Vec3f(this.bb, v.at(i)); }
}

export class BRepWithNormal extends Table {
  outerWiresLength(): number { return this.offsetVector(4).length; }
  outerWires(i: number): OuterWire { const v = this.offsetVector(4); return new OuterWire(this.bb, this.bb.indirect(v.at(i))); }
  innerWiresLength(): number { return this.offsetVector(6).length; }
  innerWires(i: number): InnerWire { const v = this.offsetVector(6); return new InnerWire(this.bb, this.bb.indirect(v.at(i))); }
  verticesLength(): number { return this.structVector(8, PositionNormal.SIZE).length; }
  vertices(i: number): PositionNormal { const v = this.structVector(8, PositionNormal.SIZE); return new PositionNormal(this.bb, v.at(i)); }
}

export class BRepWithUV extends Table {
  outerWiresLength(): number { return this.offsetVector(4).length; }
  outerWires(i: number): OuterWire { const v = this.offsetVector(4); return new OuterWire(this.bb, this.bb.indirect(v.at(i))); }
  innerWiresLength(): number { return this.offsetVector(6).length; }
  innerWires(i: number): InnerWire { const v = this.offsetVector(6); return new InnerWire(this.bb, this.bb.indirect(v.at(i))); }
  verticesLength(): number { return this.structVector(8, PositionUV.SIZE).length; }
  vertices(i: number): PositionUV { const v = this.structVector(8, PositionUV.SIZE); return new PositionUV(this.bb, v.at(i)); }
}

export class Billboard extends Table {
}

export class BillboardText extends Table {
  get textStyleId(): number { const o = this.off(4); return o ? this.bb.uint32(this.pos + o) : 0; }
  get text(): string | null { const o = this.off(6); return o ? this.bb.string(this.pos + o) : null; }
}

export class Bolt extends Table {
  get top(): BoltTop | null { const o = this.off(4); return o ? new BoltTop(this.bb, this.pos + o) : null; }
  washersLength(): number { return this.structVector(6, Washer.SIZE).length; }
  washers(i: number): Washer { const v = this.structVector(6, Washer.SIZE); return new Washer(this.bb, v.at(i)); }
  nutsLength(): number { return this.structVector(8, Nut.SIZE).length; }
  nuts(i: number): Nut { const v = this.structVector(8, Nut.SIZE); return new Nut(this.bb, v.at(i)); }
  holesLength(): number { return this.structVector(10, Hole.SIZE).length; }
  holes(i: number): Hole { const v = this.structVector(10, Hole.SIZE); return new Hole(this.bb, v.at(i)); }
}

export class CoordinateGeometryPoint extends Table {
  get name(): string | null { const o = this.off(4); return o ? this.bb.string(this.pos + o) : null; }
  get symbol(): string | null { const o = this.off(6); return o ? this.bb.string(this.pos + o) : null; }
}

export class Directrix extends Table {
  types(): SegmentType[] { const v = this.scalarVectorInfo(4); if (!v) return []; const out: SegmentType[] = []; for (let i = 0; i < v.length; i++) out.push(this.bb.uint8(v.base + i) as SegmentType); return out; }
  indexes(): Uint32Array { const v = this.scalarVectorInfo(6); if (!v) return new Uint32Array(0); return copyUint32Array(this.bb, v.base, v.length); }
  lineSegmentsLength(): number { return this.structVector(8, Line3f.SIZE).length; }
  lineSegments(i: number): Line3f { const v = this.structVector(8, Line3f.SIZE); return new Line3f(this.bb, v.at(i)); }
  polyLinesLength(): number { return this.offsetVector(10).length; }
  polyLines(i: number): Polyline3f { const v = this.offsetVector(10); return new Polyline3f(this.bb, this.bb.indirect(v.at(i))); }
  arcsLength(): number { return this.structVector(12, Arc3f.SIZE).length; }
  arcs(i: number): Arc3f { const v = this.structVector(12, Arc3f.SIZE); return new Arc3f(this.bb, v.at(i)); }
}

export class GraphicsContainer extends Table {
  lineSegmentsLength(): number { return this.structVector(4, Line3f.SIZE).length; }
  lineSegments(i: number): Line3f { const v = this.structVector(4, Line3f.SIZE); return new Line3f(this.bb, v.at(i)); }
  arcsLength(): number { return this.structVector(6, Arc3f.SIZE).length; }
  arcs(i: number): Arc3f { const v = this.structVector(6, Arc3f.SIZE); return new Arc3f(this.bb, v.at(i)); }
}

export class GridArc extends Table {
  get axisTag(): string | null { const o = this.off(4); return o ? this.bb.string(this.pos + o) : null; }
  get arc(): Arc3d | null { const o = this.off(6); return o ? new Arc3d(this.bb, this.pos + o) : null; }
}

export class GridLineContainer extends Table {
  gridLineSegmentsLength(): number { return this.offsetVector(4).length; }
  gridLineSegments(i: number): GridLineSegment { const v = this.offsetVector(4); return new GridLineSegment(this.bb, this.bb.indirect(v.at(i))); }
  gridArcsLength(): number { return this.offsetVector(6).length; }
  gridArcs(i: number): GridArc { const v = this.offsetVector(6); return new GridArc(this.bb, this.bb.indirect(v.at(i))); }
}

export class GridLineSegment extends Table {
  get axisTag(): string | null { const o = this.off(4); return o ? this.bb.string(this.pos + o) : null; }
  get lineSegment(): Line3d | null { const o = this.off(6); return o ? new Line3d(this.bb, this.pos + o) : null; }
}

export class HorizontalCircularArcSegment extends Table {
  get startTag(): string | null { const o = this.off(4); return o ? this.bb.string(this.pos + o) : null; }
  get endTag(): string | null { const o = this.off(6); return o ? this.bb.string(this.pos + o) : null; }
  get startPoint(): Vec2d | null { const o = this.off(8); return o ? new Vec2d(this.bb, this.pos + o) : null; }
  get startDirection(): number { const o = this.off(10); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get segmentLength(): number { const o = this.off(12); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get radius(): number { const o = this.off(14); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get isCcw(): boolean { const o = this.off(16); return o ? this.bb.bool(this.pos + o) : false; }
}

export class HorizontalClothoidalArcSegment extends Table {
  get startTag(): string | null { const o = this.off(4); return o ? this.bb.string(this.pos + o) : null; }
  get endTag(): string | null { const o = this.off(6); return o ? this.bb.string(this.pos + o) : null; }
  get startPoint(): Vec2d | null { const o = this.off(8); return o ? new Vec2d(this.bb, this.pos + o) : null; }
  get startDirection(): number { const o = this.off(10); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get segmentLength(): number { const o = this.off(12); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get startRadius(): number { const o = this.off(14); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get clothoidConstant(): number { const o = this.off(16); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get isCcw(): boolean { const o = this.off(18); return o ? this.bb.bool(this.pos + o) : false; }
  get isEntry(): boolean { const o = this.off(20); return o ? this.bb.bool(this.pos + o) : false; }
}

export class HorizontalCurve extends Table {
  get startAlongDistance(): number { const o = this.off(4); return o ? this.bb.float64(this.pos + o) : 0.0; }
  segmentTypes(): HorizontalSegmentType[] { const v = this.scalarVectorInfo(6); if (!v) return []; const out: HorizontalSegmentType[] = []; for (let i = 0; i < v.length; i++) out.push(this.bb.uint8(v.base + i) as HorizontalSegmentType); return out; }
  lineSegmentsLength(): number { return this.offsetVector(8).length; }
  lineSegments(i: number): HorizontalLineSegment { const v = this.offsetVector(8); return new HorizontalLineSegment(this.bb, this.bb.indirect(v.at(i))); }
  circularArcSegmentsLength(): number { return this.offsetVector(10).length; }
  circularArcSegments(i: number): HorizontalCircularArcSegment { const v = this.offsetVector(10); return new HorizontalCircularArcSegment(this.bb, this.bb.indirect(v.at(i))); }
  clothoidalArcSegmentsLength(): number { return this.offsetVector(12).length; }
  clothoidalArcSegments(i: number): HorizontalClothoidalArcSegment { const v = this.offsetVector(12); return new HorizontalClothoidalArcSegment(this.bb, this.bb.indirect(v.at(i))); }
  transitionArcSegmentsLength(): number { return this.offsetVector(14).length; }
  transitionArcSegments(i: number): HorizontalTransitionArcSegment { const v = this.offsetVector(14); return new HorizontalTransitionArcSegment(this.bb, this.bb.indirect(v.at(i))); }
}

export class HorizontalLineSegment extends Table {
  get startTag(): string | null { const o = this.off(4); return o ? this.bb.string(this.pos + o) : null; }
  get endTag(): string | null { const o = this.off(6); return o ? this.bb.string(this.pos + o) : null; }
  get startPoint(): Vec2d | null { const o = this.off(8); return o ? new Vec2d(this.bb, this.pos + o) : null; }
  get startDirection(): number { const o = this.off(10); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get segmentLength(): number { const o = this.off(12); return o ? this.bb.float64(this.pos + o) : 0.0; }
}

export class HorizontalTransitionArcSegment extends Table {
  get startTag(): string | null { const o = this.off(4); return o ? this.bb.string(this.pos + o) : null; }
  get endTag(): string | null { const o = this.off(6); return o ? this.bb.string(this.pos + o) : null; }
  get startPoint(): Vec2d | null { const o = this.off(8); return o ? new Vec2d(this.bb, this.pos + o) : null; }
  get startDirection(): number { const o = this.off(10); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get segmentLength(): number { const o = this.off(12); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get startRadius(): number { const o = this.off(14); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get endRadius(): number { const o = this.off(16); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get isStartRadiusCcw(): boolean { const o = this.off(18); return o ? this.bb.bool(this.pos + o) : false; }
  get isEndRadiusCcw(): boolean { const o = this.off(20); return o ? this.bb.bool(this.pos + o) : false; }
  get type(): HorizontalTransitionCurveType { const o = this.off(22); return o ? this.bb.uint8(this.pos + o) as HorizontalTransitionCurveType : HorizontalTransitionCurveType.Invalid as HorizontalTransitionCurveType; }
}

export class InnerWire extends Table {
  get outerWire(): number { const o = this.off(4); return o ? this.bb.uint16(this.pos + o) : 0; }
  vertexIndices(): Uint16Array { const v = this.scalarVectorInfo(6); if (!v) return new Uint16Array(0); return copyUint16Array(this.bb, v.base, v.length); }
}

export class MapConversion extends Table {
  get eastings(): number { const o = this.off(4); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get northings(): number { const o = this.off(6); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get orthogonalHeight(): number { const o = this.off(8); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get xAxisAbscissa(): number { const o = this.off(10); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get xAxisOrdinate(): number { const o = this.off(12); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get scaleToMapProjection(): number { const o = this.off(14); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get projectionName(): string | null { const o = this.off(16); return o ? this.bb.string(this.pos + o) : null; }
  get projectionDescription(): string | null { const o = this.off(18); return o ? this.bb.string(this.pos + o) : null; }
  get projectionGeodeticDatum(): string | null { const o = this.off(20); return o ? this.bb.string(this.pos + o) : null; }
  get projectionVerticalDatum(): string | null { const o = this.off(22); return o ? this.bb.string(this.pos + o) : null; }
  get projectionProjectionType(): string | null { const o = this.off(24); return o ? this.bb.string(this.pos + o) : null; }
  get projectionZone(): string | null { const o = this.off(26); return o ? this.bb.string(this.pos + o) : null; }
  get projectionUnitName(): string | null { const o = this.off(28); return o ? this.bb.string(this.pos + o) : null; }
  get projectionScaleToMetric(): number { const o = this.off(30); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get sourceOrigin(): Vec3d | null { const o = this.off(32); return o ? new Vec3d(this.bb, this.pos + o) : null; }
}

export class MetadataEntry extends Table {
  get key(): string | null { const o = this.off(4); return o ? this.bb.string(this.pos + o) : null; }
  get value(): string | null { const o = this.off(6); return o ? this.bb.string(this.pos + o) : null; }
}

export class Model extends Table {
  static readonly FILE_IDENTIFIER = 'TRB8';
  static root(bb: ByteBuffer): Model { return new Model(bb, bb.rootPosition()); }
  get entities(): ModelEntities | null { const o = this.off(4); return o ? new ModelEntities(this.bb, this.bb.indirect(this.pos + o)) : null; }
  get properties(): ModelProperties | null { const o = this.off(6); return o ? new ModelProperties(this.bb, this.bb.indirect(this.pos + o)) : null; }
  get geometry(): ModelGeometry | null { const o = this.off(8); return o ? new ModelGeometry(this.bb, this.bb.indirect(this.pos + o)) : null; }
  mapConversionsLength(): number { return this.offsetVector(10).length; }
  mapConversions(i: number): MapConversion { const v = this.offsetVector(10); return new MapConversion(this.bb, this.bb.indirect(v.at(i))); }
  metadataLength(): number { return this.offsetVector(12).length; }
  metadata(i: number): MetadataEntry { const v = this.offsetVector(12); return new MetadataEntry(this.bb, this.bb.indirect(v.at(i))); }
  xrefsLength(): number { return this.offsetVector(14).length; }
  xrefs(i: number): XRef { const v = this.offsetVector(14); return new XRef(this.bb, this.bb.indirect(v.at(i))); }
}

export class ModelEntities extends Table {
  entitiesLength(): number { return this.structVector(4, Entity.SIZE).length; }
  entities(i: number): Entity { const v = this.structVector(4, Entity.SIZE); return new Entity(this.bb, v.at(i)); }
  hierarchiesLength(): number { return this.structVector(6, HierarchyNode.SIZE).length; }
  hierarchies(i: number): HierarchyNode { const v = this.structVector(6, HierarchyNode.SIZE); return new HierarchyNode(this.bb, v.at(i)); }
  guidIdentifiersLength(): number { return this.structVector(8, Guid.SIZE).length; }
  guidIdentifiers(i: number): Guid { const v = this.structVector(8, Guid.SIZE); return new Guid(this.bb, v.at(i)); }
  stringIdentifiers(): string[] { return this.stringVector(10); }
  spatialHashIdentifiersLength(): number { return this.structVector(12, SpatialHash.SIZE).length; }
  spatialHashIdentifiers(i: number): SpatialHash { const v = this.structVector(12, SpatialHash.SIZE); return new SpatialHash(this.bb, v.at(i)); }
  dwgHandleIdentifiers(): bigint[] { const v = this.scalarVectorInfo(14); if (!v) return []; const out: bigint[] = []; for (let i = 0; i < v.length; i++) out.push(this.bb.int64(v.base + i * 8)); return out; }
  entityClasses(): string[] { return this.stringVector(16); }
}

export class ModelGeometry extends Table {
  localPlacementsLength(): number { return this.structVector(4, Placement3.SIZE).length; }
  localPlacements(i: number): Placement3 { const v = this.structVector(4, Placement3.SIZE); return new Placement3(this.bb, v.at(i)); }
  surfaceMaterialsLength(): number { return this.structVector(6, SurfaceMaterial.SIZE).length; }
  surfaceMaterials(i: number): SurfaceMaterial { const v = this.structVector(6, SurfaceMaterial.SIZE); return new SurfaceMaterial(this.bb, v.at(i)); }
  layers(): string[] { return this.stringVector(8); }
  definitionsLength(): number { return this.structVector(10, GeometryDefinition.SIZE).length; }
  definitions(i: number): GeometryDefinition { const v = this.structVector(10, GeometryDefinition.SIZE); return new GeometryDefinition(this.bb, v.at(i)); }
  instancesLength(): number { return this.structVector(12, GeometryInstance.SIZE).length; }
  instances(i: number): GeometryInstance { const v = this.structVector(12, GeometryInstance.SIZE); return new GeometryInstance(this.bb, v.at(i)); }
  texturesLength(): number { return this.offsetVector(14).length; }
  textures(i: number): Texture { const v = this.offsetVector(14); return new Texture(this.bb, this.bb.indirect(v.at(i))); }
  bRepsLength(): number { return this.offsetVector(16).length; }
  bReps(i: number): BRep { const v = this.offsetVector(16); return new BRep(this.bb, this.bb.indirect(v.at(i))); }
  triangleMeshesLength(): number { return this.offsetVector(18).length; }
  triangleMeshes(i: number): TriangleMesh { const v = this.offsetVector(18); return new TriangleMesh(this.bb, this.bb.indirect(v.at(i))); }
  triangleMeshes8Length(): number { return this.offsetVector(20).length; }
  triangleMeshes8(i: number): TriangleMesh8 { const v = this.offsetVector(20); return new TriangleMesh8(this.bb, this.bb.indirect(v.at(i))); }
  texturedTriangleMeshesLength(): number { return this.offsetVector(22).length; }
  texturedTriangleMeshes(i: number): TexturedTriangleMesh { const v = this.offsetVector(22); return new TexturedTriangleMesh(this.bb, this.bb.indirect(v.at(i))); }
  texturedTriangleMeshes8Length(): number { return this.offsetVector(24).length; }
  texturedTriangleMeshes8(i: number): TexturedTriangleMesh8 { const v = this.offsetVector(24); return new TexturedTriangleMesh8(this.bb, this.bb.indirect(v.at(i))); }
  sweptDiskSolidsLength(): number { return this.offsetVector(26).length; }
  sweptDiskSolids(i: number): SweptDiskSolidContainer { const v = this.offsetVector(26); return new SweptDiskSolidContainer(this.bb, this.bb.indirect(v.at(i))); }
  bRepWithUvsLength(): number { return this.offsetVector(28).length; }
  bRepWithUvs(i: number): BRepWithUV { const v = this.offsetVector(28); return new BRepWithUV(this.bb, this.bb.indirect(v.at(i))); }
  bRepWithNormalsLength(): number { return this.offsetVector(30).length; }
  bRepWithNormals(i: number): BRepWithNormal { const v = this.offsetVector(30); return new BRepWithNormal(this.bb, this.bb.indirect(v.at(i))); }
  graphicsContainersLength(): number { return this.offsetVector(32).length; }
  graphicsContainers(i: number): GraphicsContainer { const v = this.offsetVector(32); return new GraphicsContainer(this.bb, this.bb.indirect(v.at(i))); }
  alignmentCurvesLength(): number { return this.offsetVector(34).length; }
  alignmentCurves(i: number): AlignmentCurve { const v = this.offsetVector(34); return new AlignmentCurve(this.bb, this.bb.indirect(v.at(i))); }
  gridLineContainersLength(): number { return this.offsetVector(36).length; }
  gridLineContainers(i: number): GridLineContainer { const v = this.offsetVector(36); return new GridLineContainer(this.bb, this.bb.indirect(v.at(i))); }
  coordinateGeometryPointsLength(): number { return this.offsetVector(38).length; }
  coordinateGeometryPoints(i: number): CoordinateGeometryPoint { const v = this.offsetVector(38); return new CoordinateGeometryPoint(this.bb, this.bb.indirect(v.at(i))); }
  billboardTextsLength(): number { return this.offsetVector(40).length; }
  billboardTexts(i: number): BillboardText { const v = this.offsetVector(40); return new BillboardText(this.bb, this.bb.indirect(v.at(i))); }
  textStylesLength(): number { return this.offsetVector(42).length; }
  textStyles(i: number): TextStyle { const v = this.offsetVector(42); return new TextStyle(this.bb, this.bb.indirect(v.at(i))); }
  billboardsLength(): number { return this.offsetVector(44).length; }
  billboards(i: number): Billboard { const v = this.offsetVector(44); return new Billboard(this.bb, this.bb.indirect(v.at(i))); }
  texturedBillboardsLength(): number { return this.structVector(46, TexturedBillboard.SIZE).length; }
  texturedBillboards(i: number): TexturedBillboard { const v = this.structVector(46, TexturedBillboard.SIZE); return new TexturedBillboard(this.bb, v.at(i)); }
  boltsLength(): number { return this.offsetVector(48).length; }
  bolts(i: number): Bolt { const v = this.offsetVector(48); return new Bolt(this.bb, this.bb.indirect(v.at(i))); }
  layerDefaultVisibility(): boolean[] { const v = this.scalarVectorInfo(50); if (!v) return []; const out: boolean[] = []; for (let i = 0; i < v.length; i++) out.push(this.bb.bool(v.base + i * 1)); return out; }
}

export class ModelProperties extends Table {
  productBindingsLength(): number { return this.structVector(4, ProductBinding.SIZE).length; }
  productBindings(i: number): ProductBinding { const v = this.structVector(4, ProductBinding.SIZE); return new ProductBinding(this.bb, v.at(i)); }
  productsLength(): number { return this.structVector(6, Product.SIZE).length; }
  products(i: number): Product { const v = this.structVector(6, Product.SIZE); return new Product(this.bb, v.at(i)); }
  ownersLength(): number { return this.offsetVector(8).length; }
  owners(i: number): Owner { const v = this.offsetVector(8); return new Owner(this.bb, this.bb.indirect(v.at(i))); }
  historiesLength(): number { return this.structVector(10, History.SIZE).length; }
  histories(i: number): History { const v = this.structVector(10, History.SIZE); return new History(this.bb, v.at(i)); }
  names(): string[] { return this.stringVector(12); }
  descriptions(): string[] { return this.stringVector(14); }
  objectTypes(): string[] { return this.stringVector(16); }
  propertySetBindingsLength(): number { return this.offsetVector(18).length; }
  propertySetBindings(i: number): PropertySet { const v = this.offsetVector(18); return new PropertySet(this.bb, this.bb.indirect(v.at(i))); }
  propertySetNames(): string[] { return this.stringVector(20); }
  propertyNames(): string[] { return this.stringVector(22); }
  definitionsLength(): number { return this.offsetVector(24).length; }
  definitions(i: number): PropertySetDefinition { const v = this.offsetVector(24); return new PropertySetDefinition(this.bb, this.bb.indirect(v.at(i))); }
  lengthMeasures(): Float64Array { const v = this.scalarVectorInfo(26); if (!v) return new Float64Array(0); return copyFloat64Array(this.bb, v.base, v.length); }
  areaMeasures(): Float64Array { const v = this.scalarVectorInfo(28); if (!v) return new Float64Array(0); return copyFloat64Array(this.bb, v.base, v.length); }
  volumeMeasures(): Float64Array { const v = this.scalarVectorInfo(30); if (!v) return new Float64Array(0); return copyFloat64Array(this.bb, v.base, v.length); }
  massMeasures(): Float64Array { const v = this.scalarVectorInfo(32); if (!v) return new Float64Array(0); return copyFloat64Array(this.bb, v.base, v.length); }
  angleMeasures(): Float64Array { const v = this.scalarVectorInfo(34); if (!v) return new Float64Array(0); return copyFloat64Array(this.bb, v.base, v.length); }
  stringValues(): string[] { return this.stringVector(36); }
  doubleValues(): Float64Array { const v = this.scalarVectorInfo(38); if (!v) return new Float64Array(0); return copyFloat64Array(this.bb, v.base, v.length); }
  dateTimeValues(): bigint[] { const v = this.scalarVectorInfo(40); if (!v) return []; const out: bigint[] = []; for (let i = 0; i < v.length; i++) out.push(this.bb.int64(v.base + i * 8)); return out; }
}

export class OuterWire extends Table {
  vertexIndices(): Uint16Array { const v = this.scalarVectorInfo(4); if (!v) return new Uint16Array(0); return copyUint16Array(this.bb, v.base, v.length); }
}

export class Owner extends Table {
  get personId(): string | null { const o = this.off(4); return o ? this.bb.string(this.pos + o) : null; }
  get personFamilyName(): string | null { const o = this.off(6); return o ? this.bb.string(this.pos + o) : null; }
  get personGivenName(): string | null { const o = this.off(8); return o ? this.bb.string(this.pos + o) : null; }
  get personMiddleNames(): string | null { const o = this.off(10); return o ? this.bb.string(this.pos + o) : null; }
  get personRoles(): string | null { const o = this.off(12); return o ? this.bb.string(this.pos + o) : null; }
  get organizationId(): string | null { const o = this.off(14); return o ? this.bb.string(this.pos + o) : null; }
  get organizationName(): string | null { const o = this.off(16); return o ? this.bb.string(this.pos + o) : null; }
  get organizationDescription(): string | null { const o = this.off(18); return o ? this.bb.string(this.pos + o) : null; }
  get organizationRoles(): string | null { const o = this.off(20); return o ? this.bb.string(this.pos + o) : null; }
  get applicationVersion(): string | null { const o = this.off(22); return o ? this.bb.string(this.pos + o) : null; }
  get applicationFullName(): string | null { const o = this.off(24); return o ? this.bb.string(this.pos + o) : null; }
  get applicationIdentifier(): string | null { const o = this.off(26); return o ? this.bb.string(this.pos + o) : null; }
}

export class Polyline3f extends Table {
  pointsLength(): number { return this.structVector(4, Vec3f.SIZE).length; }
  points(i: number): Vec3f { const v = this.structVector(4, Vec3f.SIZE); return new Vec3f(this.bb, v.at(i)); }
}

export class PropertySet extends Table {
  get definition(): number { const o = this.off(4); return o ? this.bb.uint32(this.pos + o) : 0; }
  values(): Uint32Array { const v = this.scalarVectorInfo(6); if (!v) return new Uint32Array(0); return copyUint32Array(this.bb, v.base, v.length); }
  entities(): Uint32Array { const v = this.scalarVectorInfo(8); if (!v) return new Uint32Array(0); return copyUint32Array(this.bb, v.base, v.length); }
}

export class PropertySetDefinition extends Table {
  get name(): number { const o = this.off(4); return o ? this.bb.uint32(this.pos + o) : 0; }
  propertiesLength(): number { return this.structVector(6, SinglePropertyDefinition.SIZE).length; }
  properties(i: number): SinglePropertyDefinition { const v = this.structVector(6, SinglePropertyDefinition.SIZE); return new SinglePropertyDefinition(this.bb, v.at(i)); }
}

export class SweptDiskSolidContainer extends Table {
  directricesLength(): number { return this.offsetVector(4).length; }
  directrices(i: number): Directrix { const v = this.offsetVector(4); return new Directrix(this.bb, this.bb.indirect(v.at(i))); }
  radius(): Float64Array { const v = this.scalarVectorInfo(6); if (!v) return new Float64Array(0); return copyFloat64Array(this.bb, v.base, v.length); }
}

export class TextStyle extends Table {
  get font(): string | null { const o = this.off(4); return o ? this.bb.string(this.pos + o) : null; }
  get size(): number { const o = this.off(6); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get options(): number { const o = this.off(8); return o ? this.bb.uint32(this.pos + o) : 0; }
  get verticalAlign(): number { const o = this.off(10); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get horizontalAlign(): number { const o = this.off(12); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get rotationAngle(): number { const o = this.off(14); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get layout(): LayoutType { const o = this.off(16); return o ? this.bb.uint8(this.pos + o) as LayoutType : LayoutType.Invalid as LayoutType; }
  get alignment(): AlignmentType { const o = this.off(18); return o ? this.bb.uint8(this.pos + o) as AlignmentType : AlignmentType.Invalid as AlignmentType; }
  get maxAutoScale(): number { const o = this.off(20); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get verticalDistanceToObject(): number { const o = this.off(22); return o ? this.bb.float64(this.pos + o) : 0.0; }
}

export class Texture extends Table {
  get type(): TextureType { const o = this.off(4); return o ? this.bb.uint8(this.pos + o) as TextureType : TextureType.None as TextureType; }
  bytes(): Int8Array { const v = this.scalarVectorInfo(6); if (!v) return new Int8Array(0); return copyInt8Array(this.bb, v.base, v.length); }
}

export class TexturedTriangleMesh extends Table {
  positionsLength(): number { return this.structVector(4, Vec3f.SIZE).length; }
  positions(i: number): Vec3f { const v = this.structVector(4, Vec3f.SIZE); return new Vec3f(this.bb, v.at(i)); }
  normalsLength(): number { return this.structVector(6, Vec3f.SIZE).length; }
  normals(i: number): Vec3f { const v = this.structVector(6, Vec3f.SIZE); return new Vec3f(this.bb, v.at(i)); }
  uvsLength(): number { return this.structVector(8, UV.SIZE).length; }
  uvs(i: number): UV { const v = this.structVector(8, UV.SIZE); return new UV(this.bb, v.at(i)); }
  verticesLength(): number { return this.structVector(10, IndexedVertex.SIZE).length; }
  vertices(i: number): IndexedVertex { const v = this.structVector(10, IndexedVertex.SIZE); return new IndexedVertex(this.bb, v.at(i)); }
  indices(): Uint16Array { const v = this.scalarVectorInfo(12); if (!v) return new Uint16Array(0); return copyUint16Array(this.bb, v.base, v.length); }
}

export class TexturedTriangleMesh8 extends Table {
  positionsLength(): number { return this.structVector(4, Vec3f.SIZE).length; }
  positions(i: number): Vec3f { const v = this.structVector(4, Vec3f.SIZE); return new Vec3f(this.bb, v.at(i)); }
  normalsLength(): number { return this.structVector(6, Vec3f.SIZE).length; }
  normals(i: number): Vec3f { const v = this.structVector(6, Vec3f.SIZE); return new Vec3f(this.bb, v.at(i)); }
  uvsLength(): number { return this.structVector(8, UV.SIZE).length; }
  uvs(i: number): UV { const v = this.structVector(8, UV.SIZE); return new UV(this.bb, v.at(i)); }
  verticesLength(): number { return this.structVector(10, IndexedVertex8.SIZE).length; }
  vertices(i: number): IndexedVertex8 { const v = this.structVector(10, IndexedVertex8.SIZE); return new IndexedVertex8(this.bb, v.at(i)); }
  indices(): Uint8Array { const v = this.scalarVectorInfo(12); if (!v) return new Uint8Array(0); return copyUint8Array(this.bb, v.base, v.length); }
}

export class TriangleMesh extends Table {
  positionsLength(): number { return this.structVector(4, Vec3f.SIZE).length; }
  positions(i: number): Vec3f { const v = this.structVector(4, Vec3f.SIZE); return new Vec3f(this.bb, v.at(i)); }
  normalsLength(): number { return this.structVector(6, Vec3f.SIZE).length; }
  normals(i: number): Vec3f { const v = this.structVector(6, Vec3f.SIZE); return new Vec3f(this.bb, v.at(i)); }
  verticesLength(): number { return this.structVector(8, IndexedVertex.SIZE).length; }
  vertices(i: number): IndexedVertex { const v = this.structVector(8, IndexedVertex.SIZE); return new IndexedVertex(this.bb, v.at(i)); }
  indices(): Uint16Array { const v = this.scalarVectorInfo(10); if (!v) return new Uint16Array(0); return copyUint16Array(this.bb, v.base, v.length); }
}

export class TriangleMesh8 extends Table {
  positionsLength(): number { return this.structVector(4, Vec3f.SIZE).length; }
  positions(i: number): Vec3f { const v = this.structVector(4, Vec3f.SIZE); return new Vec3f(this.bb, v.at(i)); }
  normalsLength(): number { return this.structVector(6, Vec3f.SIZE).length; }
  normals(i: number): Vec3f { const v = this.structVector(6, Vec3f.SIZE); return new Vec3f(this.bb, v.at(i)); }
  verticesLength(): number { return this.structVector(8, IndexedVertex8.SIZE).length; }
  vertices(i: number): IndexedVertex8 { const v = this.structVector(8, IndexedVertex8.SIZE); return new IndexedVertex8(this.bb, v.at(i)); }
  indices(): Uint8Array { const v = this.scalarVectorInfo(10); if (!v) return new Uint8Array(0); return copyUint8Array(this.bb, v.base, v.length); }
}

export class VerticalCircularArcSegment extends Table {
  get startTag(): string | null { const o = this.off(4); return o ? this.bb.string(this.pos + o) : null; }
  get endTag(): string | null { const o = this.off(6); return o ? this.bb.string(this.pos + o) : null; }
  get startDistAlong(): number { const o = this.off(8); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get horizontalLength(): number { const o = this.off(10); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get startHeight(): number { const o = this.off(12); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get startGradient(): number { const o = this.off(14); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get radius(): number { const o = this.off(16); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get isConvex(): boolean { const o = this.off(18); return o ? this.bb.bool(this.pos + o) : false; }
}

export class VerticalCurve extends Table {
  segmentTypes(): VerticalSegmentType[] { const v = this.scalarVectorInfo(4); if (!v) return []; const out: VerticalSegmentType[] = []; for (let i = 0; i < v.length; i++) out.push(this.bb.uint8(v.base + i) as VerticalSegmentType); return out; }
  lineSegmentsLength(): number { return this.offsetVector(6).length; }
  lineSegments(i: number): VerticalLineSegment { const v = this.offsetVector(6); return new VerticalLineSegment(this.bb, this.bb.indirect(v.at(i))); }
  circularArcSegmentsLength(): number { return this.offsetVector(8).length; }
  circularArcSegments(i: number): VerticalCircularArcSegment { const v = this.offsetVector(8); return new VerticalCircularArcSegment(this.bb, this.bb.indirect(v.at(i))); }
  parabolicArcSegmentsLength(): number { return this.offsetVector(10).length; }
  parabolicArcSegments(i: number): VerticalParabolicArcSegment { const v = this.offsetVector(10); return new VerticalParabolicArcSegment(this.bb, this.bb.indirect(v.at(i))); }
}

export class VerticalLineSegment extends Table {
  get startTag(): string | null { const o = this.off(4); return o ? this.bb.string(this.pos + o) : null; }
  get endTag(): string | null { const o = this.off(6); return o ? this.bb.string(this.pos + o) : null; }
  get startDistAlong(): number { const o = this.off(8); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get horizontalLength(): number { const o = this.off(10); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get startHeight(): number { const o = this.off(12); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get startGradient(): number { const o = this.off(14); return o ? this.bb.float64(this.pos + o) : 0.0; }
}

export class VerticalParabolicArcSegment extends Table {
  get startTag(): string | null { const o = this.off(4); return o ? this.bb.string(this.pos + o) : null; }
  get endTag(): string | null { const o = this.off(6); return o ? this.bb.string(this.pos + o) : null; }
  get startDistAlong(): number { const o = this.off(8); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get horizontalLength(): number { const o = this.off(10); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get startHeight(): number { const o = this.off(12); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get startGradient(): number { const o = this.off(14); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get parabolaConstant(): number { const o = this.off(16); return o ? this.bb.float64(this.pos + o) : 0.0; }
  get isConvex(): boolean { const o = this.off(18); return o ? this.bb.bool(this.pos + o) : false; }
}

export class XRef extends Table {
  get filename(): string | null { const o = this.off(4); return o ? this.bb.string(this.pos + o) : null; }
  get origin(): Vec3d | null { const o = this.off(6); return o ? new Vec3d(this.bb, this.pos + o) : null; }
  get axisX(): Vec3d | null { const o = this.off(8); return o ? new Vec3d(this.bb, this.pos + o) : null; }
  get axisY(): Vec3d | null { const o = this.off(10); return o ? new Vec3d(this.bb, this.pos + o) : null; }
  get axisZ(): Vec3d | null { const o = this.off(12); return o ? new Vec3d(this.bb, this.pos + o) : null; }
  get scale(): Vec3d | null { const o = this.off(14); return o ? new Vec3d(this.bb, this.pos + o) : null; }
}


// Typed-array copies. FlatBuffers aligns vector elements, but the containing
// Uint8Array may sit at any byteOffset, so copy rather than view when the
// alignment does not permit a zero-copy view.

function copyInt8Array(bb: ByteBuffer, base: number, len: number): Int8Array {
  bb.check(base, len * 1);
  const abs = bb.bytes.byteOffset + base;
  if (abs % 1 === 0) return new Int8Array(bb.bytes.buffer, abs, len);
  const out = new Int8Array(len);
  for (let i = 0; i < len; i++) out[i] = bb.int8(base + i * 1);
  return out;
}

function copyUint8Array(bb: ByteBuffer, base: number, len: number): Uint8Array {
  bb.check(base, len * 1);
  const abs = bb.bytes.byteOffset + base;
  if (abs % 1 === 0) return new Uint8Array(bb.bytes.buffer, abs, len);
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) out[i] = bb.uint8(base + i * 1);
  return out;
}

function copyInt16Array(bb: ByteBuffer, base: number, len: number): Int16Array {
  bb.check(base, len * 2);
  const abs = bb.bytes.byteOffset + base;
  if (abs % 2 === 0) return new Int16Array(bb.bytes.buffer, abs, len);
  const out = new Int16Array(len);
  for (let i = 0; i < len; i++) out[i] = bb.int16(base + i * 2);
  return out;
}

function copyUint16Array(bb: ByteBuffer, base: number, len: number): Uint16Array {
  bb.check(base, len * 2);
  const abs = bb.bytes.byteOffset + base;
  if (abs % 2 === 0) return new Uint16Array(bb.bytes.buffer, abs, len);
  const out = new Uint16Array(len);
  for (let i = 0; i < len; i++) out[i] = bb.uint16(base + i * 2);
  return out;
}

function copyInt32Array(bb: ByteBuffer, base: number, len: number): Int32Array {
  bb.check(base, len * 4);
  const abs = bb.bytes.byteOffset + base;
  if (abs % 4 === 0) return new Int32Array(bb.bytes.buffer, abs, len);
  const out = new Int32Array(len);
  for (let i = 0; i < len; i++) out[i] = bb.int32(base + i * 4);
  return out;
}

function copyUint32Array(bb: ByteBuffer, base: number, len: number): Uint32Array {
  bb.check(base, len * 4);
  const abs = bb.bytes.byteOffset + base;
  if (abs % 4 === 0) return new Uint32Array(bb.bytes.buffer, abs, len);
  const out = new Uint32Array(len);
  for (let i = 0; i < len; i++) out[i] = bb.uint32(base + i * 4);
  return out;
}

function copyFloat32Array(bb: ByteBuffer, base: number, len: number): Float32Array {
  bb.check(base, len * 4);
  const abs = bb.bytes.byteOffset + base;
  if (abs % 4 === 0) return new Float32Array(bb.bytes.buffer, abs, len);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) out[i] = bb.float32(base + i * 4);
  return out;
}

function copyFloat64Array(bb: ByteBuffer, base: number, len: number): Float64Array {
  bb.check(base, len * 8);
  const abs = bb.bytes.byteOffset + base;
  if (abs % 8 === 0) return new Float64Array(bb.bytes.buffer, abs, len);
  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) out[i] = bb.float64(base + i * 8);
  return out;
}

