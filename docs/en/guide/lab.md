# Lab

Experimental features live under the `lab` option and are **disabled by default**. They may change or be removed in future releases. Without any `lab` configuration, the editor behaves exactly as before, with zero additional overhead.

```typescript
new Editor(container, data, {
  lab: {
    incrementalCompute: true
  }
})
```

## incrementalCompute: Row-Level Incremental Layout

With `textEngine: 'harfbuzz'`, the same option enables paragraph-level reuse.
Joining and BiDi can affect the entire edited paragraph, so that paragraph is
recomputed in full while clean paragraphs reuse their rows and glyphs. Logical
indices and caret layouts are rebased after insertion or deletion.

This currently supports main-document plain text, superscripts, subscripts and
paragraph spacing. Pagination and positions are still computed in full. A single
very long paragraph still requires full paragraph layout on each edit. Documents
with lists, controls, tables, images, areas, columns or other complex structures
fall back to full layout. Formatting, configuration and cache changes also
invalidate reuse.

### What it solves

By default, every edit (e.g. typing a character) re-lays out the entire document from scratch: row computation, pagination, element coordinates and history snapshots are all full-document operations. At tens of thousands of elements, a single keystroke can exceed the 16ms frame budget and typing feels laggy.

With `incrementalCompute` enabled, row computation becomes incremental at row granularity:

- Every row records a snapshot of its starting state during layout (a resume point)
- An edit resumes layout only from the affected row and stops as soon as it converges with an existing row (typically 1-3 rows)
- Rows beyond the convergence point are reused as-is; page coordinates before the first changed page are reused from cache

On large documents or long paragraphs, per-keystroke latency can drop by an order of magnitude. Small documents are unaffected.

### Automatic fallback

Incremental layout is skipped and the editor falls back to full computation (identical behavior to the feature being off) when:

- Editing inside tables, controls, headers or footers
- The document contains floating/surrounding images or a multi-column layout
- The document contains an empty `minWidth` control (while placeholder elements exist)
- `maxPageNo` truncation occurred, or the layout changed (scale, margins, paper size, header/footer, etc.)

### Notes

- This feature only affects rendering performance, never layout results: the incremental path produces byte-identical results to the full path (guaranteed by differential tests)
- The API is experimental; option names and behavior may change in future versions

### For Contributors

Document elements must be mutated through the unified entry points so incremental layout can track changes:

- **Insert/remove elements**: `draw.spliceElementList` / `draw.deleteElementList` (dirty range recorded automatically)
- **In-place field writes**: `draw.setElementProperty(elements, { ... })` / `draw.deleteElementProperty(elements, [keys])` (next render is forced to full computation automatically)

Directly assigning or deleting structural element fields (listId, titleId, rowFlex, etc.) bypasses dirty-range tracking and causes stale row reuse — always use the accessors instead. Pure in-place edits (no splices) always fall back to full computation anyway, so calling the accessors is never harmful.
