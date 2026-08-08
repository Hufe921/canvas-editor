# 功能总览

canvas-editor 提供完整的「类 Word」文档编辑能力,按使用场景分为六层:**文本编辑** → **内容元素** → **高级功能** → **页面设置** → **扩展能力** → **API**。

<div class="stats">
  <div class="stat"><b>19</b><span>元素类型</span></div>
  <div class="stat"><b>6</b><span>表单控件</span></div>
  <div class="stat"><b>8</b><span>编辑模式</span></div>
  <div class="stat"><b>154+</b><span>命令式 API</span></div>
  <div class="stat"><b>16+</b><span>事件</span></div>
  <div class="stat"><b>8</b><span>官方插件</span></div>
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

## 文本编辑 <Badge type="info" text="31" />

字符级、行内的文本与编辑能力。

### 富文本

<div class="feat">
  <div class="it"><b>字体族</b><span>切换字体族(font family)</span></div>
  <div class="it"><b>字号</b><span>字号设置、增大 / 减小、min / max 上下限</span></div>
  <div class="it"><b>字体颜色</b><span>字体颜色设置</span></div>
  <div class="it"><b>文本高亮</b><span>文本背景高亮色</span></div>
  <div class="it"><b>加粗 / 斜体</b><span>字体加粗、斜体</span></div>
  <div class="it"><b>下划线 / 删除线</b><span>下划线、删除线</span></div>
  <div class="it"><b>上标 / 下标</b><span>上标、下标</span></div>
  <div class="it"><b>装饰样式</b><span>下划线 / 删除线样式(实线、双线、虚线、点线、波浪线)</span></div>
  <div class="it"><b>对齐</b><span>左、中、右、两端、分散</span></div>
  <div class="it"><b>行间距</b><span>段落行间距(rowMargin)</span></div>
  <div class="it"><b>缩进</b><span>首行缩进、Tab 缩进</span></div>
  <div class="it"><b>换行规则</b><span>break-all / break-word</span></div>
  <div class="it"><b>标题</b><span>H1 – H6、per-level 字号</span></div>
  <div class="it"><b>标题规则</b><span>deletable、disabled、conceptId 关联</span></div>
  <div class="it"><b>有序 / 无序列表</b><span>有序、无序(实心圆 / 空心圆 / 方块)</span></div>
  <div class="it"><b>复选框列表</b><span>列表项内置复选框</span></div>
  <div class="it"><b>列表样式继承</b><span>列表标记继承周边文本格式</span></div>
</div>

### 编辑操作

<div class="feat">
  <div class="it"><b>剪贴板</b><span>剪切、复制、粘贴、全选</span></div>
  <div class="it"><b>历史</b><span>撤销、重做(记录上限可配置)</span></div>
  <div class="it"><b>格式工具</b><span>格式刷(复制样式 / 应用样式)、清除格式</span></div>
  <div class="it"><b>向前删除</b><span>Backspace 删除</span></div>
  <div class="it"><b>文字工具</b><span>删除空行、删除行首空格</span></div>
</div>

### 元素

<div class="feat">
  <div class="it"><b>文本与制表符</b><span>文本元素、Tab 制表符</span></div>
  <div class="it"><b>上下标元素</b><span>上标、下标元素类型</span></div>
  <div class="it"><b>复杂元素</b><span>图片、表格、超链接、分割线、分页符、LaTeX、日期、内容块</span></div>
  <div class="it"><b>结构元素</b><span>标题、列表、标签、区域、控件、复选框、单选框</span></div>
  <div class="it"><b>元素 CRUD</b><span>按 id / conceptId 增 / 删 / 改 / 查</span></div>
  <div class="it"><b>批量插入</b><span>插入元素列表、追加元素列表</span></div>
</div>

### 搜索与替换

<div class="feat">
  <div class="it"><b>搜索</b><span>关键字搜索、上一个 / 下一个、匹配计数</span></div>
  <div class="it"><b>搜索选项</b><span>正则、忽略大小写、选区内搜索</span></div>
  <div class="it"><b>替换</b><span>单次替换、关键词范围查询、关键词上下文</span></div>
