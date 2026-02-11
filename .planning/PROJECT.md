# EmoHub

## What This Is

个人跨平台表情包管理系统，支持智能标签分类、CLIP 向量搜索和多端同步。v1 聚焦 Web 端，提供上传、标签管理和搜索功能，服务于个人表情包收藏整理需求。

## Core Value

用户能快速给表情包打标签并通过标签/向量搜索找到想要的图片。

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] 图片上传（拖拽、批量）
- [ ] 图片删除（单张/批量）
- [ ] 图片查看（大图预览、瀑布流布局）
- [ ] 图片压缩（上传时自动优化）
- [ ] 多标签支持（一张图片多个标签）
- [ ] 标签分类（角色/系列/关键词）
- [ ] 标签管理（创建、删除、重命名）
- [ ] 批量编辑标签
- [ ] 标签组合搜索（AND/OR）
- [ ] 向量搜索（CLIP 相似图片）
- [ ] 以图搜图
- [ ] OCR 文字搜索
- [ ] 服务端 CLIP 向量化（~50ms/张）
- [ ] 本地文件存储

### Out of Scope

- 移动端（React Native）— v1 聚焦 Web，后续迭代
- 桌面端（Electron）— 优先级低，Web 够用
- 多用户认证 — 个人工具，不需要用户系统
- 对象存储（S3/MinIO）— 本地存储足够，后续可迁移
- 社交功能（分享、导出）— v2 考虑
- AI 自动标签/角色识别 — v2 考虑
- 实时同步（WebSocket）— 单端使用，暂不需要
- 批量导入现有图片 — 系统建好后再处理

## Context

- 用户有 4000+ 张表情包需要管理，以收藏整理为主要使用场景
- SEPC.md 已定义完整技术方案，包括 monorepo 结构、API 设计、数据库 schema
- 技术栈已确定：bun 1.3.9 + React 18 + Vite + Fastify 4 + Prisma + sqlite-vss
- CLIP 模型：Xenova/clip-vit-base-patch32，512 维向量
- OCR：Tesseract.js，支持中英文

## Constraints

- **包管理**: bun@1.3.9 — 项目统一使用 bun
- **运行时**: Node.js 22+ — 服务端运行环境
- **数据库**: SQLite + sqlite-vss — 个人工具，轻量级方案
- **向量化**: 服务端统一处理 — 客户端只做预处理（压缩/裁剪到 224x224）
- **存储**: 本地文件系统 — 简单直接，4000+ 张图片可承受

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 服务端向量化而非客户端 | 统一处理保证一致性，~50ms/张性能可接受 | — Pending |
| Web 优先，移动端延后 | 个人工具场景，Web 端满足核心需求 | — Pending |
| 本地存储而非对象存储 | 个人使用规模，简化部署 | — Pending |
| SQLite + sqlite-vss | 轻量级，适合个人工具，避免 PostgreSQL 运维成本 | — Pending |
| Monorepo (bun workspace) | 共享类型和工具代码，为后续多端扩展做准备 | — Pending |

---
*Last updated: 2026-02-11 after initialization*
