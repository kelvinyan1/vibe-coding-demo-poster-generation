# 🎨 Vibe Coding Demo - 活动海报生成器

> 一个使用 Vibe Coding 方式开发的完整全栈应用示例

## 📖 项目简介

这是一个展示 **Vibe Coding** 开发方式的完整示例项目。通过 AI 协作的方式，从零开始构建一个功能完整的**活动海报生成器 App**。

本项目采用**微服务架构**，各组件完全分离，便于独立开发和部署。

## 🏗️ 架构设计

- 🎯 **前端** - React + Vite，独立 npm 项目
- ⚙️ **后端** - Node.js + Express，独立 npm 项目
- 🐳 **数据库** - PostgreSQL，Docker 容器化
- 🐳 **算法服务** - Python Flask，Docker 容器化

所有服务都具备容错能力，能够优雅处理服务不可用的情况。

## 🚀 快速开始

### 前置要求

- Node.js (v16+)
- npm
- Docker 和 Docker Compose

### 启动步骤

1. **启动 Docker 服务**（数据库和算法）
   ```bash
   docker-compose up -d
   ```
   
   等待服务启动完成（约 30 秒），检查状态：
   ```bash
   docker-compose ps
   ```

2. **配置后端环境变量**
   ```bash
   cd backend
   # 创建 .env 文件，参考 backend/README.md 或 SECURITY.md
   npm install
   npm run dev
   ```

3. **启动前端应用**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **访问应用**
   - 前端：http://localhost:3000
   - 后端：http://localhost:3001

## 📦 Docker Compose 配置说明

### 默认配置

项目使用 `docker-compose.yml` 定义服务配置：
- **数据库服务**：PostgreSQL 15，端口 5432
  - 默认数据库名：`poster_db`
  - 默认用户名：`poster_user`
  - 默认密码：`poster_password`（从环境变量 `DB_PASSWORD` 读取，未设置时使用默认值）
- **算法服务**：Python Flask，端口 8000

### 自定义密码配置

默认数据库密码为 `poster_password`，需与 `backend/.env` 的 `DB_PASSWORD` 一致。如需自定义（推荐生产环境）：

1. 复制 `docker-compose.override.yml.example` 为 `docker-compose.override.yml`
2. 在 override 中设置 `POSTGRES_PASSWORD: ${DB_PASSWORD:-你的密码}`
3. 在 `backend/.env` 中设置相同的 `DB_PASSWORD`

详细说明见 [SECURITY.md](./SECURITY.md)。

## ✨ 已实现功能

- ✅ 用户注册和登录
- ✅ 多主题对话管理
- ✅ 多轮对话生成海报
- ✅ 对话历史记录
- ✅ 海报预览
- ✅ 服务容错处理
- ✅ 算法：LLM 国内 API（通义/智谱）、模板库、设计应用到模板（含 LLM elements）
- ✅ 海报渲染（Pillow，渐变优化）、多格式导出（PNG/JPEG/PDF）
- ✅ 图片上传与处理
- ✅ 海报与上传图片持久化到磁盘（重启不丢失）

## 📋 待实现功能

- [ ] 模板库管理界面
- [ ] 可选：更复杂模板或图像生成扩展

## 🛠️ 技术栈

- **前端**: React 18 + Vite + React Router
- **后端**: Node.js + Express + PostgreSQL
- **数据库**: PostgreSQL (Docker)
- **算法服务**: Python Flask (Docker)，LLM 国内 API、模板渲染、磁盘持久化

## 📁 项目结构

```
vibe-coding-demo-poster-generation/
├── frontend/          # 前端应用
├── backend/           # 后端服务
├── algorithm/         # 算法模块
├── docker-compose.yml # Docker 配置
├── process/
│   └── DEV_LOG.md     # 开发进度与讨论记录（合并）
├── README.md
└── SECURITY.md        # 安全与部署说明
```

## 📝 开发记录

开发进度与讨论记录见 [process/DEV_LOG.md](./process/DEV_LOG.md)。

## 📄 License

待定

---

**当前状态**: 🟢 核心功能与算法服务（LLM + 模板 + 持久化）已完成，可按需扩展编辑与模板管理