</div>

## 内容元素 <Badge type="info" text="29" />

文档中的块级内容对象。

### 表格

<div class="feat">
  <div class="it"><b>行列操作</b><span>行列增删、全选</span></div>
  <div class="it"><b>合并单元格</b><span>单元格合并</span></div>
  <div class="it"><b>拆分单元格</b><span>垂直 / 水平方向拆分</span></div>
  <div class="it"><b>跨行跨列</b><span>rowspan、colspan</span></div>
  <div class="it"><b>跨页重复表头</b><span>pagingRepeat 跨页重复</span></div>
  <div class="it"><b>边框类型</b><span>全 / 空 / 外 / 内 / 虚线,边框颜色</span></div>
  <div class="it"><b>单元格边框</b><span>上 / 下 / 左 / 右独立设置</span></div>
  <div class="it"><b>单元格斜线</b><span>正斜线 / 反斜线</span></div>
  <div class="it"><b>背景填充</b><span>单元格背景色</span></div>
  <div class="it"><b>垂直对齐</b><span>顶端 / 居中 / 底端</span></div>
  <div class="it"><b>自动调整</b><span>按内容自适应、按页宽自适应</span></div>
  <div class="it"><b>溢出控制</b><span>overflow 配置</span></div>
</div>

### 图片

<div class="feat">
  <div class="it"><b>插入图片</b><span>插入、宽高、显示方式</span></div>
  <div class="it"><b>替换 / 另存</b><span>替换图片元素、另存为图片</span></div>
  <div class="it"><b>显示模式</b><span>嵌入、块级、环绕、浮于上方、衬于下方(5 种)</span></div>
  <div class="it"><b>裁剪</b><span>裁剪区域(起始坐标 + 宽高)</span></div>
  <div class="it"><b>题注</b><span>题注内容(支持 {imageNo} 占位符)、颜色、字体、字号、间距</span></div>
  <div class="it"><b>预览窗口</b><span>图片预览(png / jpg / jpeg / svg)</span></div>
  <div class="it"><b>拖拽浮图</b><span>拖拽时的浮图预览,可禁用</span></div>
</div>

### 超链接

<div class="feat">
  <div class="it"><b>插入 / 编辑</b><span>插入超链接、编辑链接 URL</span></div>
  <div class="it"><b>删除 / 取消</b><span>删除超链接、取消超链接</span></div>
</div>

### 公式

<div class="feat">
  <div class="it"><b>LaTeX</b><span>LaTeX 语法渲染为 SVG 内嵌</span></div>
</div>

### 日期

<div class="feat">
  <div class="it"><b>日期格式</b><span>自定义日期格式(如 yyyy-MM-dd)</span></div>
  <div class="it"><b>选择器模式</b><span>日期 / 月份 / 年份三种模式</span></div>
</div>

### 内容块

<div class="feat">
  <div class="it"><b>iframe</b><span>嵌入网页(src / srcdoc / sandbox / allow)</span></div>
  <div class="it"><b>video</b><span>嵌入视频(src)</span></div>
</div>

### 分割线

<div class="feat">
  <div class="it"><b>分割线样式</b><span>实线 / 虚线 / 点线、虚线样式数组、线宽、颜色</span></div>
</div>

### 分页符

<div class="feat">
  <div class="it"><b>分页</b><span>插入分页符</span></div>
  <div class="it"><b>按节纸张方向</b><span>分页符为分节边界,后续页可独立设置方向</span></div>
</div>

## 高级功能 <Badge type="info" text="33" />

表单、自动化、协作等专业场景。

### 控件

