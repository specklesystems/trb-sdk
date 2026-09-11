# GitHub Pages release site

The TRB reader site lives in `site/`. It is plain HTML, CSS and JavaScript,
with no frontend dependencies or SDK runtime in the page. Its style and
Speckle logo are shared with the Tekla DB1 release site.

## Preview

From the repository root:

```sh
python3 -m http.server 4174 --bind 127.0.0.1
```

Open <http://127.0.0.1:4174/site/>. All asset references are relative so the
same files work at the GitHub Pages project path.

## Diagram and copy

The HTML/CSS diagram represents Trimble Connect processing IFC, SketchUp,
Tekla Structures and Navisworks inputs into TrimBIM, followed by SDK consumers.
It becomes a vertical flow on narrow screens. Text stays selectable and
readable by assistive technology.

The included example exporters produce USDZ and CSV. Speckle and other
applications are labelled as destinations for integrations built with the
reader API; the package does not include a Speckle upload command.

Trimble documents the source-file step in
[Export and Save as TrimBIM](https://help.trimble.com/doc/trimble-connect/trimble-connect/connect-for-windows/models/export-and-save-as-trimbim).
Reader and exporter claims follow `README.md`, `docs/support-matrix.md` and
the public types in `src/index.ts`.

The quickstart builds from source. Add registry install instructions only
after an npm package has been published. Keep the diagram destinations and
support descriptions aligned with actual SDK capabilities.

## Publication

1. Make sure the repository is ready for public access, including its source
   and linked documentation. The workflow does not change repository visibility.
2. In **Settings → Pages**, select **GitHub Actions** as the source.
3. Merge this site into `main`, or run **Release site** manually from `main`.
4. Verify the URL reported by the deployment. The default is
   <https://specklesystems.github.io/trb-sdk/>.
5. Add the live URL to the repository homepage and README after publishing.

Pull requests validate JavaScript syntax and local assets without deploying.
Changes to `site/` or its workflow on `main` publish automatically. Only
`site/` is uploaded: no SDK source, proprietary model files or local outputs
are part of the Pages artifact.
