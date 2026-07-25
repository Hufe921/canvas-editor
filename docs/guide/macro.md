# 宏（Macro）

宏用于记录和回放一组命令调用，支持两种类型：

- **录制宏（recorded）**：通过 `startRecording` / `stopRecording` 录制每一步 `execute*` 命令，可序列化为 JSON 持久化
- **脚本宏（script）**：通过 `register` 注册 JS 函数，可写任意逻辑（条件、循环、异步、读取数据等）

## 使用方式

```javascript
import Editor from "@hufe921/canvas-editor"

const instance = new Editor(container, <IElement[]>data, options)
instance.macro.apiName()
```

## MacroType

宏类型枚举。

| 值         | 说明   |
| ---------- | ------ |
| `RECORDED` | 录制宏 |
| `SCRIPT`   | 脚本宏 |

## startRecording

功能：开始录制。录制期间所有 `command.execute*` 调用会被记录为步骤。

用法：

```javascript
instance.macro.startRecording()
```

::: warning
录制期间不会自动跳过不可序列化的参数（如 DOM 节点、函数），这些参数会被静默丢弃。
:::

## stopRecording

功能：停止录制并保存为录制宏。

用法：

```javascript
const macro: IRecordedMacro | null = instance.macro.stopRecording(name: string)
```

| 参数   | 类型     | 说明                          |
| ------ | -------- | ----------------------------- |
| `name` | `string` | 宏名称，后续可按名称查找/回放 |

返回值：录制宏对象；若当前未在录制则返回 `null`。

## cancelRecording

功能：取消录制，已记录的步骤会被丢弃。

用法：

```javascript
instance.macro.cancelRecording()
```

## isRecording

功能：判断是否正在录制。

用法：

```javascript
const recording: boolean = instance.macro.isRecording()
```

## play

功能：按 id 或名称回放宏。录制宏按顺序重新调用每一步命令；脚本宏直接执行 handler。

用法：

```javascript
await instance.macro.play(idOrName: string, ...args: unknown[])
```

| 参数       | 类型        | 说明                                    |
| ---------- | ----------- | --------------------------------------- |
| `idOrName` | `string`    | 宏 id 或名称（优先按 id 查找）          |
| `...args`  | `unknown[]` | 仅脚本宏使用，传给 handler 的运行时参数 |

::: warning

- 录制中无法回放
- 找不到宏、命令不存在或执行出错时静默返回，不抛出异常
  :::

## register

功能：注册脚本宏。handler 可写任意 JS 逻辑（条件、循环、异步、调用多个命令）。

用法：

```javascript
const macro: IScriptMacro = instance.macro.register(
  name: string,
  handler: (...args: unknown[]) => void | Promise<void>
)
```

示例：

```javascript
// 组合多个命令
instance.macro.register('规范化选区', () => {
  instance.command.executeFormat()
  instance.command.executeBold()
  instance.command.executeSize(16)
})

// 接收运行时参数 + 使用 Date
instance.macro.register('插入签名', (userName = '匿名') => {
  instance.command.executeInsertElementList([
    { value: `\n—— ${userName} 于 ${new Date().toLocaleString()}\n` }
  ])
})

// 异步读取 + 计算（录制宏做不到）
instance.macro.register('字数统计', async () => {
  const count = await instance.command.getWordCount()
  console.log(`字数: ${count}`)
})
```

::: warning
脚本宏的 handler 是函数引用，无法被 `exportMacros` 序列化，因此不会出现在导出 JSON 里。
:::

## unregister

功能：按 id 或名称注销宏（通常是脚本宏）。

用法：

```javascript
const ok: boolean = instance.macro.unregister(idOrName: string)
```

## getMacros

功能：返回所有宏（录制宏 + 脚本宏）。

用法：

```javascript
const macros: IMacro[] = instance.macro.getMacros()
```

## getMacro

功能：按 id 或名称查找单个宏。

用法：

```javascript
const macro: IMacro | undefined = instance.macro.getMacro(idOrName: string)
```

## removeMacro

功能：按 id 或名称删除宏。

用法：

```javascript
const ok: boolean = instance.macro.removeMacro(idOrName: string)
```

## exportMacros

功能：将所有录制宏序列化为 JSON 字符串（脚本宏不会被导出）。

用法：

```javascript
const json: string = instance.macro.exportMacros()
```

## importMacros

功能：从 JSON 字符串导入录制宏。

用法：

```javascript
instance.macro.importMacros(json: string, options?: { overwrite?: boolean })
```

| 参数                | 类型      | 说明                                           |
| ------------------- | --------- | ---------------------------------------------- |
| `json`              | `string`  | `exportMacros` 产生的 JSON 字符串              |
| `options.overwrite` | `boolean` | 是否覆盖已存在的同 id 宏，默认 `false`（跳过） |

## 完整示例：录制 + 持久化 + 回放

```javascript
const STORAGE_KEY = 'my-macros'

// 启动时恢复
const saved = localStorage.getItem(STORAGE_KEY)
if (saved) {
  instance.macro.importMacros(saved)
}

// 用户触发录制
instance.macro.startRecording()
// ...用户在编辑器里操作...
const macro = instance.macro.stopRecording('我的宏')
if (macro) {
  localStorage.setItem(STORAGE_KEY, instance.macro.exportMacros())
}

// 回放
await instance.macro.play('我的宏')
```
