# Features

canvas-editor provides a complete Word-like document editing experience, organized into six layers by use case: **Text Editing** → **Content Elements** → **Advanced** → **Page Setup** → **Extensibility** → **API**.

<div class="stats">
  <div class="stat"><b>19</b><span>Element types</span></div>
  <div class="stat"><b>6</b><span>Form controls</span></div>
  <div class="stat"><b>8</b><span>Editor modes</span></div>
  <div class="stat"><b>154+</b><span>Command APIs</span></div>
  <div class="stat"><b>16+</b><span>Events</span></div>
  <div class="stat"><b>8</b><span>Official plugins</span></div>
</div>

<style>
.stats {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  margin: 18px 0 28px;
  padding: 18px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}
@media (max-width: 768px) {
  .stats { grid-template-columns: repeat(3, 1fr); }
}
.stats .stat {
  text-align: center;
}
.stats .stat b {
  display: block;
  font-size: 1.7em;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  line-height: 1.2;
}
.stats .stat span {
  font-size: 0.78em;
  color: var(--vp-c-text-2);
}
.feat {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr));
  gap: 10px;
  margin: 14px 0 22px;
}
.feat .it {
  padding: 10px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  transition: border-color 0.25s, transform 0.25s, box-shadow 0.25s;
}
.feat .it:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}
.feat .it b {
  display: block;
  font-size: 0.95em;
  margin-bottom: 2px;
  color: var(--vp-c-text-1);
}
.feat .it span {
  font-size: 0.85em;
  color: var(--vp-c-text-2);
  line-height: 1.55;
}
</style>

## Text Editing <Badge type="info" text="31" />

Character-level and inline text capabilities.

### Rich Text

<div class="feat">
  <div class="it"><b>Font family</b><span>Switch font family</span></div>
  <div class="it"><b>Font size</b><span>Size, increase / decrease, configurable min / max bounds</span></div>
  <div class="it"><b>Text color</b><span>Set text color</span></div>
  <div class="it"><b>Text highlight</b><span>Background highlight color</span></div>
  <div class="it"><b>Bold / Italic</b><span>Bold, italic</span></div>
  <div class="it"><b>Underline / Strikethrough</b><span>Underline, strikethrough</span></div>
  <div class="it"><b>Superscript / Subscript</b><span>Superscript, subscript</span></div>
  <div class="it"><b>Decoration style</b><span>Underline / strikethrough styles (solid, double, dashed, dotted, wavy)</span></div>
  <div class="it"><b>Alignment</b><span>Left, center, right, justified, distributed</span></div>
  <div class="it"><b>Line spacing</b><span>Paragraph line spacing (rowMargin)</span></div>
  <div class="it"><b>Indent</b><span>First-line indent, Tab indent</span></div>
  <div class="it"><b>Word break</b><span>break-all / break-word</span></div>
  <div class="it"><b>Heading</b><span>H1 – H6, per-level size</span></div>
  <div class="it"><b>Heading rules</b><span>deletable, disabled, conceptId linking</span></div>
  <div class="it"><b>Ordered / Unordered list</b><span>Ordered, unordered (disc / circle / square)</span></div>
  <div class="it"><b>Checkbox list</b><span>Built-in checkbox per list item</span></div>
  <div class="it"><b>List inherit-style</b><span>List markers inherit surrounding text formatting</span></div>
</div>

### Editing Operations

<div class="feat">
  <div class="it"><b>Clipboard</b><span>Cut, copy, paste, select all</span></div>
  <div class="it"><b>History</b><span>Undo, redo (configurable max record count)</span></div>
  <div class="it"><b>Format tools</b><span>Format painter (copy / apply style), clear formatting</span></div>
  <div class="it"><b>Forward delete</b><span>Backspace delete</span></div>
  <div class="it"><b>Text tools</b><span>Remove empty lines, remove leading spaces</span></div>
</div>

### Elements

