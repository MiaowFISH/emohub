## 📋 EmoHub - 功能需求文档

### 项目愿景
跨平台表情包管理系统，支持智能标签分类、向量搜索、多端同步

---

## 🎯 核心功能（MVP）

### 1. 图片管理
- [x] 上传图片（支持拖拽、批量上传）
- [x] 删除图片（单张/批量）
- [x] 查看图片（大图预览、瀑布流布局）
- [x] 图片信息（尺寸、大小、上传时间）
- [x] 图片压缩（自动优化存储）

### 2. 标签系统
- [x] 多标签支持（一张图片可以有多个标签）
- [x] 标签分类（角色/系列/关键词）
- [x] 标签管理（创建、删除、重命名）
- [x] 批量编辑标签（选中多张图片，批量打标）
- [x] 标签组合搜索（AND/OR逻辑）
- [x] 标签推荐（基于历史使用）

### 3. 智能搜索
- [x] 标签搜索（支持组合查询）
- [x] 向量搜索（相似图片推荐）
- [x] 以图搜图（上传图片查找相似）
- [x] OCR文字搜索（提取图片中的文字）
- [x] 搜索历史记录

### 4. 多平台同步
- [x] 服务端-客户端同步
- [x] 增量同步（只同步变化的）
- [x] 冲突解决（服务端优先/本地优先/手动选择）
- [x] 离线支持（本地缓存）
- [x] 同步状态指示（同步中/已完成/失败）

---

## 🌟 高级功能（v2.0）

### 5. AI辅助
- [ ] 自动标签（基于CLIP识别图片内容）
- [ ] 角色识别（训练二次元角色分类器）
- [ ] 情感分析（开心、难过、惊讶等）
- [ ] 风格识别（手绘、3D、像素风）

### 6. 社交功能
- [ ] 分享表情包（生成分享链接）
- [ ] 导出/导入表情包包（zip格式）
- [ ] 表情包统计（使用频率、热门标签）

### 7. 高级搜索
- [ ] 时间范围搜索
- [ ] 尺寸筛选
- [ ] 颜色筛选（主色调）
- [ ] 保存搜索条件

---

## 💻 技术栈

### 前端
**Web端**
```
- 包管理: yarn 4.12.0 + turbo 2.8.6
- 框架: React 18 + TypeScript 5.9.3
- 构建工具: Vite 5
- UI库: Tailwind CSS + shadcn/ui（组件库）
- 路由: React Router v6
- 状态管理: Zustand（轻量级）
- 图片处理: browser-image-compression
- 向量计算: @xenova/transformers（本地CLIP）
- OCR: tesseract.js
```

**移动端**
```
- 框架: React Native + Expo
- 路由: React Navigation
- UI库: NativeWind（Tailwind for RN）
- 状态管理: Zustand（与Web端共享）
- 图片处理: expo-image-manipulator
- 文件存储: expo-file-system
- 向量计算: @xenova/transformers
```

**桌面端（可选）**
```
- 框架: Electron + React
- 打包: electron-builder
- 复用Web端代码
```

### 后端
```
- 运行时: Node.js 22+
- 框架: Fastify 4（比Express快2-3倍）
- ORM: Prisma（类型安全）
- 数据库: SQLite（开发） / PostgreSQL（生产）
- 向量搜索: sqlite-vss（SQLite） / pgvector（PostgreSQL）
- 认证: JWT（可选）
- 文件存储: Local / S3兼容（MinIO）
- WebSocket: fastify-websocket（实时同步）
```

### AI/向量
```
- 图片向量化: CLIP（Xenova/clip-vit-base-patch32）
  - 维度: 512
  - 模型大小: ~300MB
  - 推理时间: ~100ms/张（浏览器本地）
  
- OCR: Tesseract.js
  - 语言: chi_sim（简体中文）、eng（英文）
  
- 文本搜索: transformers.js（CLIP text encoder）
```

### 开发工具
```
- 代码检查: ESLint + Prettier
- 类型检查: TypeScript strict mode
- 测试: Vitest（单元测试）、Playwright（E2E）
- 版本控制: Git
- 部署: Docker（服务端）、Expo EAS（移动端）
```

---

## 📁 项目结构

