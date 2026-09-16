# 苗绣文化专题站 · 针尖上的迁徙

一个纯静态（HTML + CSS + 原生 JS，**无后端、无构建依赖、无外部 CDN**）的苗绣文化多页面专题站。

## 页面结构

| 页面 | 文件 | 说明 |
| --- | --- | --- |
| 首页 | `index.html` | 主题导览、五大章节入口、数据概览 |
| 源流 | `origin.html` | 历史时间轴、六大地域流派、文化母题 |
| 服饰纹样 | `patterns.html` | 十大纹样母题，按分类筛选，**从 JSON 渲染** |
| 针法步骤 | `stitches.html` | 五种针法 SVG 分步演示，**支持分步播放与断点恢复** |
| 代表作品 | `works.html` | 八件代表作品，**从 JSON 加载**、按地区筛选 |
| 当代设计 | `contemporary.html` | 六个当代活化案例，从 JSON 加载 |

## 数据（按 schema 组织）

数据均在 `data/` 目录，每个文件首行 `schema` 字段标明版本：

- `origin.json` → `miao-embroidery.origin/v1`：`timeline` / `schools` / `motifs`
- `patterns.json` → `miao-embroidery.patterns/v1`：`categories` / `patterns[]`（含 `motif` 图键）
- `stitches.json` → `miao-embroidery.stitches/v1`：`stitches[].diagram.steps[]`，每步是一组 SVG 图元
- `works.json` → `miao-embroidery.works/v1`：代表作品条目（文化示意，非馆藏精确著录）
- `contemporary.json` → `miao-embroidery.contemporary/v1`：当代设计案例（方向性整理）

> 因浏览器安全策略，`fetch()` 加载本地 JSON 在 `file://` 下会被拦截，请用本地服务器访问。

## 本地运行

```bash
npm start          # 零依赖静态服务器 http://localhost:8080（优先服务 dist/）
# 或
node scripts/serve.js
PORT=9000 node scripts/serve.js
```

## 静态构建与报告

```bash
npm run build
```

- 清理并复制站点到 `dist/`
- 扫描 HTML/CSS/JS 的本地引用，校验断链
- 生成 `dist/asset-manifest.json`（文件清单、字节数、sha256 短哈希）
- 生成 `reports/broken-links.json`（扫描文件、引用总数、断链明细）；存在断链时退出码为 1

## 自动化检查

```bash
npm run check      # 或 npm test（检查 + 构建）
```

`scripts/check-a11y.js` 共 46 项断言，覆盖：

- **移动端汉堡菜单焦点**：`aria-expanded/controls`、默认收起、打开焦点入内、Tab/Shift+Tab 焦点陷阱、Esc 关闭并还原焦点、桌面断点复位
- **动画减弱**：`prefers-reduced-motion` 媒体查询、页脚手动开关、`localStorage` 持久化、跟随系统变化、播放器在减弱模式禁用自动播放
- **基础无障碍**：`lang`、skip-link、唯一 `h1`、地标与标签、`aria-live`、`role="progressbar"`、可访问名称、`:focus-visible`、输出转义
- **schema 与断点恢复**：数据 schema 标识、每针法分步图元、播放器进度持久化、恢复横幅、切后台/离开保存

报告写入 `reports/a11y-check.json`，任一失败退出码为 1，可直接接入 CI。

## 针法播放器交互

- ▶ 播放（每 1.8 秒推进一步，结束自动暂停）/ ⏸ 暂停 / 上一步 / 下一步 / 重置
- 键盘 `←` / `→` 单步切换
- 进度（针法 id + 步骤）存于 `localStorage` 键 `mx.stitchPlayer.v1`，再次进入显示“继续观看”横幅
- 切到其他标签页或关闭页面前自动保存
- 开启“减弱动态效果”后自动播放禁用，仅保留即时的单步切换

## 目录

```
├── index.html / origin.html / patterns.html / stitches.html / works.html / contemporary.html
├── css/styles.css          # 全站样式（含响应式、reduced-motion）
├── js/
│   ├── main.js             # 汉堡导航（焦点管理）+ 动画减弱设置
│   ├── motifs.js           # 纹样 SVG 渲染器（内联，无图片资源）
│   ├── patterns.js         # 纹样数据加载与筛选
│   ├── player.js           # 针法分步播放器（断点恢复）
│   ├── works.js            # 作品数据加载与筛选
│   └── cases.js            # 当代案例数据加载
├── data/*.json             # 五个 schema 数据文件
├── scripts/build.js        # 静态构建：manifest + 断链报告
├── scripts/check-a11y.js   # 自动化检查
├── scripts/serve.js        # 零依赖静态服务器
└── reports/                # 检查与断链报告输出
```

## 内容声明

苗绣作品与当代案例条目为**文化传播与教学演示**层面的代表性/方向性整理，并非博物馆馆藏精确著录或商业背书；具体史实与品牌信息请以权威公开资料为准。