<div class="feat">
  <div class="it"><b>Text & tab</b><span>Text element, tab</span></div>
  <div class="it"><b>Sup/Sub elements</b><span>Superscript, subscript element types</span></div>
  <div class="it"><b>Complex elements</b><span>Image, table, hyperlink, separator, page break, LaTeX, date, content block</span></div>
  <div class="it"><b>Structural elements</b><span>Heading, list, label, area, control, checkbox, radio</span></div>
  <div class="it"><b>Element CRUD</b><span>Add / delete / update / get by id or conceptId</span></div>
  <div class="it"><b>Bulk insert</b><span>Insert element list, append element list</span></div>
</div>

### Search & Replace

<div class="feat">
  <div class="it"><b>Search</b><span>Keyword search, previous / next, match count</span></div>
  <div class="it"><b>Search options</b><span>Regex, ignore case, in-selection</span></div>
  <div class="it"><b>Replace</b><span>Single replace, keyword range query, keyword context</span></div>
</div>

## Content Elements <Badge type="info" text="29" />

Block-level content objects in the document.

### Table

<div class="feat">
  <div class="it"><b>Row & column ops</b><span>Add / delete rows & columns, select all</span></div>
  <div class="it"><b>Merge cells</b><span>Merge cells</span></div>
  <div class="it"><b>Split cells</b><span>Vertical / horizontal split</span></div>
  <div class="it"><b>Rowspan & colspan</b><span>rowspan, colspan</span></div>
  <div class="it"><b>Repeat header</b><span>pagingRepeat across pages</span></div>
  <div class="it"><b>Border type</b><span>all / empty / external / internal / dash, border color</span></div>
  <div class="it"><b>Cell borders</b><span>top / bottom / left / right independently</span></div>
  <div class="it"><b>Cell diagonal</b><span>forward / reverse diagonal</span></div>
  <div class="it"><b>Background fill</b><span>Cell background color</span></div>
  <div class="it"><b>Vertical align</b><span>top / center / bottom</span></div>
  <div class="it"><b>Auto fit</b><span>Fit to content, fit to page width</span></div>
  <div class="it"><b>Overflow control</b><span>overflow config</span></div>
</div>

### Image

<div class="feat">
  <div class="it"><b>Insert image</b><span>Insert, width / height, display mode</span></div>
  <div class="it"><b>Replace / Save as</b><span>Replace image element, save as image</span></div>
  <div class="it"><b>Display mode</b><span>Inline, block, surround, float above, behind (5 modes)</span></div>
  <div class="it"><b>Crop</b><span>Crop region (origin x/y + width/height)</span></div>
  <div class="it"><b>Caption</b><span>Caption text (supports {imageNo} placeholder), color, font, size, spacing</span></div>
  <div class="it"><b>Previewer</b><span>Image preview (png / jpg / jpeg / svg)</span></div>
  <div class="it"><b>Drag float image</b><span>Float preview while dragging, disableable</span></div>
</div>

### Hyperlink

<div class="feat">
  <div class="it"><b>Insert / Edit</b><span>Insert hyperlink, edit URL</span></div>
  <div class="it"><b>Delete / Cancel</b><span>Delete hyperlink, cancel hyperlink</span></div>
</div>

### Formula

<div class="feat">
  <div class="it"><b>LaTeX</b><span>LaTeX syntax rendered as inline SVG</span></div>
</div>

### Date

<div class="feat">
  <div class="it"><b>Date format</b><span>Custom date format (e.g. yyyy-MM-dd)</span></div>
  <div class="it"><b>Picker mode</b><span>date / month / year granularity</span></div>
</div>

### Content Block

<div class="feat">
  <div class="it"><b>iframe</b><span>Embed web page (src / srcdoc / sandbox / allow)</span></div>
  <div class="it"><b>video</b><span>Embed video (src)</span></div>
</div>

### Separator

<div class="feat">
  <div class="it"><b>Separator style</b><span>Solid / dashed / dotted, dash array, line width, color</span></div>
</div>

### Page Break

