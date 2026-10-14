# Application bindings and exact selection

Applications own their document identities and review records. These commands attach neutral metadata to runtime elements; they do not authenticate an application, decide review or persist a document.

`command.getRuntimeElementList()` returns a clone of expanded elements in the active story/table-cell container. Each runtime text element contains a complete grapheme. Serialized `getValue()` may combine these elements, so serialized indices are not selection indices.

`command.setExternalElementBindings(bindings)` validates an entire batch before attaching `externalId` and cloned `extension` metadata. A binding specifies its story, optional stable table/row/cell identity path, runtime start/count and exact expected text. Stale ownership, changed text, overlapping spans and invalid bounds reject the whole batch. This command changes neither text, selection nor undo history. Applications should rebind after rebuilding their canonical view.

```ts
instance.command.setExternalElementBindings([{
  container: { zone: EditorZone.MAIN },
  startIndex: 1,
  count: 3,
  expectedText: 'abc',
  externalId: 'application-run',
  extension: { paragraph: 'application-paragraph' }
}])
```

For replacing content and binding it together, `executeSetValue(data, { externalBindings })` formats a cloned replacement first, validates all bindings against that replacement, then installs it through the existing set-value behavior. Invalid bindings leave content, selection and history unchanged. Each binding must address a story supplied in `data`. The normal successful set-value behavior still resets editor history; applications retaining canonical review/undo history own that history separately.

`getKeywordRangeList(keyword)` returns complete grapheme ranges using the cursor-before-selection convention. UTF-16 search offsets, combining text across formatting boundaries and case-fold expansions cannot select a partial grapheme. Repeated quotations remain separate occurrences. To select a returned cell range, set its position context before replacing the range:

```ts
const range = instance.command.getKeywordRangeList('🔔 é')[0]
if (range) {
  instance.command.executeSetPositionContext(range)
  instance.command.executeReplaceRange(range)
}
```

Applications must still validate their canonical source text, formatting and container ownership before applying a proposal. Binding supports nested stable cell paths; these changes do not add mixed-section pagination or programmatic selection restoration into arbitrary nested cells. Clipboard identity defaults are unchanged.
