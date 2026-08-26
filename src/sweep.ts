/**
 * SweptDiskSolid tessellation: a tube of constant radius swept along a
 * directrix. In practice this is rebar — the Tekla writer emits one
 * SweptDiskSolidContainer per reinforcement group, one directrix per bar
 * (line and arc segments: straight runs joined by bend arcs), and one radius
 * per directrix.
 *
 * The directrix is sampled into a polyline (arcs by angle step), a circle is
 * swept along it with parallel-transported frames, and the ends are capped.
 * Arc parameterisation, verified against segment continuity in real files:
 * point(t) = center + r·(cos t · refDirection + sin t · (axis × refDirection)),
 * t ∈ [0, angle].
 */
import { SweptDiskSolidContainer, SegmentType, Directrix } from './schema.js';

type V3 = [number, number, number];

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const norm = (a: V3): V3 => {
  const l = len(a);
  return l > 0 ? [a[0] / l, a[1] / l, a[2] / l] : [0, 0, 1];
};

/** Sample one directrix into a deduplicated polyline. */
function samplePath(d: Directrix, arcStep: number): V3[] {
  const pts: V3[] = [];
  const push = (p: V3) => {
    const q = pts[pts.length - 1];
    // segments meet within float32 noise (~1e-8); dedupe at a micron so the
    // seams don't become zero-width wall quads
    if (!q || len(sub(p, q)) > 1e-6) pts.push(p);
  };
  const types = d.types();
  const indexes = d.indexes();
  for (let s = 0; s < types.length; s++) {
    const i = indexes[s]!;
    switch (types[s]) {
      case SegmentType.LineSegment: {
        const l = d.lineSegments(i);
        push([l.start.x, l.start.y, l.start.z]);
        push([l.end.x, l.end.y, l.end.z]);
        break;
      }
      case SegmentType.PolyLine: {
        const p = d.polyLines(i);
        for (let k = 0; k < p.pointsLength(); k++) {
          const v = p.points(k);
          push([v.x, v.y, v.z]);
        }
        break;
      }
      case SegmentType.Arc: {
        const a = d.arcs(i);
        const c: V3 = [a.center.x, a.center.y, a.center.z];
        const ref = norm([a.refDirection.x, a.refDirection.y, a.refDirection.z]);
        const n = norm(cross([a.axis.x, a.axis.y, a.axis.z], ref));
        const steps = Math.max(1, Math.ceil(Math.abs(a.angle) / arcStep));
        for (let k = 0; k <= steps; k++) {
          const t = (a.angle * k) / steps;
          const ct = Math.cos(t), st = Math.sin(t);
          push([
            c[0] + a.radius * (ct * ref[0] + st * n[0]),
            c[1] + a.radius * (ct * ref[1] + st * n[1]),
            c[2] + a.radius * (ct * ref[2] + st * n[2]),
          ]);
        }
        break;
      }
    }
  }
  return pts;
}

export interface SweptMesh {
  positions: Float32Array;
  normals: Float32Array;
  uvs: null;
  indices: Uint16Array | Uint32Array;
}

/**
 * Tessellate every directrix of a container into one merged tube mesh.
 *
 * @param sides    ring segments around the tube (8 keeps a 5000-bar model sane)
 * @param arcStep  max angle per arc sample, radians
 */
