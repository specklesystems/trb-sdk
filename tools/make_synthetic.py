#!/usr/bin/env python3
"""Build a synthetic .trb using flatc-generated Python bindings from our own
reconstructed schema, so the TypeScript reader can be tested end to end."""
import sys, flatbuffers
sys.path.insert(0, '/tmp/pygen')
from TrimBim import (Model, ModelEntities, ModelGeometry, ModelProperties,
                     Entity, Guid, Placement3, Vec3d, Vec3f, AABB3f,
                     GeometryDefinition, GeometryInstance, SurfaceMaterial,
                     TriangleMesh, IndexedVertex, HierarchyNode, MetadataEntry,
                     PropertySet, PropertySetDefinition, SinglePropertyDefinition)

b = flatbuffers.Builder(1 << 16)

def s(x): return b.CreateString(x)

# ---- strings -------------------------------------------------------------
cls_wall  = s('IfcWall')
cls_slab  = s('IfcSlab')
layer0    = s('A-WALL')
pset_name = s('Pset_WallCommon')
p_name1   = s('LoadBearing')
p_name2   = s('FireRating')
p_name3   = s('Volume')
str_val   = s('REI 60')
meta_k    = s('exporter'); meta_v = s('synthetic-test')
name0 = s('Wall 1'); desc0 = s('a test wall'); otype0 = s('Basic Wall')

# ---- entity classes vector ----------------------------------------------
ModelEntities.StartEntityClassesVector(b, 2)
b.PrependUOffsetTRelative(cls_slab); b.PrependUOffsetTRelative(cls_wall)
entity_classes = b.EndVector()

ModelEntities.StartStringIdentifiersVector(b, 0); string_ids = b.EndVector()
ModelEntities.StartSpatialHashIdentifiersVector(b, 0); spatial_ids = b.EndVector()
ModelEntities.StartDwgHandleIdentifiersVector(b, 0); dwg_ids = b.EndVector()

# ---- guids ---------------------------------------------------------------
# 2f3d4e5a-1122-3344-5566-778899aabbcc  and  0a1b2c3d-4455-6677-8899-aabbccddeeff
GUIDS = [
    (0x2f3d4e5a, 0x1122, 0x3344, [0x55,0x66,0x77,0x88,0x99,0xaa,0xbb,0xcc]),
    (0x0a1b2c3d, 0x4455, 0x6677, [0x88,0x99,0xaa,0xbb,0xcc,0xdd,0xee,0xff]),
]
ModelEntities.StartGuidIdentifiersVector(b, len(GUIDS))
for d1, d2, d3, rest in reversed(GUIDS):
    Guid.CreateGuid(b, d1, d2, d3, *rest)
guid_ids = b.EndVector()

# ---- entities ------------------------------------------------------------
# entity 0: guid 0, class IfcWall, placed at (10, 20, 30) axis-aligned
# entity 1: guid 1, class IfcSlab, at origin, rotated 90 deg about Z
ENTS = [
    (0, 0, 0, (10.0, 20.0, 30.0), (1,0,0), (0,1,0)),
    (0, 1, 1, (0.0, 0.0, 0.0),    (0,1,0), (-1,0,0)),
]
ModelEntities.StartEntitiesVector(b, len(ENTS))
for typ, idi, cls, o, ax, ay in reversed(ENTS):
    Entity.CreateEntity(b, typ, idi, cls, o[0], o[1], o[2], ax[0], ax[1], ax[2], ay[0], ay[1], ay[2])
entities_vec = b.EndVector()

HIER = [(0, 1, 3)]   # parent 0, child 1, HierarchyType.Containment
ModelEntities.StartHierarchiesVector(b, len(HIER))
for p, c, t in reversed(HIER):
    HierarchyNode.CreateHierarchyNode(b, p, c, t)
hier_vec = b.EndVector()

