# ESM 字体示例 / ESM font example

本示例消费独立 fork `@herberthe/canvas-editor@0.1.0`，维护者 Herbert He。
默认且仅 Canvas 页面绘制，SVG 页面与 SVG 导出暂缓；与上游包不共享版本线。

这个示例仅导入 `@herberthe/canvas-editor` 包根入口，演示初始化、默认自动下载、
关闭下载、失败提示、重试和选择本地文件补字体。无需选择排版引擎。

在仓库根目录先构建本分支的库，再安装示例依赖并启动：

```sh
pnpm exec vite build --mode lib
cd examples/esm-fonts
npm install
npm run dev
```

示例依赖为 `file:../..`，因此使用当前分支构建结果。脱离仓库时，将依赖改为包含
本次迁移 API 的已发行版本或构建出的 `.tgz` 路径，再执行 `npm install`。
构建与预览使用 `npm run build`、`npm run preview`。不要用 `file://` 打开 HTML。
Node 版本要求与仓库一致（>=24.13.1）。

- 默认地址：使用未显式设置的 `autoDownloadFonts: true` 默认值；初始阿语触发 Bunny 基本字体下载。
- `/?auto=false`：从首次布局起禁止自动请求，页面保留缺字提示；选择
  `public/fonts/NotoNaskhArabic-Regular.ttf` 并保持家族、400、normal 即可补齐样例。
- 复选框通过 `executeUpdateOptions` 实时切换。关闭时保留已注册字体，不能通过关闭开关模拟“卸载”。
- 离线或下载失败时仍可编辑，页面显示下载状态，内建提示和控制台说明缺失类别；
  恢复网络后点击重试，或选择本地字体。无效文件会显示注册阶段与错误。
- 字体家族、字重和样式必须与文件匹配；提供 regular 文件不会自动获得真实 bold/italic。
- 基本字体不是全 Unicode 覆盖保证，罕见汉字、emoji/ZWJ 和特殊字形可能仍需额外字体。
  `ready` 不等待后台下载，也不表示所有内容已经覆盖。

`pnpm run test:package -- --serve` 会从发行 tarball 独立编译此示例，
在 `http://127.0.0.1:4179/font-example/` 提供可验证版本；
定向浏览器测试位于 `cypress/migration/public-api.cy.ts`，运行：

```sh
pnpm exec cypress run --config-file cypress.migration.config.ts --spec cypress/migration/public-api.cy.ts --browser electron --config baseUrl=http://127.0.0.1:4179 --env package=1
```

`package=1` 标记从发行包预览服务运行；默认源码回归跳过此独立消费用例。

This example imports only the package root. Build the library at the repository
root, then run `npm install` and `npm run dev` in this directory. The local file
dependency uses this branch's built artifacts; when copying the example out of
the repository, use a release with these APIs or the generated tarball instead.

Downloads are enabled by default. Open `/?auto=false` for an offline start and
select a local font file to resolve missing characters. Check the registration
result and current coverage report: readiness, successful transfer and complete
coverage are separate states. Disabling downloads keeps already registered fonts.