<div class="feat">
  <div class="it"><b>Paginate</b><span>Insert page break</span></div>
  <div class="it"><b>Per-section direction</b><span>Page break as section boundary, following pages can have independent direction</span></div>
</div>

## Advanced <Badge type="info" text="33" />

Professional scenarios such as forms, automation, and collaboration.

### Controls

<div class="feat">
  <div class="it"><b>Control types</b><span>Text, number, select, radio, checkbox, date — 6 types</span></div>
  <div class="it"><b>Number calculator</b><span>Built-in calculator buttons for number control</span></div>
  <div class="it"><b>Select multi-select</b><span>Select control supports multi-select (custom delimiter)</span></div>
  <div class="it"><b>Date picker mode</b><span>date / month / year granularity</span></div>
  <div class="it"><b>Placeholder & prefix/suffix</b><span>placeholder, preText / postText</span></div>
  <div class="it"><b>Default & disabled</b><span>Default value, disabled</span></div>
  <div class="it"><b>Indent alignment</b><span>rowStart / valueStart indentation</span></div>
  <div class="it"><b>Nested control</b><span>Nest other controls inside a control</span></div>
  <div class="it"><b>Extension data</b><span>setControlExtension custom metadata</span></div>
  <div class="it"><b>Bulk set</b><span>Bulk set value / extension / attributes</span></div>
  <div class="it"><b>Keyword highlight</b><span>setControlHighlight rule-based highlight</span></div>
  <div class="it"><b>Locate & jump</b><span>Locate active control, prev / next jump</span></div>
  <div class="it"><b>Active / inactive state</b><span>active / inactive state switch</span></div>
  <div class="it"><b>Form mode</b><span>Only editable inside controls</span></div>
</div>

### Cascade & Computation

<div class="feat">
  <div class="it"><b>Cascade</b><span>Control value change cascades visibility, required, editable, deletable of other controls / titles</span></div>
  <div class="it"><b>Compute</b><span><code>compute</code> expression (Excel-formula mode, auto-recalculation writeback)</span></div>
</div>

### Control Validation

<div class="feat">
  <div class="it"><b>Validation rules</b><span>Required, length (min / max), number range, integer / precision, date range, multi-select count</span></div>
  <div class="it"><b>Error feedback</b><span>Highlight on failure, custom error message</span></div>
  <div class="it"><b>Clear validation</b><span>Clear validated state</span></div>
</div>

### Trace & Compare

<div class="feat">
  <div class="it"><b>Trace mode</b><span>Underline for additions, strikethrough for deletions</span></div>
  <div class="it"><b>Author tag</b><span>Tag author on each modification</span></div>
  <div class="it"><b>Version compare</b><span>Compare two document versions, diff shown in trace mode</span></div>
</div>

### Macro

<div class="feat">
  <div class="it"><b>Recorded macro</b><span>Record <code>execute*</code> commands, serialize to JSON, replay</span></div>
  <div class="it"><b>Script macro</b><span>Register custom JS functions (condition / loop / async / read data)</span></div>
</div>

### Group

<div class="feat">
  <div class="it"><b>Group ops</b><span>Set group, delete group, locate group</span></div>
  <div class="it"><b>Group ID query</b><span>Get all groupIds</span></div>
</div>

### Area

<div class="feat">
  <div class="it"><b>Area ops</b><span>Insert, set properties, delete, locate</span></div>
  <div class="it"><b>Area value</b><span>Set value, get value</span></div>
  <div class="it"><b>Independent mode</b><span>Area can have its own mode (edit / readonly / form)</span></div>
</div>

### Badge

<div class="feat">
  <div class="it"><b>Main badge</b><span>Badge marker on main zone</span></div>
  <div class="it"><b>Area badge</b><span>Badge marker on area</span></div>
</div>

### Catalog

<div class="feat">
  <div class="it"><b>Catalog generation</b><span>Auto-generate catalog (TOC) from headings</span></div>
  <div class="it"><b>Locate & value</b><span>Click to locate, get heading value</span></div>
