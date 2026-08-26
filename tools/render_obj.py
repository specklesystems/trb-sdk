#!/usr/bin/env python3
"""Tiny z-buffer rasteriser, just to eyeball a decoded model."""
import sys, numpy as np
from PIL import Image

path, out = sys.argv[1], sys.argv[2]
W = H = 900

V, F = [], []
with open(path) as f:
    for line in f:
        if line[0] == 'v' and line[1] == ' ':
            V.append([float(x) for x in line[2:].split()])
        elif line[0] == 'f':
            F.append([int(x) - 1 for x in line[2:].split()])
V = np.asarray(V, dtype=np.float64); F = np.asarray(F, dtype=np.int64)
print(f'{len(V)} verts, {len(F)} faces')

ctr = (V.min(0) + V.max(0)) / 2
V = V - ctr

def render(az, el, tag):
    a, e = np.radians(az), np.radians(el)
    # rotate about Z then tilt; model Z is up
    Rz = np.array([[np.cos(a), -np.sin(a), 0], [np.sin(a), np.cos(a), 0], [0, 0, 1]])
    Rx = np.array([[1, 0, 0], [0, np.cos(e), -np.sin(e)], [0, np.sin(e), np.cos(e)]])
    P = V @ Rz.T @ Rx.T
    # screen: x right, z up, y into the screen (depth)
    sx, sy, depth = P[:, 0], P[:, 2], P[:, 1]
    ext = max(sx.max() - sx.min(), sy.max() - sy.min()) * 1.08
    cx, cy = (sx.max() + sx.min()) / 2, (sy.max() + sy.min()) / 2
    px = (sx - cx) / ext * W + W / 2
    py = H / 2 - (sy - cy) / ext * H

    zbuf = np.full((H, W), np.inf)
    img = np.zeros((H, W, 3), dtype=np.float32)
    img[:] = (0.09, 0.10, 0.12)

    tri = np.stack([px[F], py[F], depth[F]], axis=-1)   # (n,3,3)
    world = V[F]
    n = np.cross(world[:, 1] - world[:, 0], world[:, 2] - world[:, 0])
    ln = np.linalg.norm(n, axis=1, keepdims=True); ln[ln == 0] = 1
    n = n / ln
    light = np.array([0.4, -0.75, 0.53]); light /= np.linalg.norm(light)
    shade = np.abs(n @ light) * 0.72 + 0.22

    order = np.argsort(-tri[:, :, 2].mean(1))          # far to near
    for i in order:
        t = tri[i]
        x0 = max(int(np.floor(t[:, 0].min())), 0); x1 = min(int(np.ceil(t[:, 0].max())) + 1, W)
        y0 = max(int(np.floor(t[:, 1].min())), 0); y1 = min(int(np.ceil(t[:, 1].max())) + 1, H)
        if x1 <= x0 or y1 <= y0: continue
        xs, ys = np.meshgrid(np.arange(x0, x1) + .5, np.arange(y0, y1) + .5)
        ax, ay = t[0, 0], t[0, 1]; bx, by = t[1, 0], t[1, 1]; cx2, cy2 = t[2, 0], t[2, 1]
        d = (by - cy2) * (ax - cx2) + (cx2 - bx) * (ay - cy2)
        if abs(d) < 1e-12: continue
        w0 = ((by - cy2) * (xs - cx2) + (cx2 - bx) * (ys - cy2)) / d
        w1 = ((cy2 - ay) * (xs - cx2) + (ax - cx2) * (ys - cy2)) / d
        w2 = 1 - w0 - w1
        m = (w0 >= 0) & (w1 >= 0) & (w2 >= 0)
        if not m.any(): continue
        z = w0 * t[0, 2] + w1 * t[1, 2] + w2 * t[2, 2]
        sub = zbuf[y0:y1, x0:x1]
        upd = m & (z < sub)
        if not upd.any(): continue
        sub[upd] = z[upd]
        c = shade[i]
        img[y0:y1, x0:x1][upd] = (c * 0.98, c * 0.94, c * 0.86)
    Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).save(out.replace('.png', f'-{tag}.png'))
    print('wrote', out.replace('.png', f'-{tag}.png'))

render(35, 62, 'iso')
render(0, 90, 'plan')
