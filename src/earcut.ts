/**
 * Face triangulation for BRep faces: planar loops with holes.
 *
 * Faces in a TrimBIM BRep are planar: one outer wire, zero or more inner
 * wires that are holes in it. This module projects the face onto its dominant
 * plane and hands the 2D polygon to the vendored mapbox earcut
 * (src/vendor/earcut.ts, ISC), which is robust against everything real
 * writers emit: many holes per face (Tekla slabs with dozens of penetrations),
 * self-touching "keyhole" outer wires (SketchUp's inline hole encoding), and
 * collinear chains. A hand-rolled ear clipper handled the simple cases but
 * deadlocked on Tekla's 37-hole slab faces, silently dropping triangles.
 */
import earcut from './vendor/earcut.js';

/** Newell's method: area-weighted normal, stable for non-planar-ish loops. */
export function faceNormal(
  ring: number[],
  get: (i: number) => [number, number, number],
): [number, number, number] {
  let nx = 0, ny = 0, nz = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = get(ring[i]!);
    const b = get(ring[(i + 1) % ring.length]!);
    nx += (a[1] - b[1]) * (a[2] + b[2]);
    ny += (a[2] - b[2]) * (a[0] + b[0]);
    nz += (a[0] - b[0]) * (a[1] + b[1]);
  }
  const len = Math.hypot(nx, ny, nz);
  return len > 0 ? [nx / len, ny / len, nz / len] : [0, 0, 1];
}

/** Drop the dominant axis of the normal to get a 2D projection. */
function projector(n: [number, number, number]): (p: [number, number, number]) => [number, number] {
  const ax = Math.abs(n[0]), ay = Math.abs(n[1]), az = Math.abs(n[2]);
  if (az >= ax && az >= ay) return n[2] > 0 ? (p) => [p[0], p[1]] : (p) => [p[1], p[0]];
  if (ay >= ax) return n[1] > 0 ? (p) => [p[2], p[0]] : (p) => [p[0], p[2]];
  return n[0] > 0 ? (p) => [p[1], p[2]] : (p) => [p[2], p[1]];
}

/**
 * Triangulate one face.
 *
 * @param outer  vertex indices of the outer loop
 * @param holes  vertex indices of each hole loop
 * @param get    resolve a vertex index to a 3D point
 * @returns flat triples of vertex indices, in the caller's index space
 */
export function triangulateFace(
  outer: number[],
  holes: number[][],
  get: (i: number) => [number, number, number],
): number[] {
  if (outer.length < 3) return [];

  // fast path: a triangle or a hole-free quad needs no clipping
  if (holes.length === 0) {
    if (outer.length === 3) return [outer[0]!, outer[1]!, outer[2]!];
    if (outer.length === 4) {
      return [outer[0]!, outer[1]!, outer[2]!, outer[0]!, outer[2]!, outer[3]!];
    }
  }

  const project = projector(faceNormal(outer, get));

  const rings = [outer, ...holes.filter((h) => h.length >= 3)];
  const coords: number[] = [];
  const holeIndices: number[] = [];
  const map: number[] = [];
  for (let r = 0; r < rings.length; r++) {
    if (r > 0) holeIndices.push(map.length);
    for (const vi of rings[r]!) {
      const p = project(get(vi));
      coords.push(p[0], p[1]);
      map.push(vi);
    }
  }

  const tri: number[] = earcut(coords, holeIndices, 2);
  const out = new Array<number>(tri.length);
  for (let i = 0; i < tri.length; i++) out[i] = map[tri[i]!]!;
  return out;
}