<div class="feat">
  <div class="it"><b>控件类型</b><span>文本、数值、下拉、单选、复选、日期 共 6 种</span></div>
  <div class="it"><b>数值计算器</b><span>数值控件内置计算器按钮</span></div>
  <div class="it"><b>下拉多选</b><span>下拉控件支持多选(自定义分隔符)</span></div>
  <div class="it"><b>日期选择器模式</b><span>date / month / year 三种粒度</span></div>
  <div class="it"><b>占位符与前后缀</b><span>placeholder、preText / postText</span></div>
  <div class="it"><b>默认值与禁用</b><span>默认值、disabled</span></div>
  <div class="it"><b>缩进对齐</b><span>rowStart / valueStart 两种缩进方式</span></div>
  <div class="it"><b>嵌套控件</b><span>控件内嵌套其他控件</span></div>
  <div class="it"><b>扩展数据</b><span>setControlExtension 自定义元数据</span></div>
  <div class="it"><b>批量设置</b><span>值 / 扩展 / 属性批量设置</span></div>
  <div class="it"><b>关键词高亮</b><span>setControlHighlight 按规则高亮</span></div>
  <div class="it"><b>定位与跳转</b><span>定位激活控件、上 / 下跳转</span></div>
  <div class="it"><b>激活 / 失活状态</b><span>active / inactive 状态切换</span></div>
  <div class="it"><b>表单模式</b><span>仅控件内可编辑</span></div>
</div>

### 级联与计算

<div class="feat">
  <div class="it"><b>级联</b><span>控件值变化联动其他控件 / 标题的显隐、必填、可编辑、可删除</span></div>
  <div class="it"><b>计算</b><span><code>compute</code> 计算表达式(Excel 公式模式,自动重算回写)</span></div>
</div>

### 控件校验

<div class="feat">
  <div class="it"><b>校验规则</b><span>必填、长度(min / max)、数值范围、整数 / 精度、日期范围、多选数量</span></div>
  <div class="it"><b>错误反馈</b><span>校验失败高亮、自定义错误文案</span></div>
  <div class="it"><b>清除校验</b><span>清除已校验状态</span></div>
</div>

### 留痕与对比

<div class="feat">
  <div class="it"><b>留痕模式</b><span>新增元素下划线、删除元素中划线</span></div>
  <div class="it"><b>作者标识</b><span>标注每条修改的作者</span></div>
  <div class="it"><b>版本对比</b><span>两份文档版本对比,差异以留痕方式展示</span></div>
</div>

### 宏

<div class="feat">
  <div class="it"><b>录制宏</b><span>录制 <code>execute*</code> 命令、序列化为 JSON 持久化、回放</span></div>
  <div class="it"><b>脚本宏</b><span>注册自定义 JS 函数(条件 / 循环 / 异步 / 读数据)</span></div>
</div>

### 组

<div class="feat">
  <div class="it"><b>组操作</b><span>设置成组、删除成组、定位成组</span></div>
  <div class="it"><b>组 ID 查询</b><span>获取全部 groupId</span></div>
</div>

### 区域

<div class="feat">
  <div class="it"><b>区域操作</b><span>插入、设置属性、删除、定位</span></div>
  <div class="it"><b>区域值</b><span>设置值、取值</span></div>
  <div class="it"><b>独立模式</b><span>区域可单独配置模式(编辑 / 只读 / 表单)</span></div>
</div>

### 徽章

<div class="feat">
  <div class="it"><b>正文徽章</b><span>正文区域的徽章标记</span></div>
  <div class="it"><b>区域徽章</b><span>区域上的徽章标记</span></div>
</div>

### 目录

<div class="feat">
  <div class="it"><b>目录生成</b><span>基于标题自动生成目录(TOC)</span></div>
  <div class="it"><b>定位与取值</b><span>点击定位跳转、获取标题值</span></div>
</div>

## 页面设置 <Badge type="info" text="19" />

页面级配置与文档外观。

### 编辑模式

<div class="feat">
  <div class="it"><b>8 种模式</b><span>编辑、清洁、只读、表单、打印、设计、涂鸦、留痕</span></div>
  <div class="it"><b>模式规则</b><span>打印(隐藏背景 / 空控件 / 区域)、只读(禁用图片预览)、表单(控件不可删)</span></div>
