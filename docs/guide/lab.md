# 实验特性

实验项在 `lab` 下逐项默认关闭。当前统一使用 HarfBuzz，开启开关不会切换引擎。

```typescript
const editor = await Editor.create(container, data, {
  lab: { incrementalCompute: true }
})
```

## incrementalCompute：原生段落增量复用

编辑会完整重排受影响段落，因为 BiDi 与上下文整形可能影响整段。
未变化段落可复用原生布局；缓存使用段内相对索引，返回时映射当前 source、glyph、
cluster、caret 及对象锚点。表格单元格有独立 scope，列表序号按当前文档重新生成。

每轮仍扫描文档、计算容器流、分页、分栏、环绕、表格分片与位置；不复用旧行对象、
行恢复快照或部分页面坐标。单个超长段落仍需整段重排，不承诺 1–3 行收敛或数量级提速。

缓存键包括文字/样式、来源身份、字体 revision、间距、可用宽度及逐行 flow 约束。
样式、字体或约束变化会失效；字段修改、历史恢复、字体补充触发相应全量失效。
缓存关闭或未命中时仍进行完整 HarfBuzz 排版，不存在浏览器或旧引擎回退。
性能评估按 T23 执行，当前只能依据定向差分验证其布局一致性。

内部二次开发应通过 `spliceElementList` / `deleteElementList` 记录脏区，
通过 `setElementProperty` / `deleteElementProperty` 修改字段，避免绕过失效追踪。
外部集成使用公开 command，不依赖内部 Draw 或快照结构。

实现与边界见[原生增量布局](./native-incremental-layout.md)。