</div>

## Page Setup <Badge type="info" text="19" />

Page-level configuration and document appearance.

### Editor Modes

<div class="feat">
  <div class="it"><b>8 modes</b><span>Edit, clean, readonly, form, print, design, graffiti, trace</span></div>
  <div class="it"><b>Mode rules</b><span>Print (hide background / empty controls / areas), readonly (disable image preview), form (controls undeletable)</span></div>
</div>

### Page & Layout

<div class="feat">
  <div class="it"><b>Paginate / continuous</b><span>paging / continuity page modes</span></div>
  <div class="it"><b>Page zoom</b><span>Zoom in, out, reset</span></div>
  <div class="it"><b>Page border</b><span>Border color, line width, padding</span></div>
  <div class="it"><b>Paper size</b><span>Custom width / height</span></div>
  <div class="it"><b>Paper direction</b><span>Portrait / landscape (global / per-section)</span></div>
  <div class="it"><b>Margins</b><span>Top / right / bottom / left</span></div>
  <div class="it"><b>Inactive zone alpha</b><span>inactiveAlpha non-active zone transparency</span></div>
</div>

### Columns

<div class="feat">
  <div class="it"><b>Column config</b><span>Column count, spacing, separator</span></div>
</div>

### Header / Footer / Page Number

<div class="feat">
  <div class="it"><b>Zone switch</b><span>Header / main / footer switching</span></div>
  <div class="it"><b>Inactive alpha</b><span>Non-active zone transparency</span></div>
  <div class="it"><b>Click-to-edit tip</b><span>Header/footer tip (disableable)</span></div>
  <div class="it"><b>Page number format</b><span>Format, number type (Arabic / Chinese)</span></div>
  <div class="it"><b>Page number range</b><span>Start number, displayed / max page number</span></div>
</div>

### Background & Watermark

<div class="feat">
  <div class="it"><b>Background color</b><span>Solid color</span></div>
  <div class="it"><b>Background image</b><span>contain / cover, repeat mode, apply to specific pages</span></div>
  <div class="it"><b>Text watermark</b><span>Color, opacity, size, repeat toggle, spacing, layer (top / bottom)</span></div>
  <div class="it"><b>Image watermark</b><span>Image as watermark</span></div>
</div>

## Extensibility <Badge type="info" text="44" />

Developer integration, extension mechanisms, and runtime capabilities.

### Event Listening

<div class="feat">
  <div class="it"><b>listener</b><span>Single-callback listening (direct assignment)</span></div>
  <div class="it"><b>eventBus</b><span>Pub/sub (multi-listener), covering contentChange / rangeChange / rangeStyleChange / controlChange / controlContentChange / saved / pageSizeChange / pageScaleChange / pageModeChange / zoneChange / positionContextChange / imageSizeChange / imageMousedown / imageDblclick / labelMousedown / visiblePageNoListChange / intersectionPageNoChange and more (16+)</span></div>
  <div class="it"><b>Interaction events</b><span>Mouse move / enter / leave / down / up / click, scroll</span></div>
</div>

### Override Methods

<div class="feat">
  <div class="it"><b>Method intercept</b><span>Intercept / override paste, paste image, copy, drag-drop default behavior</span></div>
</div>

### Internationalization

<div class="feat">
  <div class="it"><b>Multi-language</b><span>Built-in zh-CN / en, extendable to other languages</span></div>
  <div class="it"><b>Message override</b><span>Override built-in messages like validation</span></div>
</div>

### Plugin

<div class="feat">
  <div class="it"><b>Plugin mechanism</b><span><code>instance.use(plugin)</code> to register custom plugins</span></div>
  <div class="it"><b>Barcode</b><span>barcode1d plugin</span></div>
  <div class="it"><b>QR code</b><span>barcode2d plugin</span></div>
  <div class="it"><b>Code block</b><span>codeblock plugin</span></div>
  <div class="it"><b>Word import/export</b><span>docx plugin</span></div>
  <div class="it"><b>Excel import</b><span>excel plugin</span></div>
  <div class="it"><b>Floating toolbar</b><span>floating-toolbar plugin</span></div>
  <div class="it"><b>Flowchart</b><span>diagram plugin</span></div>
  <div class="it"><b>Case conversion</b><span>case plugin</span></div>