ModelEntities.Start(b)
ModelEntities.AddEntities(b, entities_vec)
ModelEntities.AddHierarchies(b, hier_vec)
ModelEntities.AddGuidIdentifiers(b, guid_ids)
ModelEntities.AddStringIdentifiers(b, string_ids)
ModelEntities.AddSpatialHashIdentifiers(b, spatial_ids)
ModelEntities.AddDwgHandleIdentifiers(b, dwg_ids)
ModelEntities.AddEntityClasses(b, entity_classes)
model_entities = ModelEntities.End(b)

# ---- geometry: one triangle mesh, a unit tetrahedron-ish patch ----------
POS = [(0,0,0), (1,0,0), (0,1,0), (1,1,0)]
NRM = [(0,0,1)]
VTX = [(0,0), (1,0), (2,0), (3,0)]           # (positionIndex, normalIndex)
IDX = [0,1,2, 1,3,2]

TriangleMesh.StartPositionsVector(b, len(POS))
for p in reversed(POS): Vec3f.CreateVec3f(b, *p)
mesh_pos = b.EndVector()
TriangleMesh.StartNormalsVector(b, len(NRM))
for n in reversed(NRM): Vec3f.CreateVec3f(b, *n)
mesh_nrm = b.EndVector()
TriangleMesh.StartVerticesVector(b, len(VTX))
for pi, ni in reversed(VTX): IndexedVertex.CreateIndexedVertex(b, pi, ni)
mesh_vtx = b.EndVector()
TriangleMesh.StartIndicesVector(b, len(IDX))
for i in reversed(IDX): b.PrependUint16(i)
mesh_idx = b.EndVector()
TriangleMesh.Start(b)
TriangleMesh.AddPositions(b, mesh_pos)
TriangleMesh.AddNormals(b, mesh_nrm)
TriangleMesh.AddVertices(b, mesh_vtx)
TriangleMesh.AddIndices(b, mesh_idx)
mesh = TriangleMesh.End(b)

ModelGeometry.StartTriangleMeshesVector(b, 1)
b.PrependUOffsetTRelative(mesh)
meshes = b.EndVector()

ModelGeometry.StartLayersVector(b, 1)
b.PrependUOffsetTRelative(layer0)
layers = b.EndVector()

ModelGeometry.StartLocalPlacementsVector(b, 1)
Placement3.CreatePlacement3(b, 1.5, 2.5, 3.5, 1,0,0, 0,1,0)
placements = b.EndVector()

ModelGeometry.StartSurfaceMaterialsVector(b, 1)
SurfaceMaterial.CreateSurfaceMaterial(b, 200, 100, 50, 255, 0xFFFFFFFF, 1, 0, 0.25, 0.75)
materials = b.EndVector()

ModelGeometry.StartDefinitionsVector(b, 1)
GeometryDefinition.CreateGeometryDefinition(b, 2, 0, 0,0,0, 1,1,0)   # type 2 = TriangleMesh
definitions = b.EndVector()

ModelGeometry.StartInstancesVector(b, 1)
GeometryInstance.CreateGeometryInstance(b, 0, 0, 0, 0, 0)
instances = b.EndVector()

def empty(startfn):
    startfn(b, 0); return b.EndVector()

mg_empty = {}
for nm, fn in [
    ('textures', ModelGeometry.StartTexturesVector),
    ('b_reps', ModelGeometry.StartBRepsVector),
    ('triangle_meshes8', ModelGeometry.StartTriangleMeshes8Vector),
    ('textured_triangle_meshes', ModelGeometry.StartTexturedTriangleMeshesVector),
    ('textured_triangle_meshes8', ModelGeometry.StartTexturedTriangleMeshes8Vector),
    ('swept_disk_solids', ModelGeometry.StartSweptDiskSolidsVector),
    ('b_rep_with_uvs', ModelGeometry.StartBRepWithUvsVector),
    ('b_rep_with_normals', ModelGeometry.StartBRepWithNormalsVector),
    ('graphics_containers', ModelGeometry.StartGraphicsContainersVector),
    ('alignment_curves', ModelGeometry.StartAlignmentCurvesVector),
    ('grid_line_containers', ModelGeometry.StartGridLineContainersVector),
    ('coordinate_geometry_points', ModelGeometry.StartCoordinateGeometryPointsVector),
    ('billboard_texts', ModelGeometry.StartBillboardTextsVector),
    ('text_styles', ModelGeometry.StartTextStylesVector),
    ('billboards', ModelGeometry.StartBillboardsVector),
    ('textured_billboards', ModelGeometry.StartTexturedBillboardsVector),
    ('bolts', ModelGeometry.StartBoltsVector),
]:
    mg_empty[nm] = empty(fn)

