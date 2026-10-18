# T06A：Bunny 字体元数据与格式适配

## 已实现的范围

内部 `BunnyFontProvider` 负责从诊断选择候选、查询 CSS、筛选资源、读取二进制、
归一化与解析验证。它不修改编辑器、不插入 CSS、不隐式发起请求。
自动下载开关、去重/限流、共享请求、重试和持久缓存已由 [T06B](./font-download.md) 接入。

```typescript
// 内部服务入口，供后续 FontDownloadManager 使用；不是包根入口的公开 API。
const provider = new BunnyFontProvider()
const plan = await provider.plan(issue, {
  signal,
  language: 'zh-Hant', // 明确的文档/元素语言；不得使用 UI 语言代替
  contexts // 可选：当前仍缺失的完整整形上下文，仅在本地使用
})
if (plan.status === 'ready') {
  for (const resource of plan.resources) {
    const result = await provider.download(resource, signal)
    if (result.status === 'loaded') {
      await editor.register.fonts([result.face])
    }
  }
  // 必须再查当前覆盖报告；下载完成本身不能视为缺字已解决。
}
```

plan 返回 ready/unsupported/failed，下载返回 loaded/failed；失败区分 fetch/decode/parse。
外部 AbortSignal 取消会 reject，不包装成可重试的普通失败。
ready 表示存在候选资源，不是覆盖保证；unplannedCodePoints 记录无适用元数据的码点。
样式缺失时可使用 samples 初步规划，但 T06B 必须从当前 locations 取完整本地上下文，
不能把最多 16 个示例当作全部缺字集合。

## 家族、地区与样式

| 文字 | 基本候选 |
| --- | --- |
| Latin、Greek、Cyrillic、公共字符 | Noto Sans |
| Han，未给定语言 | Noto Sans SC |
| Han，明确 zh-Hant / zh-TW / zh-HK / zh-MO | Noto Sans TC |
| 日文提示、平假名/片假名 | Noto Sans JP |
| 韩文提示、Hangul | Noto Sans KR |
| Arabic | Noto Naskh Arabic |
| Devanagari | Noto Sans Devanagari |
| Thai | Noto Sans Thai |

普通缺字先取 400 normal；missingStyle 只请求匹配的真实资源。
首版映射接受 400/700，Noto Sans 支持 normal/italic；其他映射不合成斜体。
CSS 中还必须存在所请求的实际家族、静态字重和样式，才生成资源请求。
可变字重范围不冒充指定的静态实例；未验证的文字、emoji 或样式明确返回 unsupported。
loadFailed 与 unsupportedGlyphFormat 不自动发起另一轮候选请求。

