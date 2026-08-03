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

Main-body bidirectional layout, HarfBuzz shaping, independent `text-engine` + host adapters, dual DOM caret, logical delete, rich-text decorations/list mirroring, start/end alignment and float surround (P1–P4). Tables/header-footer wiring, incremental history, glyph atlas, etc. are listed below.

## Checklist

### P1

- [ ] [DEFER-001](#defer-001) Table cell text via text-engine (P5)
- [ ] [DEFER-004](#defer-004) Header/Footer zone wiring (P5)
- [ ] [DEFER-009](#defer-009) Incremental command history (P7)
- [ ] [DEFER-010](#defer-010) Glyph atlas / dirty-span cache / perf (P6)

### P2

- [ ] [DEFER-002](#defer-002) Table geometry / border / slash RTL mirroring (P5+)
- [ ] [DEFER-003](#defer-003) TableTool drag and `style.left` (P5+)
- [ ] [DEFER-005](#defer-005) Badge `right` / `horizontalAnchor` (P5)
- [ ] [DEFER-006](#defer-006) Complex Control flex / ControlIndentation
- [ ] [DEFER-007](#defer-007) ControlSearch / nested control RTL
- [ ] [DEFER-016](#defer-016) Remove legacy path and `mapToLegacyRow`
- [ ] [DEFER-018](#defer-018) Accessibility and RTL reading order
- [ ] [DEFER-019](#defer-019) Full HTML/clipboard `dir` fidelity
- [ ] [DEFER-021](#defer-021) Mobile / `beforeinput` delete path

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

## Roadmap mapping

| Roadmap | Primary DEFERs |
|---------|----------------|
| P5 | 001, 002, 003, 004, 005, 008 |
| P6 | 010 |
| P7 | 009 |
| Special tracks | 006, 007, 011–022 |

---

## Details

### DEFER-001

- Status: pending
- Priority: P1
- Depends: Stable P2 LayoutHostAdapter
- Area: table
- Notes: Cell **content** reuses text-engine adapter; table chrome may stay LTR. Accept Arabic mixed text and caret inside td.

### DEFER-002

- Status: pending
- Priority: P2
- Depends: DEFER-001; product decision on full-table mirroring
- Area: table
- Notes: Column accumulation, borders, diagonal lines vs document direction.

### DEFER-003

- Status: pending
- Priority: P2
- Depends: DEFER-002
- Area: table
- Notes: TableTool `style.left` and column resize under RTL.

### DEFER-004

- Status: pending
- Priority: P1
- Depends: P2/P3 main-body engine
- Area: zone
- Notes: Wire and accept Header/Footer with the same engine as main.

### DEFER-005

- Status: pending
- Priority: P2
- Depends: —
- Area: frame
- Notes: Badge only has `left` today; add `right` or `horizontalAnchor`.

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
- Notes: LineNumber / PageNumber default side or rowFlex follows document direction.

### DEFER-016

- Status: pending
- Priority: P2
- Depends: Stable harfbuzz path and green regression
- Area: architecture
- Notes: Remove `textEngine: legacy` and `mapToLegacyRow`.

### DEFER-017

- Status: pending
- Priority: P3
- Depends: Product need
- Area: collab
- Notes: OT/CRDT; may be cancelled if not required.

### DEFER-018

- Status: pending
- Priority: P2
- Depends: Stable P3 visual order
- Area: a11y
- Notes: Accessibility module vs RTL reading/speech order.

### DEFER-019

- Status: pending
- Priority: P2
- Depends: P1 direction field
- Area: clipboard
- Notes: Full HTML/clipboard `dir` round-trip edge cases.

### DEFER-020

- Status: pending
- Priority: P3
- Depends: —
- Area: print
- Notes: Print iframe embedded Block vs RTL page margins.

### DEFER-021

- Status: pending
- Priority: P2
- Depends: Mobile evidence that keydown is insufficient
- Area: input
- Notes: Current phase uses keydown Backspace/Delete; add `beforeinput` path if required.

### DEFER-022

- Status: pending
- Priority: P3
- Depends: Product request
- Area: input
- Notes: Default is logical delete; optional visual-adjacent delete mode.
