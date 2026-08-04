# RTL Deferred TODO

> Track work **not** in the current phase (main-body RTL + independent text-engine + HarfBuzz) so nothing is lost.  
> Current scope: [RTL layout design](./rtl-layout-design.md). Baseline: [Architecture](./architecture.md).

## Maintenance rules

1. Newly deferred items must get a `DEFER-xxx` entry here — not only in chat/PRs.
2. When done: check the summary list, set Status=`done`, link the PR/commit.
3. If something slips out of the current phase, update this file and cross-link from the design doc.
4. **This file is the source of truth** for deferred RTL work.

## Entry template

```markdown
### DEFER-xxx Title
- Status: pending | in-progress | done | cancelled
- Priority: P1 | P2 | P3
- Depends: ...
- Area: table | control | history | performance | svg-ui | a11y | input | ...
- Notes: ...
```

## Current-phase summary

Main-body bidirectional layout, HarfBuzz shaping, independent `text-engine` + host adapters, dual DOM caret, logical delete, rich-text decorations/list mirroring, start/end alignment and float surround (P1–P4). Tables/header-footer wiring, incremental history, glyph atlas, plus main-path gaps still open (DATE/LABEL, in-paragraph controls, surround/column mixed layout) are listed below.

## Checklist

### P1

- [x] [DEFER-001](#defer-001) Table cell text via text-engine (P5)
- [x] [DEFER-004](#defer-004) Header/Footer zone wiring (P5)
- [ ] [DEFER-009](#defer-009) Incremental command history (P7)
- [ ] [DEFER-010](#defer-010) Glyph atlas / dirty-span cache / perf (P6)

### P2

- [x] [DEFER-002](#defer-002) Table geometry / border / slash RTL mirroring (P5+)
- [x] [DEFER-003](#defer-003) TableTool drag and `style.left` (P5+)
- [x] [DEFER-005](#defer-005) Badge `right` / `horizontalAnchor` (P5)
- [ ] [DEFER-006](#defer-006) Complex Control flex / ControlIndentation
- [ ] [DEFER-007](#defer-007) ControlSearch / nested control RTL
- [ ] [DEFER-016](#defer-016) Remove legacy path and `mapToLegacyRow`
- [x] [DEFER-018](#defer-018) Accessibility and RTL reading order
- [x] [DEFER-019](#defer-019) Full HTML/clipboard `dir` fidelity
- [x] [DEFER-021](#defer-021) Mobile / `beforeinput` delete path
- [x] [DEFER-023](#defer-023) Align DATE / LABEL with GlyphRenderer (same pattern as hyperlink fix)
- [x] [DEFER-024](#defer-024) In-paragraph Control/Checkbox/Radio embeds and positionList sync

### P3

- [ ] [DEFER-008](#defer-008) In-table Area background and hit-testing
- [ ] [DEFER-011](#defer-011) Arabic kashida for justify
- [ ] [DEFER-012](#defer-012) ICU ubidi WASM if JS bidi is insufficient
- [ ] [DEFER-013](#defer-013) `feature/svg` branch RTL review
- [ ] [DEFER-014](#defer-014) Demo/toolbar directional icon mirroring
- [ ] [DEFER-015](#defer-015) LineNumber / PageNumber side follows document direction
- [ ] [DEFER-017](#defer-017) OT/CRDT collaboration (if needed)
- [ ] [DEFER-020](#defer-020) Print iframe Block + RTL page edges
- [ ] [DEFER-022](#defer-022) Visual-adjacent delete mode
- [ ] [DEFER-025](#defer-025) Surround image / multi-column + text-engine mixed-layout acceptance

## Roadmap mapping

| Roadmap | Primary DEFERs |
|---------|----------------|
| P5 | 001, 002, 003, 004, 005, 008 |
| P6 | 010 |
| P7 | 009 |
| Special tracks | 006, 007, 011–025 |

---

## Details

### DEFER-001

- Status: done
- Priority: P1
- Depends: Stable P2 LayoutHostAdapter
- Area: table
- Notes: Cell **content** uses text-engine (`layoutScope: td:{id}`); table chrome stays `forceLegacy`. Accept Arabic mixed text and caret inside td. DEFER-009/010 remain pending.

### DEFER-002

- Status: done
- Priority: P2
- Depends: DEFER-001; product decision → **mirror full table**
- Area: table
- Notes: Flip `td.x` only when table `element.direction===rtl`; `colIndex` stays logical. LTR/RTL mode does not participate. See `isTableMirrored`.

### DEFER-003

- Status: done
- Priority: P2
- Depends: DEFER-002
- Area: table
- Notes: TableTool row tools / select on start side, add-col on end side; overflow start-edge and dx adapted when mirrored.

### DEFER-004

- Status: done
- Priority: P1
- Depends: P2/P3 main-body engine
- Area: zone
- Notes: Header/Footer/`main` isolate `lastLayouts` via `layoutScope`; left/right arrow `visualNeighbor` scoped by zone/td.

### DEFER-005

- Status: done
- Priority: P2
- Depends: —
- Area: frame
- Notes: `IBadge` / `IBadgeOption` add physical `right` (>=0 overrides left; default -1 unset). No `horizontalAnchor`.

### DEFER-006

- Status: pending
- Priority: P2
- Depends: Main-body ControlBorder (current phase)
- Area: control
- Notes: Inner control flex and `ControlIndentation.VALUE_START` LTR assumptions.

### DEFER-007

- Status: pending
- Priority: P2
- Depends: DEFER-006
- Area: control
- Notes: ControlSearch highlights and nested bidirectional text.

### DEFER-008

- Status: pending
- Priority: P3
- Depends: DEFER-001
- Area: table
- Notes: In-table Area background and hit geometry.

### DEFER-009

- Status: pending
- Priority: P1
- Depends: —
- Area: history
- Notes: `ICommand` execute/undo/merge, typing coalescing, pako baseline; `historyMode: snapshot | command`. Decoupled from RTL but must not be forgotten.

### DEFER-010

- Status: pending
- Priority: P1
- Depends: P2 GlyphRenderer
- Area: performance
- Notes: Glyph atlas, dirty-span LayoutCache, large-doc FPS/memory targets.

### DEFER-011

- Status: pending
- Priority: P3
- Depends: P4 Alignment
- Area: layout
- Notes: Arabic kashida for justify; keep an extension point in the engine.

### DEFER-012

- Status: pending
- Priority: P3
- Depends: Gaps in first-phase bidi-js
- Area: bidi
- Notes: ICU ubidi WASM to strengthen BidiResolver.

### DEFER-013

- Status: pending
- Priority: P3
- Depends: Merging `feature/svg`
- Area: svg-ui
- Notes: Trunk has no DOM document SVG; evaluate `dir`/coords when that branch lands.

### DEFER-014

- Status: pending
- Priority: P3
- Depends: —
- Area: svg-ui
- Notes: Mirror directional toolbar/menu SVG icons via logical CSS or `scaleX(-1)`.

### DEFER-015

- Status: pending
- Priority: P3
- Depends: P3 paragraph mirroring if unfinished
- Area: frame
- Notes: LineNumber / PageNumber default side or rowFlex follows document direction. Page-number **drawing** already uses `drawPlainText` (BiDi/joining); this item is only physical side / alignment mirroring.

### DEFER-016

- Status: pending
- Priority: P2
- Depends: Stable harfbuzz path and green regression
- Area: architecture
- Notes: Remove `textEngine: legacy` and `mapToLegacyRow`. Interim main-body TABLE/IMAGE rows use `forceLegacy` inserts; keep mixed-layout regressions green before full removal.

### DEFER-017

- Status: pending
- Priority: P3
- Depends: Product need
- Area: collab
- Notes: OT/CRDT; may be cancelled if not required.

### DEFER-018

- Status: done
- Priority: P2
- Depends: Stable P3 visual order
- Area: a11y
- Notes: Live region `dir` from paragraph → defaultDirection → UI `options.direction`; announce text stays logical order.

### DEFER-019

- Status: done
- Priority: P2
- Depends: P1 direction field
- Area: clipboard
- Notes: Export writes `dir` from `element.direction`; import reads `dir`/`style.direction`. Separate from UI `options.direction`.

### DEFER-020

- Status: pending
- Priority: P3
- Depends: —
- Area: print
- Notes: Print iframe embedded Block vs RTL page margins.

### DEFER-021

- Status: done
- Priority: P2
- Depends: Mobile evidence that keydown is insufficient
- Area: input
- Notes: `CursorAgent` `beforeinput` `deleteContentBackward/Forward` → existing keydown delete; dedupe with keydown.

### DEFER-022

- Status: pending
- Priority: P3
- Depends: Product request
- Area: input
- Notes: Default is logical delete; optional visual-adjacent delete mode.

### DEFER-023

- Status: done
- Priority: P2
- Depends: Main-body GlyphRenderer / hyperlink fix pattern
- Area: draw
- Notes: DATE/LABEL skip text Particle on engine rows; GlyphRenderer paints text; LABEL keeps `renderBackground`; Bridge/`_syncEngineLineStyles`/`ensureDefaults` sync label color. Full padding parity with legacy is a follow-up.

### DEFER-024

- Status: done
- Priority: P2
- Depends: ElementBridge paragraph scan; related to but distinct from DEFER-006
- Area: control
- Notes: CHECKBOX/RADIO use `\uFFFC` + `objectWidth` slots; CONTROL chrome is text-like; GlyphRenderer skips objects; Particles still paint widgets.

### DEFER-025

- Status: pending
- Priority: P3
- Depends: Main-body IMAGE/TABLE `forceLegacy` insert already landed
- Area: layout
- Notes: SURROUND/FLOAT_* images and multi-column + text-engine only have basic inserts; no dedicated geometry/availableWidth/paging acceptance. Cover surround reservation vs engine `availableWidth`, `columnIndex` after column switches, float hit-testing and reflow.