</div>

### 页面与布局

<div class="feat">
  <div class="it"><b>分页 / 连页</b><span>paging / continuity 两种页面模式</span></div>
  <div class="it"><b>页面缩放</b><span>放大、缩小、恢复原始比例</span></div>
  <div class="it"><b>页面边框</b><span>边框颜色、线宽、内边距</span></div>
  <div class="it"><b>纸张大小</b><span>自定义宽高</span></div>
  <div class="it"><b>纸张方向</b><span>纵向 / 横向(全局 / 按节)</span></div>
  <div class="it"><b>页边距</b><span>上 / 右 / 下 / 左四向边距</span></div>
  <div class="it"><b>失活区透明</b><span>inactiveAlpha 非激活区透明度</span></div>
</div>

### 分栏

<div class="feat">
  <div class="it"><b>分栏配置</b><span>栏数、栏间距、栏间分隔线</span></div>
</div>

### 页眉 / 页脚 / 页码

<div class="feat">
  <div class="it"><b>三区切换</b><span>页眉 / 正文 / 页脚切换</span></div>
  <div class="it"><b>失活透明</b><span>非激活区透明度</span></div>
  <div class="it"><b>点击编辑提示</b><span>页眉页脚的点击提示(可关闭)</span></div>
  <div class="it"><b>页码格式</b><span>页码格式、数字类型(阿拉伯 / 中文)</span></div>
  <div class="it"><b>页码范围</b><span>起始页码、出现 / 最大页码</span></div>
</div>

### 背景与水印

<div class="feat">
  <div class="it"><b>页面背景色</b><span>纯色背景</span></div>
  <div class="it"><b>页面背景图</b><span>contain / cover、重复方式、应用于指定页</span></div>
  <div class="it"><b>文字水印</b><span>颜色、透明度、字号、是否重复、间距、置于顶层 / 底层</span></div>
  <div class="it"><b>图片水印</b><span>图片作为水印</span></div>
</div>

## 扩展能力 <Badge type="info" text="44" />

开发者集成、扩展机制与运行时能力。

### 事件监听

<div class="feat">
  <div class="it"><b>listener</b><span>单回调监听(直接赋值)</span></div>
  <div class="it"><b>eventBus</b><span>发布订阅(支持多监听),覆盖 contentChange / rangeChange / rangeStyleChange / controlChange / controlContentChange / saved / pageSizeChange / pageScaleChange / pageModeChange / zoneChange / positionContextChange / imageSizeChange / imageMousedown / imageDblclick / labelMousedown / visiblePageNoListChange / intersectionPageNoChange 等 16+ 事件</span></div>
  <div class="it"><b>交互事件</b><span>鼠标移动 / 进入 / 离开 / 按下 / 抬起 / 点击、滚动</span></div>
</div>

### 重写方法

<div class="feat">
  <div class="it"><b>方法拦截</b><span>拦截 / 重写粘贴、粘贴图片、复制、拖放默认行为</span></div>
</div>

### 国际化

<div class="feat">
  <div class="it"><b>多语言</b><span>内置简体中文 / 英文,扩展其他语言</span></div>
  <div class="it"><b>文案覆盖</b><span>覆盖校验等内置文案</span></div>
</div>

### 插件

<div class="feat">
  <div class="it"><b>插件机制</b><span><code>instance.use(plugin)</code> 注册自定义插件</span></div>
  <div class="it"><b>条形码</b><span>barcode1d 插件</span></div>
  <div class="it"><b>二维码</b><span>barcode2d 插件</span></div>
  <div class="it"><b>代码块</b><span>codeblock 插件</span></div>
  <div class="it"><b>Word 导入导出</b><span>docx 插件</span></div>
  <div class="it"><b>Excel 导入</b><span>excel 插件</span></div>
  <div class="it"><b>悬浮工具栏</b><span>floating-toolbar 插件</span></div>
  <div class="it"><b>流程图</b><span>diagram 插件</span></div>
  <div class="it"><b>大小写转换</b><span>case 插件</span></div>
