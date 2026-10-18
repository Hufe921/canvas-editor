# T04：HarfBuzz Runtime 与编辑器 ready 生命周期

## 使用方式

```typescript
import Editor, { EditorRuntimeError } from '@herberthe/canvas-editor'

const editor = new Editor(container, data, {
  fonts: configuredFonts
})

try {
  await editor.ready
  editor.command.executeSetRange(0, 1)
} catch (error) {
  if (error instanceof EditorRuntimeError) {
    console.error(error.code, error.cause)
  }
}

// 或等待后直接拿到可操作实例；失败时自动清理临时实例。
const readyEditor = await Editor.create(container, data, options)
```

`editor.ready` 是同一个实例的稳定 Promise，字体/WASM 初始化及首次布局、
初始级联计算完成后 resolve。它不等待首屏或今后输入产生的后台字体下载，
也不承诺内容已被所有字体覆盖。
惰性绘制仍可按视口执行；ready 保证首次布局可用，不等于所有不可见页面都已绘成像素。

## 状态与错误

| state        | 行为                                                                         |
| ------------ | ---------------------------------------------------------------------------- |
| initializing | 构造模型和界面；不先用旧文字循环做 HarfBuzz 首屏；编辑代理只读，坐标交互暂停 |
| ready        | 首次布局完成；命令、交互和同步测量可用                                       |
| failed       | ready 拒绝；initializationError 保存初始化错误及 cause；不降级处理 WASM 失败 |
| destroyed    | 生命周期终态；待完成 ready 立即拒绝，晚到结果不能重新激活实例                |

公开错误类为 `EditorRuntimeError`，code 为：

- `EDITOR_NOT_READY`：提前调用依赖布局或修改模型的命令。
- `EDITOR_INITIALIZATION_FAILED`：WASM 或首次布局失败；cause 保留原始错误。
- `EDITOR_DESTROYED`：使用已销毁实例，或销毁尚未就绪的实例。

初始化错误在 `editor.initializationError` 中可读。成功或尚未失败时为 null。
已成功的 ready 不会因之后 destroy 而改成拒绝，但后续命令仍检查 destroyed 状态。
重复 destroy 安全。实例未被 await 就销毁也不会产生内部未处理拒绝，宿主仍能 await ready 观察结果。

## 初始化前的命令契约

只允许四个不依赖布局的查询提前执行：getValue、getValueAsync、getLocale、getContainer。
它们也不能在 failed/destroyed 状态继续调用。

其余同步命令直接抛出错误，Promise 命令返回拒绝；不静默排队或保存待执行修改。
公开的同步 `executeComputeElementListHeight` 在 ready 后仍同步返回 number。
新增 `executeComputeElementListHeightAsync(elements)`，允许初始化期间调用，
显式等待 ready，再做相同测量；若期间失败/销毁，则拒绝，不访问旧布局。
插件若会调用命令，应在 await ready 后启用。宏拦截器不能替换生命周期检查。

输入代理、指针、剪贴板、IME 和拖放在初始化期间不进入编辑器处理逻辑。
实例内事件捕获、代理只读、快捷键及缩放检查共同避免未就绪坐标参与操作。
首次 renderChange 推迟到 ready 后，回调可正常查询几何；后续正常重绘保留原发送方式。

## Runtime 与字体资源

`HarfBuzzRuntime` 将 harfbuzzjs 改为按需动态导入，多个编辑器共享一次 WASM 初始化。
生产字体注册与整形都使用该模块；没有同步静态导入绕过 ready 的第二条初始化路径。
共享初始化失败会缓存同一拒绝，不启动自动重试或 browser shaper 降级循环。
销毁一个实例不会卸载其他实例仍在使用的共享 WASM。

字体注册失败与 WASM 失败区分处理。字体 URL 失败、无数据、解析失败仍是可恢复字体问题，
不会把整个编辑器标记为 failed；当前会输出可恢复字体诊断、下载状态及页面提示。
文字始终使用 HarfBuzz；ready 成功与字体覆盖完整是两个独立状态。

每个实例拥有自己的字体 fetch AbortController 和注册 FontFace 集合。destroy 中止本实例请求、
清理 face/font 引用与布局缓存，仅移除自己注册的 document 字体。
忽略 abort 的传输和不可取消的 FontFace.load 晚到时再次检查 destroyed，不重新注册或绘制。
首次排版安排的 nextTick、滚动观察等晚到回调也检查状态，避免销毁后重建标尺/通知。

离屏打印创建的临时 Editor 也会先 await ready，失败和成功均执行清理。
迁移浏览器样本已加入 await ready，供后续统一回归使用。

## 当前行为（T20/T21）

所有实例都异步初始化 HarfBuzz；textEngine/renderMode 开关已删除，不存在同步旧首屏。
缺字检测、自动下载、页面提示和纯 HB 占位已经接入，ready 不等待后台自动下载。
历史 T04 验证记录保留如下；当前完整用法见[字体与 ESM 迁移](./font-and-esm-migration.md)。

## 验证记录

全部 T04 改动完成后执行针对性生命周期、真实字体与共享 Runtime 测试，
TypeScript、相关 ESLint、ESM 库构建和 tarball 静态消费检查。
全量单测、Cypress 和多浏览器回归按当前要求留到后续改造完成后统一执行。

本次执行结果（2026-10-16）：

- `vitest run tests/editor/ready.test.ts tests/core/text-engine/harfbuzz-runtime.test.ts
tests/core/text-engine/font-lifecycle.test.ts --maxWorkers=2`：3 个文件、21 项通过。
- `tsc --noEmit`、T04 修改文件的 ESLint、`git diff --check`：通过。
- `vite build --mode lib --logLevel warn`：通过。保留已有 Node 分支外部化、分块提示。
- `npm run test:package`：tarball 入口、CommonJS 拒绝、严格消费类型、独立打包和相对 chunk 检查通过。
- 未执行全量单测/Cypress/多浏览器回归，没有更新或重录 T01 布局基线。
