---
version: alpha
name: vibeview-design-system
description: "vibeview 设计系统规范 —— 专为极速、高质感、内容优先的技术文档与静态素材浏览器量身打造。参考 Linear、Vercel 与 Raycast 的顶级工程实践，以深邃近黑画布 (#0b0d10) 为基底，通过严格的表面阶梯 (Surface Ladder)、极细发丝边框 (1px hairline) 和负字距几何排版 (Tight Technical Sans) 构建 IDE 级沉浸式桌面浏览质感。"

colors:
  canvas: "#0b0d10"
  surface-1: "#12151a"
  surface-2: "#181c24"
  surface-3: "#1f242e"
  hairline: "rgba(255, 255, 255, 0.08)"
  hairline-dashed: "rgba(255, 255, 255, 0.05)"
  hairline-strong: "rgba(255, 255, 255, 0.16)"
  hairline-active: "rgba(88, 166, 255, 0.35)"
  primary: "#58a6ff"
  on-primary: "#ffffff"
  primary-hover: "#79b8ff"
  primary-active: "rgba(88, 166, 255, 0.12)"
  primary-focus: "rgba(88, 166, 255, 0.55)"
  ink: "rgba(240, 246, 252, 0.92)"
  ink-heading: "rgba(240, 246, 252, 0.98)"
  ink-muted: "rgba(139, 148, 158, 0.75)"
  ink-code: "rgba(240, 246, 252, 0.88)"
  semantic-danger: "#f85149"
  checkerboard-base: "#0b0d10"
  checkerboard-panel: "#12151a"

typography:
  display-xl:
    fontFamily: var(--ui)
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.03em
  display-lg:
    fontFamily: var(--ui)
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.30
    letterSpacing: -0.02em
  heading-md:
    fontFamily: var(--ui)
    fontSize: 17px
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: -0.01em
  body-md:
    fontFamily: var(--content)
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.70
    letterSpacing: 0
  body-sm:
    fontFamily: var(--ui)
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: 0
  body-xs:
    fontFamily: var(--ui)
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.40
    letterSpacing: 0
  caption-mono:
    fontFamily: var(--mono)
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1.30
    letterSpacing: 0
  code-block:
    fontFamily: var(--mono)
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.60
    letterSpacing: 0
  code-inline:
    fontFamily: var(--mono)
    fontSize: 0.88em
    fontWeight: 400
    letterSpacing: 0
  button:
    fontFamily: var(--ui)
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.20
    letterSpacing: 0

rounded:
  none: 0px
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px

spacing:
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
  canvas-gap: 12px

components:
  app-shell:
    display: grid
    gridTemplateColumns: "320px 1fr"
    gap: "{spacing.canvas-gap}"
    padding: "{spacing.canvas-gap}"
  panel:
    backgroundColor: "{colors.surface-1}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.lg}"
    backdropBlur: "16px"
    shadow: "0 2px 12px rgba(0, 0, 0, 0.08)"
  button-standard:
    backgroundColor: "{colors.surface-2}"
    borderColor: "{colors.hairline}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
    typography: "{typography.button}"
  button-icon:
    backgroundColor: "{colors.surface-2}"
    borderColor: "{colors.hairline}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    size: "32px"
  tree-row:
    height: "28px"
    padding: "5px 8px"
    rounded: "{rounded.sm}"
    typography: "{typography.body-sm}"
  tree-row-active:
    backgroundColor: "{colors.primary-active}"
    borderColor: "{colors.hairline-active}"
    textColor: "{colors.ink-heading}"
    rounded: "{rounded.sm}"
  input-text:
    backgroundColor: "{colors.surface-2}"
    borderColor: "{colors.hairline}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "7px 10px"
    typography: "{typography.body-xs}"
  floating-toolbar:
    backgroundColor: "{colors.surface-1}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.lg}"
    padding: "5px 10px"
    backdropBlur: "12px"
    shadow: "0 4px 16px rgba(0, 0, 0, 0.18)"
  keycap-badge:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.caption-mono}"
    rounded: "{rounded.xs}"
    padding: "2px 7px"
---

# vibeview DESIGN.md

vibeview 是一款面向现代开发者的本地技术文档与多格式素材浏览器。
设计哲学遵循 **"Content First, Subtle Chrome"（内容第一，克制界面）**，吸收 Linear 的深邃秩序感、Vercel 的工程排版严谨度以及 Raycast 的命令台级微交互质感。

---

## 1. 核心设计哲学 (Core Philosophy)

1. **内容做主角，界面做幕布 (Content is the Protagonist)**
   - 界面是呈现 Markdown、Mermaid 架构图、高分辨率设计配图与交互 HTML 的载体。
   - 彻底消灭廉价大光晕与眩目渐变，使用极细发丝线 (1px hairline) 和微柔阴影界定区域。
2. **零意外行为与无缝工作流 (Predictable & Unbroken Workflow)**
   - 所有的过渡和折叠均采用工业级平滑曲线（`0.15s cubic-bezier(0.16, 1, 0.3, 1)`），杜绝任何生硬跳变。
   - 文件树提供精确到行高的平滑滚动与自动追踪。
3. **数据结构定型，消除特例 (Good Taste in Design Structures)**
   - 严格落实 4px 栅格与固定圆角令牌系统（`xs: 4px`, `sm: 6px`, `md: 8px`, `lg: 12px`）。
   - 绝不在组件层随意手写魔数尺寸与零散圆角。

---

## 2. 颜色系统与阶梯 (Color System & Surface Ladder)

### 2.1 表面阶梯 (Surface Elevation)
vibeview 依靠 **表面明度阶梯 + 1px 发丝边框** 表达景深层次，而非依赖大投影：