</div>

### 配置与定制

<div class="feat">
  <div class="it"><b>字符扩展</b><span>letterClass 为每个字符附加 CSS 类(打字机动画等)</span></div>
  <div class="it"><b>空白符可视化</b><span>显示空格 / Tab 字符</span></div>
  <div class="it"><b>换行符可视化</b><span>显示换行标记</span></div>
  <div class="it"><b>右键菜单</b><span>自定义 / 禁用菜单项、子菜单</span></div>
  <div class="it"><b>快捷键</b><span>自定义覆盖 / 禁用快捷键</span></div>
  <div class="it"><b>选区样式</b><span>选区颜色 / 透明度 / 最小宽度</span></div>
  <div class="it"><b>搜索匹配色</b><span>当前匹配 vs 导航匹配色</span></div>
  <div class="it"><b>resize 控件</b><span>调整手柄颜色 / 尺寸</span></div>
  <div class="it"><b>拖拽光标</b><span>拖拽光标宽度 / 颜色</span></div>
  <div class="it"><b>历史记录上限</b><span>historyMaxRecordCount</span></div>
  <div class="it"><b>页外禁用选区</b><span>pageOuterSelectionDisable</span></div>
  <div class="it"><b>字号上下限</b><span>minSize / maxSize</span></div>
  <div class="it"><b>热更新配置</b><span><code>updateOptions</code> 不重挂载更新</span></div>
  <div class="it"><b>命令拦截器</b><span><code>setInterceptor</code> 拦截全部命令调用(埋点 / 审计)</span></div>
</div>

### 打印与导出

<div class="feat">
  <div class="it"><b>打印</b><span>基于 canvas 转图片打印、可配置像素比</span></div>
  <div class="it"><b>图片导出</b><span>页面图片 base64</span></div>
  <div class="it"><b>HTML 导入导出</b><span>HTML 导入 / 导出</span></div>
  <div class="it"><b>纯文本导出</b><span>纯文本与数据序列化</span></div>
  <div class="it"><b>字数统计</b><span>Web Worker 异步统计</span></div>
  <div class="it"><b>插件扩展</b><span>Word(docx)、Excel、PDF</span></div>
</div>

### 性能

<div class="feat">
  <div class="it"><b>Web Worker</b><span>字数统计、目录生成、成组提取、异步取值 共 4 个</span></div>
  <div class="it"><b>渲染模式</b><span>极速模式(多字组合)、兼容模式(逐字渲染)</span></div>
</div>

### 辅助功能

<div class="feat">
  <div class="it"><b>无障碍</b><span>accessibility 可访问性</span></div>
  <div class="it"><b>标尺</b><span>可切换显示的标尺</span></div>
  <div class="it"><b>行号</b><span>每页 / 连续两种行号</span></div>
  <div class="it"><b>放大镜</b><span>可配置缩放、边框、尺寸</span></div>
  <div class="it"><b>占位文本</b><span>placeholder 提示</span></div>
  <div class="it"><b>遮盖边距</b><span>maskMargin 遮盖页边距区域</span></div>
  <div class="it"><b>开发调试工具</b><span>devtools 调试面板</span></div>
</div>

## API <Badge type="info" text="56" />

开发者命令式接口(<code>instance.command.\*</code>),按职责分组。

### 数据 API

<div class="feat">
  <div class="it"><b>数据存取</b><span><code>getValue</code> / <code>setValue</code></span></div>
  <div class="it"><b>异步取值</b><span><code>getValueAsync</code>(基于 Web Worker)</span></div>
  <div class="it"><b>HTML 存取</b><span><code>getHTML</code> / <code>setHTML</code></span></div>
  <div class="it"><b>文本与图片</b><span><code>getText</code>、<code>getImage</code></span></div>
  <div class="it"><b>配置与语言</b><span><code>getOptions</code> / <code>updateOptions</code>、<code>getLocale</code> / <code>executeSetLocale</code></span></div>
  <div class="it"><b>字数统计</b><span><code>getWordCount</code></span></div>
