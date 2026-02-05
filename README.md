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

- **全容器化**：仅需 Docker 和 Docker Compose
- **本地开发**：Node.js (v16+)、npm、Docker 和 Docker Compose

---

### 方式一：全容器化运行（推荐）

前端、后端、数据库、算法全部用 Docker 跑，一条命令起整站：

```bash
# 建议先设置生产用密钥（可选，不设则用默认值）
export DB_PASSWORD=poster_password
export JWT_SECRET=your-very-strong-random-secret-at-least-32-chars

docker-compose up -d
```

等待约 30–60 秒（首次会构建 frontend/backend/algorithm 镜像），然后访问：

- **应用入口**：http://localhost:3000（前端由 nginx 提供，/api 自动代理到后端）

若遇 `KeyError: 'ContainerConfig'`，见下方故障排查。

---

### 方式二：本地开发（前后端本机跑，仅数据库与算法用 Docker）

1. **启动 Docker 服务**（数据库 + 算法）
   ```bash
   docker-compose up -d database algorithm
   ```

2. **配置并启动后端**
   ```bash
   cd backend
   # 创建 .env，参考 SECURITY.md（DB_PASSWORD、JWT_SECRET 等）
   npm install && npm run dev
   ```

3. **启动前端**
   ```bash
   cd frontend
   npm install && npm run dev
   ```

4. **访问**：前端 http://localhost:3000，后端 http://localhost:3001

## 📦 Docker Compose 配置说明

### 默认配置

`docker-compose.yml` 包含四个服务：

| 服务 | 说明 | 端口 |
|------|------|------|
| **database** | PostgreSQL 15 | 5432 |
| **backend** | Node.js Express（需 `DB_PASSWORD`、`JWT_SECRET` 等环境变量） | 3001 |
| **algorithm** | Python Flask（LLM、海报渲染） | 8000 |
| **frontend** | Nginx 静态站 + /api 反代到 backend | 3000→80 |

- 数据库默认密码：`poster_password`（由 `DB_PASSWORD` 控制）
- 后端默认 `JWT_SECRET=change-me-in-production-min-32-chars`，生产务必通过环境变量覆盖

### 自定义密码配置

默认数据库密码为 `poster_password`，需与 `backend/.env` 的 `DB_PASSWORD` 一致。如需自定义（推荐生产环境）：

1. 复制 `docker-compose.override.yml.example` 为 `docker-compose.override.yml`
2. 在 override 中设置 `POSTGRES_PASSWORD: ${DB_PASSWORD:-你的密码}`
3. 在 `backend/.env` 中设置相同的 `DB_PASSWORD`

详细说明见 [SECURITY.md](./SECURITY.md)。

### 故障排查

- **docker-compose up 报错 `KeyError: 'ContainerConfig'`**：先删容器再起，例如 `docker-compose rm -f algorithm backend frontend` 后重新 `docker-compose up -d`。
- **数据库连接失败**：确保环境变量 `DB_PASSWORD` 与数据库一致（默认 `poster_password`）。
- **海报图不显示**：确认 algorithm 已启动；新生成一张海报再试；查看 backend 日志。

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
├── frontend/           # 前端（Dockerfile：构建 + nginx，代理 /api 到 backend）
│   ├── Dockerfile
│   └── nginx.conf
├── backend/            # 后端（Dockerfile：Node 生产运行）
│   └── Dockerfile
├── algorithm/          # 算法（Dockerfile：Flask + 中文字体）
├── scripts/pack.sh     # 打包脚本
├── docker-compose.yml  # 四服务：database、backend、algorithm、frontend
├── process/DEV_LOG.md
├── README.md
├── SECURITY.md
└── 打包与使用指引.md
```

## 📝 开发记录

开发进度与讨论记录见 [process/DEV_LOG.md](./process/DEV_LOG.md)。

## 📄 License

待定

---

**当前状态**: 🟢 核心功能与算法服务（LLM + 模板 + 持久化）已完成，可按需扩展编辑与模板管理