ModelGeometry.Start(b)
ModelGeometry.AddLocalPlacements(b, placements)
ModelGeometry.AddSurfaceMaterials(b, materials)
ModelGeometry.AddLayers(b, layers)
ModelGeometry.AddDefinitions(b, definitions)
ModelGeometry.AddInstances(b, instances)
ModelGeometry.AddTextures(b, mg_empty['textures'])
ModelGeometry.AddBReps(b, mg_empty['b_reps'])
ModelGeometry.AddTriangleMeshes(b, meshes)
ModelGeometry.AddTriangleMeshes8(b, mg_empty['triangle_meshes8'])
ModelGeometry.AddTexturedTriangleMeshes(b, mg_empty['textured_triangle_meshes'])
ModelGeometry.AddTexturedTriangleMeshes8(b, mg_empty['textured_triangle_meshes8'])
ModelGeometry.AddSweptDiskSolids(b, mg_empty['swept_disk_solids'])
ModelGeometry.AddBRepWithUvs(b, mg_empty['b_rep_with_uvs'])
ModelGeometry.AddBRepWithNormals(b, mg_empty['b_rep_with_normals'])
ModelGeometry.AddGraphicsContainers(b, mg_empty['graphics_containers'])
ModelGeometry.AddAlignmentCurves(b, mg_empty['alignment_curves'])
ModelGeometry.AddGridLineContainers(b, mg_empty['grid_line_containers'])
ModelGeometry.AddCoordinateGeometryPoints(b, mg_empty['coordinate_geometry_points'])
ModelGeometry.AddBillboardTexts(b, mg_empty['billboard_texts'])
ModelGeometry.AddTextStyles(b, mg_empty['text_styles'])
ModelGeometry.AddBillboards(b, mg_empty['billboards'])
ModelGeometry.AddTexturedBillboards(b, mg_empty['textured_billboards'])
ModelGeometry.AddBolts(b, mg_empty['bolts'])
model_geometry = ModelGeometry.End(b)

# ---- properties ----------------------------------------------------------
# Pset_WallCommon { LoadBearing: Boolean, FireRating: StringValue, Volume: VolumeMeasure }
PropertySetDefinition.StartPropertiesVector(b, 3)
SinglePropertyDefinition.CreateSinglePropertyDefinition(b, 2, 2)   # Volume, VolumeMeasure
SinglePropertyDefinition.CreateSinglePropertyDefinition(b, 1, 5)   # FireRating, StringValue
SinglePropertyDefinition.CreateSinglePropertyDefinition(b, 0, 10)  # LoadBearing, Boolean
psd_props = b.EndVector()
PropertySetDefinition.Start(b)
PropertySetDefinition.AddName(b, 0)
PropertySetDefinition.AddProperties(b, psd_props)
psd = PropertySetDefinition.End(b)

ModelProperties.StartDefinitionsVector(b, 1)
b.PrependUOffsetTRelative(psd)
prop_defs = b.EndVector()

# one entity (index 0), values: LoadBearing=1(true), FireRating=string[0], Volume=volume[0]
PropertySet.StartValuesVector(b, 3)
for v in reversed([1, 0, 0]): b.PrependUint32(v)
ps_vals = b.EndVector()
PropertySet.StartEntitiesVector(b, 1)
b.PrependUint32(0)
ps_ents = b.EndVector()
PropertySet.Start(b)
PropertySet.AddDefinition(b, 0)
PropertySet.AddValues(b, ps_vals)
PropertySet.AddEntities(b, ps_ents)
pset = PropertySet.End(b)