</div>

### 元素 API

<div class="feat">
  <div class="it"><b>查询</b><span><code>getElementById</code>(按 id / conceptId 定位)</span></div>
  <div class="it"><b>修改与删除</b><span><code>executeUpdateElementById</code>、<code>executeDeleteElementById</code></span></div>
  <div class="it"><b>插入与追加</b><span><code>executeInsertElementList</code>、<code>executeAppendElementList</code></span></div>
  <div class="it"><b>标题与控件</b><span><code>executeInsertTitle</code>、<code>executeInsertControl</code>、<code>executeRemoveControl</code></span></div>
</div>

### 选区 API

<div class="feat">
  <div class="it"><b>选区操作</b><span><code>getRange</code> / <code>executeSetRange</code> / <code>executeReplaceRange</code></span></div>
  <div class="it"><b>选区查询</b><span><code>getRangeText</code>、<code>getRangeContext</code>、<code>getRangeRow</code>、<code>getRangeParagraph</code></span></div>
  <div class="it"><b>关键词</b><span><code>getKeywordRangeList</code>、<code>getKeywordContext</code></span></div>
</div>

### 位置 API

<div class="feat">
  <div class="it"><b>光标位置</b><span><code>getCursorPosition</code></span></div>
  <div class="it"><b>位置上下文</b><span><code>executeSetPositionContext</code>、<code>getPositionContextByEvent</code></span></div>
  <div class="it"><b>搜索导航</b><span><code>getSearchNavigateInfo</code>(当前匹配信息)</span></div>
</div>

### 结构数据 API

<div class="feat">
  <div class="it"><b>控件</b><span><code>getControlValue</code>、<code>getControlList</code></span></div>
  <div class="it"><b>区域</b><span><code>getAreaValue</code></span></div>
  <div class="it"><b>成组</b><span><code>getGroupIds</code></span></div>
  <div class="it"><b>目录与标题</b><span><code>getCatalog</code>、<code>getTitleValue</code></span></div>
  <div class="it"><b>页面</b><span><code>getPaperMargin</code>、<code>getColumns</code></span></div>
</div>

### 测量 API

<div class="feat">
  <div class="it"><b>高度计算</b><span><code>computeElementListHeight</code>(元素占用高度)、<code>getRemainingContentHeight</code>(页剩余高度)</span></div>
</div>

### 渲染与焦点

<div class="feat">
  <div class="it"><b>强制重渲</b><span><code>executeForceUpdate</code></span></div>
  <div class="it"><b>焦点控制</b><span><code>executeFocus</code>、<code>executeBlur</code>、<code>executeHideCursor</code></span></div>
  <div class="it"><b>容器获取</b><span><code>getContainer</code>(编辑器 DOM 容器)</span></div>
</div>

### 历史与剪贴板

<div class="feat">
  <div class="it"><b>撤销重做</b><span><code>executeUndo</code>、<code>executeRedo</code></span></div>
  <div class="it"><b>剪贴板</b><span><code>executeCut</code>、<code>executeCopy</code>、<code>executePaste</code></span></div>
  <div class="it"><b>选区与删除</b><span><code>executeSelectAll</code>、<code>executeBackspace</code></span></div>
  <div class="it"><b>文字工具</b><span><code>executeWordTool</code></span></div>
</div>

### 格式命令

<div class="feat">
  <div class="it"><b>格式刷</b><span><code>executePainter</code>、<code>executeApplyPainterStyle</code>、<code>executeFormat</code></span></div>
  <div class="it"><b>字体字号</b><span><code>executeFont</code>、<code>executeSize</code>、<code>executeSizeAdd</code>、<code>executeSizeMinus</code></span></div>
  <div class="it"><b>字形</b><span><code>executeBold</code>、<code>executeItalic</code>、<code>executeUnderline</code>、<code>executeStrikeout</code>、<code>executeSuperscript</code>、<code>executeSubscript</code></span></div>
  <div class="it"><b>颜色</b><span><code>executeColor</code>、<code>executeHighlight</code></span></div>
  <div class="it"><b>段落</b><span><code>executeTitle</code>、<code>executeList</code>、<code>executeRowFlex</code>、<code>executeRowMargin</code></span></div>
