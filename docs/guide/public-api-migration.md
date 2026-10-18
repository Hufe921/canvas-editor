# T21：公共 API、示例与文档迁移记录

当前集成入口为[字体与 ESM 迁移](./font-and-esm-migration.md)，
英文入口为[Fonts and ESM migration](../en/guide/font-and-esm-migration.md)。
本记录说明 T21 的交付与验证，不替代完整 API 文档。

## 交付

- 从包根公开 `IUpdateOption`，补齐 ready/create、字体注册、覆盖报告与重试接口的声明说明。
  生命周期、字体描述/注册结果/元数据、覆盖报告及事件类型均可从包根消费。
- 主 Demo 改用 `await Editor.create`；ready 后才暴露调试实例并设置工具栏。
  初始化失败会显示状态，失败实例由 create 清理。mock 明确默认自动下载与原生段落复用语义。
- `examples/esm-fonts` 是独立 ESM 消费工程，只导入包根 API；默认开启下载，
  支持 `?auto=false` 初始关闭、运行期切换、失败状态、重试、按真实样式选择本地字体。
- 包消费检查从当前 tarball 独立编译、类型检查、打包该示例，无源码 alias/深路径依赖；
  同时用 TypeScript 负向断言验证已删除的枚举与配置不再被导出/接受。
- 中英文入门、配置、实例 API、命令、监听与实验选项文档迁移到当前行为；
  修正缺失的 RowFlex 导入、旧同步构造示例、默认下载未实现的过时描述，
  删除旧引擎配置用法及旧增量行恢复/性能承诺。
- 补齐基本字体与覆盖边界、系统安装字体不等同于提供 HB 字节、字重/斜体、
  Han 地区限制、失败恢复、诊断内容、ESM/WASM/Worker 部署和旧配置错误处理。
- 历史设计和基线保留原记录并标明历史边界，链接现行指南；不重录 T01 快照。

## 验证

- 6 个定向 Vitest 文件、45 个用例通过：公开旧配置拒绝（构造与运行期）、
  ready 生命周期、字体注册、覆盖、下载和诊断。
- 发行包 ESM 示例 4 项 Electron 用例通过：默认下载后覆盖恢复、关闭零请求与文件补齐、
  下载失败与重试、无效文件注册的可恢复错误。字体 HTTP 使用固定本地测试数据，
  不依赖实时 Bunny 网络可用性。
- 主 Demo 1 项 Electron 冒烟通过：就绪实例、公开命令、同步测高、工具栏缩放。
- TypeScript、相关 ESLint、文档站构建、ESM 库构建、应用构建及包消费检查通过。
  文档站构建同时修复了缺字文档中未转义的 cellId 占位符。
- Node 22.22.1 低于项目声明的 >=24.13.1，相关命令存在版本提示；构建中保留已有
  WASM Node 分支外部化/分块提示。目标 Node 版本和全量/多浏览器验收留到后续阶段。

运行发行包示例验证：

```sh
pnpm run test:package -- --serve
# 另一终端：
pnpm exec cypress run --config-file cypress.migration.config.ts --spec cypress/migration/public-api.cy.ts --browser electron --config baseUrl=http://127.0.0.1:4179 --env package=1
```

`package=1` 指定发行包预览入口，源码回归默认跳过该独立消费规格。
主 Demo 的规格使用源码服务 4318，不能对发行包预览地址执行。

T22 全量回归、T23 性能与发行资源验收、T24 最终审计仍待执行；本项没有宣称它们通过。