- **Canvas（画布底层）**：`#0b0d10` —— 全屏底座，稳固近黑。
- **Surface 1（主面板层）**：`#12151a` (90% 半透明 + 16px 毛玻璃) —— 侧边栏与主阅读区。
- **Surface 2（内嵌控件层）**：`#181c24` —— 按钮底色、输入框底色、代码块底色。
- **Surface 3（悬浮/高亮层）**：`#1f242e` —— 浮动工具条、状态徽章、悬停提亮。

### 2.2 边框规范 (Hairline Rules)
- **常规卡片与面板边框**：`1px solid rgba(255, 255, 255, 0.08)`
- **次级分隔线**：`1px solid rgba(255, 255, 255, 0.05)`
- **激活/聚焦指示环**：`1px solid rgba(88, 166, 255, 0.35)` + `3px 呼吸光晕`

---

## 3. 排版体系 (Typography & Rhythm)

技术文档与代码需要极具亲和力但严谨的排版体系：

| 层级 Token | 字号 | 字重 | 行高 | 字距 (Tracking) | 使用场景 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `display-xl` | 32px | 600 | 1.25 | `-0.03em` | Markdown 一级主标题 (H1) |
| `display-lg` | 22px | 600 | 1.30 | `-0.02em` | 二级分节标题 (H2) |
| `heading-md` | 17px | 600 | 1.35 | `-0.01em` | 三级子标题 (H3) |
| `body-md` | 15px | 400 | 1.70 | `0` | Markdown 默认正文段落 |
| `body-sm` | 13px | 400 | 1.50 | `0` | 侧边栏目录节点、表格单元格 |
| `body-xs` | 12px | 400 | 1.40 | `0` | 路径元信息、设置项说明标签 |
| `caption-mono`| 11px | 500 | 1.30 | `0` | 缩放百分比、文件大小、时间戳 |
| `code-block` | 13px | 400 | 1.60 | `0` | 代码块 (JetBrains Mono / Shiki) |
| `code-inline` | 0.88em | 400 | - | `0` | 行内单行代码 `code` |

### 排版铁律
- **严禁使用衬线字体阅读技术文档**：统一使用 `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`。
- **标题必须紧致负字距**：大字号标题注入 `-0.02em ~ -0.03em` 负字距，锁紧视觉重心。
- **等宽代码字体栈**：`"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, monospace`。

---

## 4. 核心组件与交互规范 (Component Specifications)

### 4.1 侧边栏与文件树 (Sidebar & Tree)
- **展开/收起交互**：
  - 收起时通过 CSS 网格 `0px 1fr` 弹性塌陷，左上角悬浮紧凑展开药丸 (`34x34px, radius-md`)。
- **语义化文件图标**：
  - 图片文件：展示紧凑微矩形相框 SVG。
  - 网页 HTML：展示语义化标签角标 `</>`。
  - 普通 Markdown：展示文本折角文档图标。
  - 文件夹：展示微动态旋转箭头（展开平滑旋转 90 度）。

### 4.2 全画幅图片与画布查看器 (Image & Canvas Viewer)
- **初始态**：默认 100% 自适应占满右侧视口，预留舒适边距 (`max-width: 96%, max-height: 96%`)。
- **底衬设计**：采用柔和低对比微棋盘网格 (`repeating-conic-gradient`)，完美展现透明 PNG 与纯白 SVG 边缘。
- **右上角悬浮毛玻璃控制条 (Floating Island)**：
  - 药丸容器背景 `rgba(18, 21, 26, 0.85)`，模糊度 `12px`。
  - 提供实时缩放率（如 `150%`）、`+`、`−`、`适应`、`1:1`、`全屏`。
- **手势与控制**：
  - 支持滚轮实时多级缩放（10% ~ 800%）。
  - 按住鼠标左键任意抓手拖拽平移。
  - 全屏状态支持按 `Esc` 或关闭按钮随时无缝退出。

### 4.3 路径元信息与复制动作 (Path Header & Copy)
- 顶部导航采用精炼单行排版：
  - 绝对路径采用 `font-mono, 12px`，单行溢出省略。
  - 紧跟微型操作胶囊：`复制` / `已复制`，点击触发剪贴板复制并提供 1.5s 柔和文字反馈。
  - 定位准星按钮（📍 改为纯净矢量十字准星）可将侧边栏瞬间平滑居中滚动至当前激活项。

### 4.4 极细滚动条规范 (Hairline Scrollbars)
- 宽度一律收敛至 `6px`。
- 滑道纯透明 (`background: transparent`)。
- 滑块采用高半透明发丝色 (`rgba(255, 255, 255, 0.12)`)，悬停提亮至 `rgba(255, 255, 255, 0.25)`。

---

## 5. 准则与反模式 (Do's & Don'ts)

### ✅ 推荐 (Do)
- 始终以 4px 倍数规划组件内边距与外间距 (`4px, 8px, 12px, 16px, 24px, 32px`)。
- 任何卡片与面板使用 `rounded-lg (12px)`；任何按钮与输入框使用 `rounded-md (8px)`。
- 对所有高频操作（路径复制、文件重载、缩放重置）提供直观的微交互即时反馈。
- 图片与 HTML 预览默认占满可用可视区域，最大化阅读工作台利用率。

### ❌ 禁止 (Don't)
- **禁止使用未经打磨的原生字符或 Emoji 作为操作按钮**（如 `◀` / `▶` / `📍` / `+` / `-`，一律使用精密内联 SVG）。
- **禁止粗暴使用全黑 (`#000000`) 作为主背景**（必须使用近黑灰调 `#0b0d10`，保证长时间阅读不刺眼）。
- **禁止在技术文档上引入多余的复杂光晕或彩虹渐变**。
- **禁止直接截断超长路径**（必须提供 title tooltip 或一键拷贝能力）。