</div>

### Configuration & Customization

<div class="feat">
  <div class="it"><b>Per-letter extension</b><span>letterClass attaches a CSS class to each letter (typewriter animation, etc.)</span></div>
  <div class="it"><b>White-space glyphs</b><span>Show space / tab characters</span></div>
  <div class="it"><b>Line-break markers</b><span>Show line-break markers</span></div>
  <div class="it"><b>Context menu</b><span>Custom / disable items, sub-menus</span></div>
  <div class="it"><b>Shortcuts</b><span>Custom override / disable shortcuts</span></div>
  <div class="it"><b>Selection style</b><span>Selection color / alpha / min width</span></div>
  <div class="it"><b>Search-match color</b><span>Current match vs navigate-match color</span></div>
  <div class="it"><b>Resize handle</b><span>Handle color / size</span></div>
  <div class="it"><b>Drag cursor</b><span>Drag cursor width / color</span></div>
  <div class="it"><b>History limit</b><span>historyMaxRecordCount</span></div>
  <div class="it"><b>Page-outer selection disable</b><span>pageOuterSelectionDisable</span></div>
  <div class="it"><b>Font-size bounds</b><span>minSize / maxSize</span></div>
  <div class="it"><b>Hot-update options</b><span><code>updateOptions</code> without remount</span></div>
  <div class="it"><b>Command interceptor</b><span><code>setInterceptor</code> intercepts every command call (analytics / audit)</span></div>
</div>

### Print & Export

<div class="feat">
  <div class="it"><b>Print</b><span>Canvas-to-image printing, configurable pixel ratio</span></div>
  <div class="it"><b>Image export</b><span>Page image base64</span></div>
  <div class="it"><b>HTML import/export</b><span>HTML import / export</span></div>
  <div class="it"><b>Plain text export</b><span>Plain text and data serialization</span></div>
  <div class="it"><b>Word count</b><span>Async via Web Worker</span></div>
  <div class="it"><b>Plugin extensions</b><span>Word (docx), Excel, PDF</span></div>
</div>

### Performance

<div class="feat">
  <div class="it"><b>Web Worker</b><span>Word count, catalog generation, group extraction, async value — 4 in total</span></div>
  <div class="it"><b>Render modes</b><span>Fast mode (multi-char group), compatible mode (per-char render)</span></div>
</div>

### Accessibility

<div class="feat">
  <div class="it"><b>Accessibility</b><span>accessibility support</span></div>
  <div class="it"><b>Ruler</b><span>Toggleable ruler</span></div>
  <div class="it"><b>Line number</b><span>Per-page / continuous</span></div>
  <div class="it"><b>Magnifier</b><span>Configurable zoom, border, size</span></div>
  <div class="it"><b>Placeholder</b><span>placeholder hint</span></div>
  <div class="it"><b>Mask margins</b><span>maskMargin covers margin area</span></div>
  <div class="it"><b>Devtools</b><span>devtools debug panel</span></div>
</div>

## API <Badge type="info" text="56" />

Developer command interface (<code>instance.command.\*</code>), grouped by responsibility.

### Data API

<div class="feat">
  <div class="it"><b>Data access</b><span><code>getValue</code> / <code>setValue</code></span></div>
  <div class="it"><b>Async value</b><span><code>getValueAsync</code> (via Web Worker)</span></div>
  <div class="it"><b>HTML access</b><span><code>getHTML</code> / <code>setHTML</code></span></div>
  <div class="it"><b>Text & image</b><span><code>getText</code>, <code>getImage</code></span></div>
  <div class="it"><b>Options & locale</b><span><code>getOptions</code> / <code>updateOptions</code>, <code>getLocale</code> / <code>executeSetLocale</code></span></div>
  <div class="it"><b>Word count</b><span><code>getWordCount</code></span></div>