export function tessellateSweptDisk(
  c: SweptDiskSolidContainer,
  sides = 8,
  arcStep = Math.PI / 12,
): SweptMesh | null {
  const radii = c.radius();
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  for (let di = 0; di < c.directricesLength(); di++) {
    const r = radii[di] ?? radii[0] ?? 0;
    if (r <= 0) continue;
    const path = samplePath(c.directrices(di), arcStep);
    if (path.length < 2) continue;

    // tangents per point (averaged at interior points)
    const tangents: V3[] = path.map((p, i) => {
      if (i === 0) return norm(sub(path[1]!, p));
      if (i === path.length - 1) return norm(sub(p, path[i - 1]!));
      return norm(sub(path[i + 1]!, path[i - 1]!));
    });

    // parallel-transported frame: rotate (n, b) from tangent to tangent
    let n0: V3 = Math.abs(tangents[0]![2]!) < 0.9 ? [0, 0, 1] : [1, 0, 0];
    let n = norm(cross(cross(tangents[0]!, n0), tangents[0]!));
    const frames: V3[] = [];
    const ringStart = positions.length / 3;
    for (let i = 0; i < path.length; i++) {
      if (i > 0) {
        // rotate n by the rotation taking tangents[i-1] to tangents[i]
        const axis = cross(tangents[i - 1]!, tangents[i]!);
        const s = len(axis), co = dot(tangents[i - 1]!, tangents[i]!);
        if (s > 1e-12) {
          const [ax, ay, az] = norm(axis);
          const [nx, ny, nz] = n;
          const d2 = ax * nx + ay * ny + az * nz;
          n = [
            nx * co + (ay * nz - az * ny) * s + ax * d2 * (1 - co),
            ny * co + (az * nx - ax * nz) * s + ay * d2 * (1 - co),
            nz * co + (ax * ny - ay * nx) * s + az * d2 * (1 - co),
          ];
          n = norm(cross(cross(tangents[i]!, n), tangents[i]!));
        }
      }
      frames.push(n);
      const b = cross(tangents[i]!, n);
      const p = path[i]!;
      for (let k = 0; k < sides; k++) {
        const t = (2 * Math.PI * k) / sides;
        const ct = Math.cos(t), st = Math.sin(t);
        const rx = ct * n[0] + st * b[0];
        const ry = ct * n[1] + st * b[1];
        const rz = ct * n[2] + st * b[2];
        positions.push(p[0] + r * rx, p[1] + r * ry, p[2] + r * rz);
        normals.push(rx, ry, rz);
      }
    }

    // side walls between consecutive rings
    for (let i = 0; i < path.length - 1; i++) {
      const a = ringStart + i * sides;
      const c2 = a + sides;
      for (let k = 0; k < sides; k++) {
        const k2 = (k + 1) % sides;
        indices.push(a + k, c2 + k, c2 + k2, a + k, c2 + k2, a + k2);
      }
    }

    // end caps are HEMISPHERES: the stored bounding boxes extend exactly one
    // radius past the path endpoints along the path direction, so the writer
    // models rounded (spherical) bar ends, not flat ones.
    const latRings = Math.max(2, Math.round(sides / 4));
    for (const last of [false, true]) {
      const i = last ? path.length - 1 : 0;
      const p = path[i]!;
      const t = tangents[i]!;
      const axial: V3 = last ? t : [-t[0], -t[1], -t[2]];
      const nEnd = frames[i]!;
      const bEnd = cross(t, nEnd);
      let prevRing = ringStart + i * sides; // the tube's end ring is the equator
      for (let lr = 1; lr < latRings; lr++) {
        const phi = (Math.PI / 2) * (lr / latRings);
        const cp = Math.cos(phi), sp = Math.sin(phi);
        const ring = positions.length / 3;
        for (let k = 0; k < sides; k++) {
          const th = (2 * Math.PI * k) / sides;
          const ct = Math.cos(th), st = Math.sin(th);
          const dx = cp * (ct * nEnd[0] + st * bEnd[0]) + sp * axial[0];
          const dy = cp * (ct * nEnd[1] + st * bEnd[1]) + sp * axial[1];
          const dz = cp * (ct * nEnd[2] + st * bEnd[2]) + sp * axial[2];
          positions.push(p[0] + r * dx, p[1] + r * dy, p[2] + r * dz);
          normals.push(dx, dy, dz);
        }
        for (let k = 0; k < sides; k++) {
          const k2 = (k + 1) % sides;
          if (last) indices.push(prevRing + k, ring + k, ring + k2, prevRing + k, ring + k2, prevRing + k2);
          else indices.push(prevRing + k, ring + k2, ring + k, prevRing + k, prevRing + k2, ring + k2);
        }
        prevRing = ring;
      }
      const pole = positions.length / 3;
      positions.push(p[0] + r * axial[0], p[1] + r * axial[1], p[2] + r * axial[2]);
      normals.push(axial[0], axial[1], axial[2]);
      for (let k = 0; k < sides; k++) {
        const k2 = (k + 1) % sides;
        if (last) indices.push(pole, prevRing + k, prevRing + k2);
        else indices.push(pole, prevRing + k2, prevRing + k);
      }
    }
  }

  if (positions.length === 0) return null;
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    uvs: null,
    indices: positions.length / 3 > 65535
      ? new Uint32Array(indices)
      : new Uint16Array(indices),
  };
}