</div>

### 插入命令

<div class="feat">
  <div class="it"><b>表格</b><span><code>executeInsertTable</code> 及行列增删、合并、拆分、边框、自适应等系列命令</span></div>
  <div class="it"><b>图片</b><span><code>executeImage</code>、<code>executeReplaceImageElement</code>、<code>executeSaveAsImageElement</code>、<code>executeSetImageCrop</code>、<code>executeSetImageCaption</code>、<code>executeChangeImageDisplay</code></span></div>
  <div class="it"><b>超链接</b><span><code>executeHyperlink</code>、<code>executeDeleteHyperlink</code>、<code>executeCancelHyperlink</code>、<code>executeEditHyperlink</code></span></div>
  <div class="it"><b>区域</b><span><code>executeInsertArea</code>、<code>executeSetAreaValue</code>、<code>executeSetAreaProperties</code>、<code>executeDeleteArea</code></span></div>
  <div class="it"><b>分割线与分页符</b><span><code>executeSeparator</code>、<code>executePageBreak</code></span></div>
  <div class="it"><b>水印</b><span><code>executeAddWatermark</code>、<code>executeDeleteWatermark</code></span></div>
</div>

### 搜索命令

<div class="feat">
  <div class="it"><b>搜索</b><span><code>executeSearch</code>、<code>executeSearchNavigatePre</code>、<code>executeSearchNavigateNext</code></span></div>
  <div class="it"><b>替换</b><span><code>executeReplace</code></span></div>
</div>

### 页面命令

<div class="feat">
  <div class="it"><b>页面模式</b><span><code>executePageMode</code>(分页 / 连页)</span></div>
  <div class="it"><b>缩放</b><span><code>executePageScale</code>、<code>executePageScaleRecovery</code>、<code>executePageScaleAdd</code>、<code>executePageScaleMinus</code></span></div>
  <div class="it"><b>纸张</b><span><code>executePaperSize</code>、<code>executePaperDirection</code>、<code>executePageDirection</code>、<code>executeSetPaperMargin</code></span></div>
  <div class="it"><b>分栏</b><span><code>executeSetColumns</code></span></div>
  <div class="it"><b>区域与徽章</b><span><code>executeSetZone</code>、<code>executeSetMainBadge</code>、<code>executeSetAreaBadge</code></span></div>
</div>

### 模式与状态

<div class="feat">
  <div class="it"><b>编辑模式</b><span><code>executeMode</code>(8 种模式切换)</span></div>
  <div class="it"><b>留痕与对比</b><span><code>executeToggleTrace</code>、<code>executeCompare</code></span></div>
  <div class="it"><b>涂鸦</b><span><code>executeClearGraffiti</code></span></div>
  <div class="it"><b>标尺</b><span><code>executeToggleRuler</code></span></div>
</div>

### 定位命令

<div class="feat">
  <div class="it"><b>目录定位</b><span><code>executeLocationCatalog</code></span></div>
  <div class="it"><b>控件定位</b><span><code>executeLocationControl</code>、<code>executeJumpControl</code></span></div>
  <div class="it"><b>组成组定位</b><span><code>executeLocationGroup</code></span></div>
  <div class="it"><b>区域定位</b><span><code>executeLocationArea</code></span></div>
</div>

### 打印

<div class="feat">
  <div class="it"><b>打印</b><span><code>executePrint</code>(可配置像素比)</span></div>
</div>

::: tip 完整命令参考
本页仅列代表性命令。**完整命令(共 154+)** 详见 [执行动作命令](./command-execute) 与 [获取数据命令](./command-get)。
:::