映射依据 [Bunny 官方目录](https://fonts.bunny.net/) 与该目录生成的实际 CSS。
API 使用 [官方说明](https://fonts.bunny.net/about/) 中的 CSS v1 接口。

## CSS 与片段选择

解析 @font-face 的 family、weight、style、全部受支持 src URL/format 与 unicode-range。
支持单点、区间、U+4E?? 通配及补充平面码点；格式优先 WOFF2，再保留 WOFF/TTF/OTF 候选。
按完整字素/连写上下文选择覆盖全部码点的单片；无法单片覆盖时保留必要的不同片段，
交由真实 cmap/HB 复核是否可在同一字体内排版，不宣称跨文件拼字等于完整覆盖。

2026-10-16 实测：Bunny Noto Sans SC CSS 的许多编号片段没有 unicode-range，
但 Latin 等子集有范围，并提供命名的 chinese-simplified 基本子集。
范围缺失保留为 null，不能解释成覆盖所有 Unicode。
适配器只额外选择已知的命名基础子集或唯一无歧义资源，返回 providerRangesIncomplete；
无法定位资源时返回 unsupported(metadata)，不会默认下载全部编号片段。
当 CSS 提供真实补充平面范围时，所有所需片段都可分别规划和注册。

中文基础子集不是完整 Unicode 汉字库。罕见字或序列仍可能缺失，必须保持诊断；
本项没有猜测编号片段的码点范围，也没有宣称这些片段已经能够逐字索引。

## 二进制归一化与版本

`FontManager` 的手动 data/url 注册入口也接入同一解码器：

- TTF/OTF：保留原始 SFNT 数据，检查目录、大小与表边界。
- WOFF：按表解压 deflate，重建 SFNT 目录与校验调整值；保留未知表及全部整形表。
  使用浏览器原生 DecompressionStream；不可用时返回可恢复的 unsupportedFormat。
- WOFF2：固定依赖 `woff2-encoder@2.0.0` 的解码专用入口，惰性载入内嵌 WASM，
  不额外请求第三方解码脚本。恢复 SFNT 后再用 opentype.js 和 HarfBuzz 校验。

不经 font editor 重写；GSUB/GPOS/GDEF 有逐表保留断言，复杂文字有真实整形与轮廓验证。
输入/声明解压大小限制 30 MiB，WOFF 每表输出限制为声明长度；解码等待有超时与取消。
同步 WASM 工作不能中途抢占，但取消后的结果不会继续注册。
格式错误、解码失败和宿主销毁各自保留可辨认的失败行为。

资源身份包含提供方、家族、样式、片段 URL、CSS 内容版本和字体实际内容指纹。
FontManager 还验证完整字节，不仅依据 hash 判断重复。
同一家族多个片段分别注册；资源更新不会因 family/weight/style 相同被忽略。
提供 Cache-Control、ETag、Last-Modified（浏览器可读取时）及内容版本，供 T06B 实施缓存。
内容指纹用于版本变化检测，不作为加密摘要；后续缓存不能只用 family 永久复用资源。

## 传输约束与实测结果

所有资源 URL 取自官方 CSS，限定 HTTPS fonts.bunny.net，拒绝第三方 URL、凭据和重定向。
请求使用 cors、omit credentials、no-referrer；有 15 秒超时、体积限制、HTTP/MIME 检查。
请求 URL 只含固定家族、样式与 display 参数，不拼接文档字符、缺字样例或上下文。
服务当前实测直接返回 200，CSS 为 text/css，字体为 font/woff 或 font/woff2，
响应 Access-Control-Allow-Origin: *；真实浏览器跨域读取已通过。

浏览器中的 ETag 实测为 null，而 Node 可读取；不能据此断言资源没有版本。
同时保留内容指纹与可读取的 Last-Modified；字体 URL 相同也可能在不同时间/节点更新。
T06B 已接入有限 TTL、再验证与淘汰；提供方不会永久缓存或无限重试。

固定样本验收：英文 Hello、中文与英文混排、Arabic、Devanagari、Thai 均实际下载、
解码、注册并通过 HarfBuzz 覆盖与 opentype 轮廓检查。
中文同家族的 chinese-simplified 与 latin 两片分别注册；Arabic 同时验证 WOFF 与 WOFF2。
[验收元数据](./t6a-bunny-verification.json) 记录具体资源、格式、大小与内容版本。

运行可重复的定向检查：

```bash
# 默认单测不访问外网，字体样本来自仓库已有字体并真实压缩/解码。
pnpm exec vitest run tests/core/text-engine/font-binary.test.ts tests/core/text-engine/bunny-font-provider.test.ts

# 显式联网验证（五类固定样本）
node scripts/verify-bunny-fonts.mjs /tmp/bunny-font-report.json

# 浏览器仅跑此项；另一个终端先启动 Vite。
pnpm exec vite --host 127.0.0.1 --port 4318 --strictPort
pnpm exec cypress run --config-file cypress.migration.config.ts --spec cypress/migration/bunny-font-provider.cy.ts --env BUNNY_LIVE=1 --config baseUrl=http://127.0.0.1:4318
```

本次 8 个相关单测文件、84 项通过；TypeScript、相关 ESLint、ESM 构建、
冻结锁文件与发行包静态消费检查通过。入口的 Emscripten 类型引用保持在所有 import 之前，
确保 types: [] 的独立消费工程也可使用公开声明。
构建仍有此前记录的 Node module 分支和分块提示。

该浏览器检查按需启用，不重录 T01 快照，不替代后续全量回归、多浏览器、IME 和打印验收。
