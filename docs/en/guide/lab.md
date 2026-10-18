# Lab

Experimental options live under `lab` and are disabled by default. All text uses
HarfBuzz; enabling an experimental option never selects a different engine.

```typescript
const editor = await Editor.create(container, data, {
  lab: { incrementalCompute: true }
})
```

## incrementalCompute: native paragraph reuse

The edited paragraph is recomputed in full because BiDi/contextual shaping may
affect its whole content. Unchanged paragraphs can reuse native results with
relative source indices, rebased glyphs, clusters, carets and object anchors.
Table cells have separate scopes; list numbering is regenerated from current data.

Every pass still scans content and recomputes flow, pagination, columns, floats,
table fragments and positions. It does not reuse old row objects, resume
snapshots or partial page-position slices. Editing a single very long paragraph
still requires full paragraph layout; no 1–3-row convergence or order-of-magnitude
speedup is promised.

Cache keys include content/styles, source identity, font revision, spacing,
available width and per-line flow constraints. Changed inputs invalidate reuse;
field writes, history restoration and font registration cause appropriate full
invalidation. Cache misses or disabling the option use full HarfBuzz layout.
There is no browser/legacy fallback. Performance evaluation remains in T23;
current differential checks establish layout consistency, not a speed guarantee.

Internal contributors should mutate through spliceElementList/deleteElementList
and setElementProperty/deleteElementProperty so dirty ranges and invalidation
remain accurate. External integrations should use public commands rather than
internal Draw objects or snapshot structures.
