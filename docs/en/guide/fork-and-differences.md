# Fork relationship, package and differences

**Herbert He** maintains this independent fork of
[Hufe921/canvas-editor](https://github.com/Hufe921/canvas-editor).
Thanks to Hufe and the upstream contributors for the original implementation.
This is not an official upstream release and has no upstream endorsement or affiliation.

| Identity           | This fork                                                             | Upstream                                                          |
| ------------------ | --------------------------------------------------------------------- | ----------------------------------------------------------------- |
| npm package        | `@herberthe/canvas-editor`                                            | `@hufe921/canvas-editor`                                          |
| Version series     | Starts independently at `0.1.0`                                       | Own upstream series                                               |
| Repository/support | [HerbertHe/canvas-editor](https://github.com/HerbertHe/canvas-editor) | [Hufe921/canvas-editor](https://github.com/Hufe921/canvas-editor) |
| Maintainer         | Herbert He                                                            | Hufe and upstream maintainers                                     |
| License            | MIT, including retained upstream notice                               | Original MIT license                                              |

The upstream npm package is not a dependency. Versions and publication rights
are separate. The repository prepares 0.1.0; it does not confirm npm publication.

## Comparison

Baseline: upstream **1.0.5**, at
[commit 1d7cd1a7](https://github.com/Hufe921/canvas-editor/tree/1d7cd1a7742f3e8af1f67536a5157d03b2945de7).
This comparison makes no claims about future upstream versions. An absent
HarfBuzz pipeline does not imply browsers cannot display those scripts.

| Capability                                                        | Upstream baseline                             | This fork 0.1.0                                                             |
| ----------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------- |
| Text                                                              | Browser Canvas measurement/painting           | HarfBuzz-only native layout and Canvas glyph outlines                       |
| Font resources                                                    | Browser font selection/fallback               | TTF/OTF/WOFF/WOFF2 registration and actual face tracking                    |
| Coverage diagnostics                                              | No equivalent explicit reporting pipeline     | Reports/events, missing-glyph boxes, page/console hints                     |
| Basic-font downloads                                              | No equivalent Bunny pipeline                  | Enabled by default, runtime toggle, retry and manual/offline mode           |
| Complex scripts and BiDi                                          | No equivalent HarfBuzz cluster/caret pipeline | Native glyph/cluster/caret geometry, visual navigation and logical deletion |
| Initialization                                                    | Synchronous construction                      | `Editor.create()` / `editor.ready`, failure states and cleanup              |
| Incremental layout                                                | Row-level optimization already exists         | Native paragraph reuse, with pagination and positions recomputed            |
| Distribution                                                      | ESM and UMD                                   | ESM-only root exports and declarations                                      |
| SVG pages                                                         | Separate upstream experimental branch         | Deferred and unavailable; Canvas-only                                       |
| Tables, controls, pagination, paragraph spacing, comments, macros | Existing features                             | Inherited and adapted, not fork inventions                                  |
| External plugins                                                  | Upstream ecosystem                            | Compatibility must be verified individually                                 |

Sources: [upstream package](https://github.com/Hufe921/canvas-editor/blob/1d7cd1a7742f3e8af1f67536a5157d03b2945de7/package.json),
[upstream text painting](https://github.com/Hufe921/canvas-editor/blob/1d7cd1a7742f3e8af1f67536a5157d03b2945de7/src/editor/core/draw/particle/TextParticle.ts).
Fork implementation: `core/text-engine`, `core/layout` and `core/text-engine-host`.
Not every language/style is fully validated. Basic fonts do not guarantee rare
characters or color emoji. No speedup is promised; T23/T24 remain deferred.

## Canvas-only release

Canvas is the default and only document page renderer. There is no renderer
selector. SVG page implementation and standalone SVG document export are
unavailable and deferred. Do not configure `renderer: 'svg'`; the removed
`textEngine` / `renderMode` options are also unsupported.

SVG image inputs, formulas, icons and glyph path data are resources, not an SVG
page backend. Printing uses the Canvas image pipeline, with no searchable
vector PDF guarantee. The [SVG assessment](../../guide/harfbuzz-svg-assessment.md)
is a future design; SVG-01 through SVG-12 have not started.

## Migration and examples

```sh
npm uninstall @hufe921/canvas-editor
npm install @herberthe/canvas-editor@0.1.0
```

```typescript
import Editor from '@herberthe/canvas-editor'

const editor = await Editor.create(
  document.querySelector<HTMLDivElement>('.canvas-editor')!,
  { main: [{ value: 'Weekend plans · 周末计划 · خطة نهاية الأسبوع' }] }
)
```

Replace dependency/imports, remove old engine options and enums, await readiness,
and register fonts for the required text. For offline integration disable
`autoDownloadFonts`; otherwise basic Bunny downloads are enabled by default.
Readiness does not wait for background downloads. Revalidate pagination,
selection, controls and plugins against actual font metrics.

Use Node.js `>=24.13.1` for development and a WASM/Worker/top-level-await capable
browser/bundler. See [Fonts and ESM migration](./font-and-esm-migration.md).
Run `npm run dev` for this fork's everyday multilingual demo and
`npm run docs:dev` for local docs. The standalone package example is in
`examples/esm-fonts`. Upstream hosted sites describe a different package.

## Publication and license

Run `npm run lib`, `npm run test:package`, `npm run docs:build` and
`npm pack --dry-run`. Actual publication uses an npm account with `@herberthe`
scope permissions and `npm publish --access public`. Packaging checks do not
replace the deferred T23/T24 acceptance work.

Fork modifications: Copyright (c) 2026-present **Herbert He**.
Original code: Copyright (c) 2021-present **hufe**. The upstream copyright and
full MIT permission notice are retained in `LICENSE`; `NOTICE` records origin.
Both files ship with the package. Third-party assets and fonts keep their own licenses.