ModelProperties.StartPropertySetBindingsVector(b, 1)
b.PrependUOffsetTRelative(pset)
pset_bindings = b.EndVector()

def strvec(startfn, items):
    startfn(b, len(items))
    for x in reversed(items): b.PrependUOffsetTRelative(x)
    return b.EndVector()

def dblvec(startfn, items):
    startfn(b, len(items))
    for x in reversed(items): b.PrependFloat64(x)
    return b.EndVector()

pset_names  = strvec(ModelProperties.StartPropertySetNamesVector, [pset_name])
prop_names  = strvec(ModelProperties.StartPropertyNamesVector, [p_name1, p_name2, p_name3])
str_values  = strvec(ModelProperties.StartStringValuesVector, [str_val])
names       = strvec(ModelProperties.StartNamesVector, [name0])
descs       = strvec(ModelProperties.StartDescriptionsVector, [desc0])
otypes      = strvec(ModelProperties.StartObjectTypesVector, [otype0])
volumes     = dblvec(ModelProperties.StartVolumeMeasuresVector, [42.5])
lengths     = dblvec(ModelProperties.StartLengthMeasuresVector, [])
areas       = dblvec(ModelProperties.StartAreaMeasuresVector, [])
masses      = dblvec(ModelProperties.StartMassMeasuresVector, [])
angles      = dblvec(ModelProperties.StartAngleMeasuresVector, [])
doubles     = dblvec(ModelProperties.StartDoubleValuesVector, [])
ModelProperties.StartDateTimeValuesVector(b, 0); datetimes = b.EndVector()
ModelProperties.StartProductBindingsVector(b, 0); pbind = b.EndVector()
ModelProperties.StartProductsVector(b, 0); products = b.EndVector()
ModelProperties.StartOwnersVector(b, 0); owners = b.EndVector()
ModelProperties.StartHistoriesVector(b, 0); histories = b.EndVector()

ModelProperties.Start(b)
ModelProperties.AddProductBindings(b, pbind)
ModelProperties.AddProducts(b, products)
ModelProperties.AddOwners(b, owners)
ModelProperties.AddHistories(b, histories)
ModelProperties.AddNames(b, names)
ModelProperties.AddDescriptions(b, descs)
ModelProperties.AddObjectTypes(b, otypes)
ModelProperties.AddPropertySetBindings(b, pset_bindings)
ModelProperties.AddPropertySetNames(b, pset_names)
ModelProperties.AddPropertyNames(b, prop_names)
ModelProperties.AddDefinitions(b, prop_defs)
ModelProperties.AddLengthMeasures(b, lengths)
ModelProperties.AddAreaMeasures(b, areas)
ModelProperties.AddVolumeMeasures(b, volumes)
ModelProperties.AddMassMeasures(b, masses)
ModelProperties.AddAngleMeasures(b, angles)
ModelProperties.AddStringValues(b, str_values)
ModelProperties.AddDoubleValues(b, doubles)
ModelProperties.AddDateTimeValues(b, datetimes)
model_properties = ModelProperties.End(b)

# ---- metadata / map conversions -----------------------------------------
MetadataEntry.Start(b)
MetadataEntry.AddKey(b, meta_k)
MetadataEntry.AddValue(b, meta_v)
meta = MetadataEntry.End(b)
Model.StartMetadataVector(b, 1)
b.PrependUOffsetTRelative(meta)
metadata = b.EndVector()
Model.StartMapConversionsVector(b, 0); mapconv = b.EndVector()

Model.Start(b)
Model.AddEntities(b, model_entities)
Model.AddProperties(b, model_properties)
Model.AddGeometry(b, model_geometry)
Model.AddMapConversions(b, mapconv)
Model.AddMetadata(b, metadata)
root = Model.End(b)
b.Finish(root, file_identifier=b'TRB8')

open('synthetic.trb','wb').write(bytes(b.Output()))
print('wrote synthetic.trb', len(b.Output()), 'bytes')
