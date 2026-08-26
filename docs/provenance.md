# Provenance

The schema in `schemas/trimbim-v8.fbs` was reconstructed for interoperability
from the flatc-generated TypeScript that Trimble publishes in the public source
maps of its Web3D viewer bundle. It was verified by regenerating TypeScript
from the reconstructed schema with `flatc` and diffing the binary-layout facts
against Trimble's own generated files: struct sizes, struct member byte
offsets, table vtable slot numbers, required-field markers and the file
identifier. All 89 declarations, zero mismatches.

This package contains no Trimble code. The FlatBuffers decoding in
`src/buffer.ts` is written from the published FlatBuffers binary
specification. The only third-party code is `src/vendor/earcut.ts`, vendored
from mapbox/earcut under the ISC license (see THIRD_PARTY_NOTICES.md). The
viewer bundle files used during reconstruction are **not** part of this
repository and must never be committed to it.

TrimBIM has no published specification and no compatibility promise. Treat the
schema as pinned to viewer build `v5.0.6649` and re-verify against new builds.
Trimble and TrimBIM are trademarks of Trimble Inc.

## Regeneration pipeline

`src/schema.ts` is generated; the chain is:

```
Trimble viewer source maps (external, not in repo)
  └─ tools/fbs_from_ts.py   reconstructs declarations → schema.json
       ├─ tools/emit_fbs.py     schema.json → trimbim.fbs   (schemas/trimbim-v8.fbs)
       ├─ tools/gen_ts.py       schema.json → src/schema.ts
       └─ tools/verify.py       regenerate TS with flatc, diff layout facts
                                against Trimble's generated TS
```

`schema.json` is an intermediate derived from Trimble's files and is not
checked in. To regenerate for a new viewer build: extract the
`TrimBim_generated` TypeScript from the build's source maps into a scratch
directory, run `fbs_from_ts.py <that-dir>` to produce a fresh `schema.json`,
then `gen_ts.py schema.json src/schema.ts` and `verify.py` to confirm layout
facts still match. Bump `SUPPORTED_VERSION` and the schema filename if the
file identifier changed.

`tools/make_synthetic.py` writes `test/fixtures/synthetic.trb`, the
hand-built fixture the unit tests run against. `tools/render_obj.py` renders
an OBJ dump (see `src/export-obj.ts`) for eyeballing.