</div>

### Element API

<div class="feat">
  <div class="it"><b>Query</b><span><code>getElementById</code> (by id / conceptId)</span></div>
  <div class="it"><b>Mutate & delete</b><span><code>executeUpdateElementById</code>, <code>executeDeleteElementById</code></span></div>
  <div class="it"><b>Insert & append</b><span><code>executeInsertElementList</code>, <code>executeAppendElementList</code></span></div>
  <div class="it"><b>Title & control</b><span><code>executeInsertTitle</code>, <code>executeInsertControl</code>, <code>executeRemoveControl</code></span></div>
</div>

### Range API

<div class="feat">
  <div class="it"><b>Range operations</b><span><code>getRange</code> / <code>executeSetRange</code> / <code>executeReplaceRange</code></span></div>
  <div class="it"><b>Range queries</b><span><code>getRangeText</code>, <code>getRangeContext</code>, <code>getRangeRow</code>, <code>getRangeParagraph</code></span></div>
  <div class="it"><b>Keyword</b><span><code>getKeywordRangeList</code>, <code>getKeywordContext</code></span></div>
</div>

### Position API

<div class="feat">
  <div class="it"><b>Cursor position</b><span><code>getCursorPosition</code></span></div>
  <div class="it"><b>Position context</b><span><code>executeSetPositionContext</code>, <code>getPositionContextByEvent</code></span></div>
  <div class="it"><b>Search navigation</b><span><code>getSearchNavigateInfo</code> (current match info)</span></div>
</div>

### Structure Data API

<div class="feat">
  <div class="it"><b>Control</b><span><code>getControlValue</code>, <code>getControlList</code></span></div>
  <div class="it"><b>Area</b><span><code>getAreaValue</code></span></div>
  <div class="it"><b>Group</b><span><code>getGroupIds</code></span></div>
  <div class="it"><b>Catalog & title</b><span><code>getCatalog</code>, <code>getTitleValue</code></span></div>
  <div class="it"><b>Page</b><span><code>getPaperMargin</code>, <code>getColumns</code></span></div>
</div>

### Measure API

<div class="feat">
  <div class="it"><b>Height calc</b><span><code>computeElementListHeight</code> (occupied height), <code>getRemainingContentHeight</code> (remaining page height)</span></div>
</div>

### Render & Focus

<div class="feat">
  <div class="it"><b>Force re-render</b><span><code>executeForceUpdate</code></span></div>
  <div class="it"><b>Focus control</b><span><code>executeFocus</code>, <code>executeBlur</code>, <code>executeHideCursor</code></span></div>
  <div class="it"><b>Container</b><span><code>getContainer</code> (editor DOM container)</span></div>
</div>

### History & Clipboard

<div class="feat">
  <div class="it"><b>Undo / Redo</b><span><code>executeUndo</code>, <code>executeRedo</code></span></div>
  <div class="it"><b>Clipboard</b><span><code>executeCut</code>, <code>executeCopy</code>, <code>executePaste</code></span></div>
  <div class="it"><b>Selection & delete</b><span><code>executeSelectAll</code>, <code>executeBackspace</code></span></div>
  <div class="it"><b>Text tools</b><span><code>executeWordTool</code></span></div>
</div>

### Format Commands

<div class="feat">
  <div class="it"><b>Format painter</b><span><code>executePainter</code>, <code>executeApplyPainterStyle</code>, <code>executeFormat</code></span></div>
  <div class="it"><b>Font & size</b><span><code>executeFont</code>, <code>executeSize</code>, <code>executeSizeAdd</code>, <code>executeSizeMinus</code></span></div>
  <div class="it"><b>Typeface</b><span><code>executeBold</code>, <code>executeItalic</code>, <code>executeUnderline</code>, <code>executeStrikeout</code>, <code>executeSuperscript</code>, <code>executeSubscript</code></span></div>
  <div class="it"><b>Color</b><span><code>executeColor</code>, <code>executeHighlight</code></span></div>
  <div class="it"><b>Paragraph</b><span><code>executeTitle</code>, <code>executeList</code>, <code>executeRowFlex</code>, <code>executeRowMargin</code></span></div>
