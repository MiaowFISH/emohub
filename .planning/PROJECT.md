# EmoHub

## What This Is

个人表情包管理系统（Web），支持拖拽上传、智能标签分类、文本搜索和响应式布局。v1.1 在 v1.0 基础上增加了暗色模式、中英双语、剪贴板复制、骨架屏加载和平滑过渡动画，全面打磨使用体验。

## Core Value

用户能快速给表情包打标签并通过标签搜索找到想要的图片。

## Requirements

### Validated

- ✓ 图片上传（拖拽、批量、重复检测） — v1.0
- ✓ 图片删除（单张/批量） — v1.0
- ✓ 图片查看（虚拟滚动网格、大图预览） — v1.0
- ✓ 图片压缩（上传时自动优化 + 缩略图） — v1.0
- ✓ GIF 转换（一键转单帧 GIF） — v1.0
- ✓ 多标签支持（一张图片多个标签） — v1.0
- ✓ 标签管理（创建、删除、重命名） — v1.0
- ✓ 标签筛选（侧边栏 checkbox 过滤） — v1.0
- ✓ 批量标签操作（选中多张图片添加/移除标签） — v1.0
- ✓ 文本搜索（文件名 + 标签名匹配） — v1.0
- ✓ 响应式布局（移动端/平板/桌面端自适应） — v1.0
- ✓ 设置页面（主题和语言偏好集中管理） — v1.1
- ✓ 设置即时生效（无需刷新页面） — v1.1
- ✓ 暗色模式（light/dark/system 三档切换） — v1.1
- ✓ 主题偏好持久化（刷新后保持） — v1.1
- ✓ 系统主题跟随（自动匹配 OS 主题变化） — v1.1
- ✓ 中英双语切换 — v1.1
- ✓ 语言偏好持久化 — v1.1
- ✓ 全 UI 翻译键渲染（零硬编码字符串） — v1.1
- ✓ 一键复制图片到剪贴板 — v1.1
- ✓ 复制格式可选（原图 PNG / GIF） — v1.1
- ✓ 复制操作 toast 反馈 — v1.1
- ✓ 组件视觉层次区分（按钮层级、卡片样式） — v1.1
- ✓ 骨架屏加载 + 上下文空状态引导 — v1.1
- ✓ 平滑过渡动画（hover、modal、主题切换） — v1.1
- ✓ 动画尊重 prefers-reduced-motion — v1.1

### Active

<!-- Next Milestone: v1.2+ -->

- [ ] 批量下载图片（ZIP 打包）
- [ ] 键盘快捷键操作
- [ ] 图片信息展示（尺寸、大小、上传时间）
- [ ] 搜索历史记录
- [ ] 标签分类支持（角色/系列/关键词维度）
- [ ] 标签组合搜索（AND/OR 逻辑）

### Out of Scope

- 移动端（React Native）— v1 聚焦 Web，PWA 可覆盖基本需求
- 桌面端（Electron）— 优先级低，Web 够用
- 多用户认证 — 个人工具，不需要用户系统
- 对象存储（S3/MinIO）— 本地存储足够，后续可迁移
- 社交功能（分享、导出）— 个人工具
- 实时同步（WebSocket）— 单端使用
- 动图播放/编辑 — 复杂度高，非核心需求
- 自定义主题颜色 — light/dark 两档足够
- 翻译管理 UI — JSON 文件直接编辑即可
- 高级剪贴板格式（WebP/AVIF）— 浏览器 Clipboard API 支持有限

## Context

Shipped v1.1 with 5,537 LOC TypeScript/TSX/CSS.
Tech stack: bun 1.3.9 + React 18 + Vite + Fastify 4 + Prisma 6 + SQLite.
Monorepo structure: packages/shared, packages/server, apps/web.
Image processing: Sharp (compression + thumbnails), SHA-256 dedup.
UI: TanStack Virtual (virtual scroll), Zustand (state + settings persist), react-dropzone, yet-another-react-lightbox.
i18n: react-i18next with 3 namespaces (common, settings, images), bidirectional store sync.
Theming: CSS variables (39 semantic tokens), FOUC prevention inline script, sonner toast notifications.
Animations: CSS transition utilities, focus-visible states, reduced-motion support.

## Constraints

- **包管理**: bun@1.3.9 — 项目统一使用 bun
- **运行时**: Node.js 22+ — 服务端运行环境
- **数据库**: SQLite + Prisma 6 — 个人工具，轻量级方案
- **存储**: 本地文件系统 — 简单直接，4000+ 张图片可承受

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 服务端向量化而非客户端 | 统一处理保证一致性，~50ms/张性能可接受 | — Pending (v2) |
| Web 优先，移动端延后 | 个人工具场景，Web 端满足核心需求 | ✓ Good |
| 本地存储而非对象存储 | 个人使用规模，简化部署 | ✓ Good |
| SQLite + Prisma 6 | 轻量级，避免 PostgreSQL 运维成本 | ✓ Good |
| Monorepo (bun workspace) | 共享类型和工具代码 | ✓ Good |
| Sharp 图片处理 | 高性能压缩 + 缩略图生成 | ✓ Good |
| TanStack Virtual 虚拟滚动 | 4000+ 图片流畅渲染 | ✓ Good |
| react-tag-autocomplete | 标签输入自动补全 + 内联创建 | ✓ Good |
| 400ms 搜索防抖 | 平衡响应速度和请求频率 | ✓ Good |
| Mobile-first CSS | 渐进增强，三档断点 | ✓ Good |
| CSS-only dark mode | 零依赖，39 个语义变量，FOUC 防闪烁 | ✓ Good |
| react-i18next | Vite+React 最灵活方案，22KB bundle | ✓ Good |
| Sonner toast 通知 | 轻量 22KB，支持系统主题 | ✓ Good |
| Clipboard API + PNG 转换 | API 要求 PNG 格式，服务端 GIF 转换 | ✓ Good |
| CSS 按钮层级系统 | 替代 150+ 行内联样式，可维护性提升 | ✓ Good |
| CSS transition utilities | 统一动画时序，reduced-motion 无障碍 | ✓ Good |
| 默认语言 zh | EmoHub 是中文表情包工具 | ✓ Good |
| 双向 i18next-store 同步 | 事件监听避免循环导入 | ✓ Good |

---
*Last updated: 2026-02-13 after v1.1 milestone*
