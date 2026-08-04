# RTL Layout & Rendering Engine Design

> Goal: support Arabic and other RTL/LTR mixed layout on the existing flat `IElement[]` model; **HarfBuzz is required for this phase**; keep the layout/paint engine relatively independent to reduce Draw invasiveness.  
> Baseline: [Architecture](./architecture.md). Deferred work: [RTL deferred TODO](./rtl-deferred-todo.md).

## 1. Goals and decisions

1. Canvas-only layout/paint; metrics from HarfBuzz advances; self-computed visual coordinates; **do not** rely on global `ctx.direction`.
2. Precise caret and hit-testing including ligature interiors (cluster mapping).
3. Full Bidi (UAX#9): paragraph `ltr` / `rtl` / `auto`; alignment `start` / `end` / physical left-right / center / justify.
4. Rich text via per-character element styles (no separate AttributeRange store).
5. Editing: visual arrow keys, logical delete, IME, dual DOM caret sync.
6. DOM shell: CursorAgent textarea + toolbar; engine stays UI-framework free.
7. History: keep snapshots this phase; incremental history is [DEFER-009](./rtl-deferred-todo.md#defer-009).

**Out of scope for storage**: migrating to standalone `Paragraph[]` + `AttributeRange`; scattering HB/Bidi into `Draw.ts` / particles.

## 2. Current gaps

Pipeline today is LTR-only (`ctx.direction = 'ltr'`, `x += width`). Paragraphs are implicit `ZERO` boundaries. History is full snapshots.

| Spec concept | Current equivalent | Approach |
|--------------|-------------------|----------|
| `Paragraph.text` | Join values between `ZERO`s | Logical scanner only |
| `AttributeRange` | Per-char style fields | Aggregate StyleRuns at layout |
| `direction` / align | none / `rowFlex` | Add `direction`; `start`/`end` on `rowFlex` |
| Layout engine | inline `computeRowList` | Independent `text-engine` |
| HarfBuzz | `measureText` | **Required** `HarfBuzzTextShaper` |
| Reversible commands | snapshot closures | [DEFER-009](./rtl-deferred-todo.md#defer-009) |

## 3. Model extensions

```ts
direction?: TextDirection // 'ltr' | 'rtl' | 'auto'
```

Add `RowFlex.start` / `end`; keep physical `left`/`right`. Wire into zip/row attrs, content `defaultDirection` (`executeDirection`), UI mode `options.direction` (`executeUiDirection`, `ce-ui-rtl` — never canvas `dir=rtl`), `textEngine`, `fonts`, `caretMovement`. Runtime-only: `bidiLevel` / `visualIndex` / `clusterStart` / `clusterEnd`.

`ParagraphScanner` yields logical spans; no persisted `paragraphId`.

Commands: `executeDirection`, `getRangeParagraphDirection`, HTML `dir` round-trip (full fidelity edge cases: [DEFER-019](./rtl-deferred-todo.md#defer-019)).

## 4. Independent engine boundary

```
src/editor/core/text-engine/       # no Draw imports
src/editor/core/text-engine-host/  # only glue that may import IElement
```

**Allowed**: engine → own types + harfbuzz/opentype/bidi.  
**Forbidden**: engine → Draw/Command/Particle; calling HB inside `computeRowList`.

Host changes: Draw text path → `LayoutHostAdapter`; Position/Cursor → `HitTestAdapter`; TextParticle → `GlyphRenderer`; decorations → `mergeVisualRects`; dual path `textEngine: 'legacy' | 'harfbuzz'`; transitional `mapToLegacyRow` ([DEFER-016](./rtl-deferred-todo.md#defer-016)).

## 5. Layout pipeline

`TextSpan[]` → resolveDirection → Bidi → StyleRuns → **HarfBuzz** → LineBreaker → Alignment → `LayoutResult`.

HarfBuzz flow:

```
StyleRun → FontManager → hb.shape → ShapedGlyph[] { glyphId, cluster, ax, dx, charStart, charEnd }
```

Invariants: logical `elementList` order unchanged; visual order only in layout results; `IElementPosition.index` stays logical; clusters enabled this phase. LaTeX SVG does **not** go through HarfBuzz.

## 6. Input, simulated caret, delete

| Action | Behavior |
|--------|----------|
| Left/Right | Visual neighbors by default |
| Backspace/Delete | **Logical** delete |
| Home/End | Visual line ends |
| Click/drag | `pointToLogicalIndex` |
| IME | Agent `dir` = paragraph direction; skip keydown while composing |

**Simulated caret (required):**

```
logicalIndex → HitTestAdapter.caretMetrics() → sync cursorDom + agentCursorDom
```

Do not assume caret sticks to `rightTop`. Blink bar and Agent must share one metrics source. Ligature interpolation matches hit-testing. Page offset remains in Cursor.

**Delete listening (required):**

Keep `keydown` → `backspace` / `del`. Do not make textarea `beforeinput` the primary path ([DEFER-021](./rtl-deferred-todo.md#defer-021)). Preserve control/hide/trace/table rules in existing handlers. One grapheme/cluster per Backspace in Arabic. After delete: `render` → `drawCursor`. Visual-adjacent delete mode: [DEFER-022](./rtl-deferred-todo.md#defer-022).

## 7. Rendering

GlyphRenderer inside engine; TextParticle becomes a thin delegate under `harfbuzz`. Use `mergeVisualRects` for underline/strikeout/highlight/trace/group/control border/selection. Non-text particles stay outside the engine.

## 8. Canvas paths beyond the “big five”

**A (this phase):** `ctx.direction`, AbstractRichText family, Trace, Group, ControlBorder, Hyperlink/Sub/Superscript (engine rows via GlyphRenderer), basic float surround, DATE segment complete.  
**B (with P3):** List indent/marker side, LineBreak, Placeholder; LineNumber/PageNumber **side mirroring** → [DEFER-015](./rtl-deferred-todo.md#defer-015).  
**C:** page-level chrome / print. Plain-text chrome (watermark / page-number format / page-break label / image caption) uses `layoutPlainText` + `GlyphRenderer` via `drawPlainText` when HarfBuzz is ready; otherwise `fillText`. **LTR/RTL mode** `options.direction` (`ltr`|`rtl`, default `ltr`) mirrors editor UI chrome only (`ce-ui-rtl` class on the container — **never** `dir=rtl` on the canvas root, which breaks absolute caret hit-testing; toolbar/footer may set their own `dir`) and supplies the default `element.direction` for **newly created** lines/tables; it must **not** affect hit-testing or body paint, rewrite existing content direction, remirror undeclared tables, or reflow the text area on toggle. Separate from paragraph `executeDirection` / `defaultDirection`. Use `executeUiDirection`. Mode toggle visibility is controlled by `uiDirectionToggle` (default true).  
**D:** tables/controls → [deferred TODO](./rtl-deferred-todo.md). Main-path gaps also tracked there: DATE/LABEL vs GlyphRenderer [DEFER-023](./rtl-deferred-todo.md#defer-023); in-paragraph Control embeds [DEFER-024](./rtl-deferred-todo.md#defer-024); surround/column mixed-layout acceptance [DEFER-025](./rtl-deferred-todo.md#defer-025).

## 9. SVG

No DOM document SVG on trunk. Do **not** mirror LaTeX SVG paths for document RTL. Badge right anchor: [DEFER-005](./rtl-deferred-todo.md#defer-005). `feature/svg` branch: [DEFER-013](./rtl-deferred-todo.md#defer-013).

## 10. History

Snapshots remain; incremental command history is deferred ([DEFER-009](./rtl-deferred-todo.md#defer-009)).

## 11. Testing

Lock fonts for LTR regression under HB. Unit: bidi, clusters, caret, rect merge, FontManager. Cypress: Arabic ligature click/arrows, mixed runs, IME dir, Backspace/Delete caret, toolbar direction. CI must load WASM + font fixtures.

## 12. Roadmap

| Phase | Goal |
|-------|------|
| P0 | Docs (architecture, this design, deferred TODO) |
| P1 | Model fields + commands |
| P2 | Independent engine + HarfBuzz + adapters + switch |
| P3 | RTL + dual DOM caret + logical delete + decorations/lists |
| P4 | Mixed runs + start/end + surround |
| P5+ | See deferred TODO |

## 13. Links

- [Architecture](./architecture.md)
- [RTL deferred TODO](./rtl-deferred-todo.md)
- [Schema](./schema.md)
- [Option](./option.md)