```
emohub/
├── apps/
│   ├── web/                    # Web端（React + Vite）
│   │   ├── src/
│   │   │   ├── components/     # 公共组件
│   │   │   ├── pages/          # 页面
│   │   │   ├── hooks/          # React hooks
│   │   │   ├── services/       # API调用
│   │   │   ├── stores/         # Zustand状态
│   │   │   └── utils/          # 工具函数
│   │   └── package.json
│   ├── mobile/                 # 移动端（React Native）
│   │   ├── src/
│   │   ├── app.json
│   │   └── package.json
│   └── desktop/                # 桌面端（Electron，可选）
│       └── package.json
├── packages/
│   ├── server/                 # 服务端（Fastify）
│   │   ├── src/
│   │   │   ├── routes/         # API路由
│   │   │   ├── services/       # 业务逻辑
│   │   │   ├── models/         # Prisma模型
│   │   │   └── utils/          # 工具函数
│   │   └── package.json
│   ├── shared/                 # 共享代码
│   │   ├── types/              # TypeScript类型
│   │   ├── constants/          # 常量
│   │   └── utils/              # 工具函数
│   └── ui/                     # 共享UI组件
│       └── package.json
├── prisma/
│   ├── schema.prisma           # 数据库模型
│   └── seed.ts                 # 初始数据
├── docs/                       # 文档
├── scripts/                    # 脚本
└── package.json                # Monorepo根
```

---

## 🗄️ 数据库Schema

### 向量索引（SQLite）

---

## 🔌 API设计

### 图片管理

### 标签管理

### 搜索

### 同步

---

## 🎨 UI设计

### Web端页面结构

### 移动端页面结构

### 核心组件
---

## 🚀 实现路线图

### Phase 1: 基础设施（Week 1）
- [x] 初始化Monorepo结构
- [x] 配置TypeScript、ESLint、Prettier
- [x] 设置Prisma + SQLite数据库
- [x] 搭建Fastify服务端框架
- [x] 配置Vite + React Web端

### Phase 2: 核心功能（Week 2-3）
- [x] 图片上传/删除API
- [x] 图片存储（本地文件系统）
- [x] 标签CRUD API
- [x] 图片-标签关联API
- [x] Web端图片展示（瀑布流）
- [x] Web端标签管理UI

### Phase 3: 智能搜索（Week 3-4）
- [x] 集成transformers.js（CLIP）
- [x] 图片向量化（上传时）
- [x] 向量搜索API
- [x] 以图搜图功能
- [x] 集成tesseract.js（OCR）
- [x] OCR文字搜索

### Phase 4: 移动端（Week 4-5）
- [x] 初始化React Native + Expo
- [x] 配置NativeWind
- [x] 复用共享代码（types、utils、stores）
- [x] 移动端图片展示
- [x] 移动端上传功能
- [x] 移动端标签管理

### Phase 5: 同步系统（Week 5-6）
- [x] 同步API设计
- [x] 增量同步逻辑
- [x] WebSocket实时同步
- [x] 冲突解决策略
- [x] 离线缓存机制
- [x] 同步状态UI

### Phase 6: 优化与部署（Week 6-7）
- [x] 性能优化（图片懒加载、虚拟滚动）
- [x] 打包配置（Electron、Expo EAS）
- [x] Docker部署（服务端）
- [x] 文档编写
- [x] 测试（单元测试、E2E测试）

---

## 📊 关键指标

### 性能目标
- 图片上传：单张<2秒，批量10张<15秒
- 向量化速度：~100ms/张（浏览器本地）
- 搜索响应：<500ms
- 页面首屏：<2s（3G网络）

### 兼容性
- Web：Chrome 90+、Safari 14+、Firefox 88+
- Mobile：iOS 14+、Android 10+
- Desktop：macOS 11+、Windows 10+、Ubuntu 20+

---

## 🛠️ 开发环境配置

### 依赖安装
```bash
# 创建项目
mkdir emohub && cd emohub

# 初始化Monorepo（使用bun）
bun init -y
bun add -D turbo typescript

# 安装共享依赖
bun add clsx tailwind-merge date-fns

# 服务端依赖
cd packages/server
bun add fastify @fastify/cors @fastify/websocket
bun add @prisma/client prisma
bun add sqlite3 better-sqlite3

# Web端依赖
cd apps/web
bun add react react-dom
bun add -D @vitejs/plugin-react
bun add @tanstack/react-router
bun add zustand
bun add tesseract.js

# 移动端依赖
cd apps/mobile
bun add expo-router
bun add nativewind
bun add zustand
```

### 环境变量
```env
# .env
DATABASE_URL="file:./dev.db"
SERVER_PORT=3000
CLIENT_URL="http://localhost:5173"
STORAGE_PATH="./storage/images"
```
