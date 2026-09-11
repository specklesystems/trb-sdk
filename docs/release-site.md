# GitHub Pages release site

The TRB reader site lives in `site/`. It is plain HTML, CSS and JavaScript,
with no frontend dependencies or SDK runtime in the page. Its style and
Speckle logo are shared with the Tekla DB1 release site.

Public site: <https://specklesystems.github.io/trb-sdk/>

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

## Output examples

The page embeds these user-selected outputs from the `TRB corpus e2e` project
(`86b59ef59d`) on `next.speckle.dev`:

| Source           | Model        | Pinned version |
| ---------------- | ------------ | -------------- |
| IFC              | `ea662a7613` | `d8093bb55a`   |
| SketchUp         | `be848d83b9` | `b2162e7e50`   |
| Tekla Structures | `c111e1ad9e` | `2c242152f5`   |

The project remains workspace-visible. Each example uses its own model share
token generated through Speckle's **Embed model → Copy iframe code** flow.
These are deliberately shareable, read-only model links for the public examples,
not personal API credentials. Access to each model was verified using only its
share token, with no account cookies or personal token. Revoking an example's
share link will stop its embed working; generate a replacement through the same
UI and update the iframe, companion link and no-JavaScript link together.

Only the selected example loads. Switching tabs unloads the previous iframe
to avoid retaining multiple large viewer scenes. Arrow keys move between tabs;
Enter or Space activates a tab, and Home/End move to the first/last tab.
The links in each panel open the same shared output in a larger viewer.

## Publication

GitHub Pages is configured to deploy with GitHub Actions. Merging changes to
`site/` or its workflow into `main` publishes them automatically. For a manual
redeployment, run **Release site** from the Actions tab on `main`.

To configure the site again:

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
