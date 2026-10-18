# 实例 API

## 使用方式

```javascript
import Editor from '@hufe921/canvas-editor'

const instance = await Editor.create(container, data, options)
instance.apiName()
```

## 初始化与字体 API

| 入口 | 用途 |
| --- | --- |
| `Editor.create(container, data, options?)` | 返回就绪实例，失败自动清理 |
| `ready: Promise<void>` | 等待 WASM、显式字体与首次布局，不等待后台补字体 |
| `state` / `initializationError` | 生命周期状态与初始化错误（含 code/cause） |
| `register.fonts(faces)` | 等待 ready，逐项返回 registered/duplicate/failed；重排并更新诊断 |
| `register.getFontFaces()` / `getFontRevision()` | 已注册字体元数据快照 / 字体版本 |
| `getFontCoverageReport()` | 当前缺字快照，包含字符/序列、来源和下载状态 |
| `retryFontDownloads()` | ready 后重试当前缺字；尊重自动下载开关 |
| `listener.fontCoverageChange` / `eventBus.on('fontCoverageChange', cb)` | 单回调 / 多订阅字体诊断更新 |

公开类型 `IEditorOption`、`IUpdateOption`、`IEditorFontFace`、`FontCoverageReport`、
`FontRegistrationResult`、`RegisteredFontFace`、`EditorRuntimeState`、
`EditorRuntimeErrorCode` 及运行时类 `EditorRuntimeError` 均从包根入口导入。
接口示例、错误与离线恢复见[字体与 ESM 迁移](./font-and-esm-migration.md)。

## version

功能：版本号

用法：

```javascript
instance.version
```

## destroy

功能：销毁编辑器

用法：

```javascript
instance.destroy()
```

::: warning
仅销毁编辑器 dom 及相关事件，菜单栏、工具栏、外部变量等需自行处理。
:::
