# EmoHub

## What This Is

个人表情包管理系统（Web），支持拖拽上传、智能标签分类、文本搜索和响应式布局。v1.0 已交付完整的上传→标签→搜索工作流，服务于 4000+ 张表情包的收藏整理需求。

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

### Active

- [ ] 标签分类支持（角色/系列/关键词维度）
- [ ] 标签组合搜索（AND/OR 逻辑）
- [ ] CLIP 向量相似度搜索
- [ ] 以图搜图（上传图片查找相似）
- [ ] OCR 文字搜索（提取图片中的文字）
- [ ] 键盘快捷键操作
- [ ] 复制图片到剪贴板
- [ ] 图片信息展示（尺寸、大小、上传时间）
- [ ] 搜索历史记录

### Out of Scope

- 移动端（React Native）— v1 聚焦 Web，PWA 可覆盖基本需求
- 桌面端（Electron）— 优先级低，Web 够用
- 多用户认证 — 个人工具，不需要用户系统
- 对象存储（S3/MinIO）— 本地存储足够，后续可迁移
- 社交功能（分享、导出）— 个人工具
- AI 自动标签/角色识别 — v2+ 考虑
- 实时同步（WebSocket）— 单端使用
- 动图播放/编辑 — 复杂度高，非核心需求

## Context

Shipped v1.0 with 4,351 LOC TypeScript/TSX.
Tech stack: bun 1.3.9 + React 18 + Vite + Fastify 4 + Prisma 6 + SQLite.
Monorepo structure: packages/shared, packages/server, apps/web.
Image processing: Sharp (compression + thumbnails), SHA-256 dedup.
UI: TanStack Virtual (virtual scroll), Zustand (state), react-dropzone, yet-another-react-lightbox.

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
| SQLite + Prisma 6 | 轻量级，避免 PostgreSQL 运维成本；Prisma 6 比 7 稳定 | ✓ Good |
| Monorepo (bun workspace) | 共享类型和工具代码，为后续多端扩展做准备 | ✓ Good |
| Sharp 图片处理 | 高性能压缩 + 缩略图生成，GIF 动图支持 | ✓ Good |
| TanStack Virtual 虚拟滚动 | 4000+ 图片流畅渲染，动态列数计算 | ✓ Good |
| react-tag-autocomplete | 标签输入自动补全 + 内联创建，开箱即用 | ✓ Good |
| 400ms 搜索防抖 | 平衡响应速度和请求频率 | ✓ Good |
| Mobile-first CSS | 渐进增强，三档断点（768/1024px） | ✓ Good |

---
*Last updated: 2026-02-12 after v1.0 milestone*