</div>

### Insert Commands

<div class="feat">
  <div class="it"><b>Table</b><span><code>executeInsertTable</code> plus row/col ops, merge, split, border, auto-fit series</span></div>
  <div class="it"><b>Image</b><span><code>executeImage</code>, <code>executeReplaceImageElement</code>, <code>executeSaveAsImageElement</code>, <code>executeSetImageCrop</code>, <code>executeSetImageCaption</code>, <code>executeChangeImageDisplay</code></span></div>
  <div class="it"><b>Hyperlink</b><span><code>executeHyperlink</code>, <code>executeDeleteHyperlink</code>, <code>executeCancelHyperlink</code>, <code>executeEditHyperlink</code></span></div>
  <div class="it"><b>Area</b><span><code>executeInsertArea</code>, <code>executeSetAreaValue</code>, <code>executeSetAreaProperties</code>, <code>executeDeleteArea</code></span></div>
  <div class="it"><b>Separator & page break</b><span><code>executeSeparator</code>, <code>executePageBreak</code></span></div>
  <div class="it"><b>Watermark</b><span><code>executeAddWatermark</code>, <code>executeDeleteWatermark</code></span></div>
</div>

### Search Commands

<div class="feat">
  <div class="it"><b>Search</b><span><code>executeSearch</code>, <code>executeSearchNavigatePre</code>, <code>executeSearchNavigateNext</code></span></div>
  <div class="it"><b>Replace</b><span><code>executeReplace</code></span></div>
</div>

### Page Commands

<div class="feat">
  <div class="it"><b>Page mode</b><span><code>executePageMode</code> (paging / continuous)</span></div>
  <div class="it"><b>Zoom</b><span><code>executePageScale</code>, <code>executePageScaleRecovery</code>, <code>executePageScaleAdd</code>, <code>executePageScaleMinus</code></span></div>
  <div class="it"><b>Paper</b><span><code>executePaperSize</code>, <code>executePaperDirection</code>, <code>executePageDirection</code>, <code>executeSetPaperMargin</code></span></div>
  <div class="it"><b>Columns</b><span><code>executeSetColumns</code></span></div>
  <div class="it"><b>Zone & badge</b><span><code>executeSetZone</code>, <code>executeSetMainBadge</code>, <code>executeSetAreaBadge</code></span></div>
</div>

### Mode & State

<div class="feat">
  <div class="it"><b>Editor mode</b><span><code>executeMode</code> (8 modes)</span></div>
  <div class="it"><b>Trace & compare</b><span><code>executeToggleTrace</code>, <code>executeCompare</code></span></div>
  <div class="it"><b>Graffiti</b><span><code>executeClearGraffiti</code></span></div>
  <div class="it"><b>Ruler</b><span><code>executeToggleRuler</code></span></div>
</div>

### Location Commands

<div class="feat">
  <div class="it"><b>Catalog locate</b><span><code>executeLocationCatalog</code></span></div>
  <div class="it"><b>Control locate</b><span><code>executeLocationControl</code>, <code>executeJumpControl</code></span></div>
  <div class="it"><b>Group locate</b><span><code>executeLocationGroup</code></span></div>
  <div class="it"><b>Area locate</b><span><code>executeLocationArea</code></span></div>
</div>

### Print

<div class="feat">
  <div class="it"><b>Print</b><span><code>executePrint</code> (configurable pixel ratio)</span></div>
</div>

::: tip Full command reference
This page lists representative commands only. **Full command list (154+)** is in [Execute commands](./command-execute) and [Get commands](./command-get).
:::
