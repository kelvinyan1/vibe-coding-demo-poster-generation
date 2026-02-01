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

如需使用自定义数据库密码（推荐用于生产环境）：

1. **复制示例文件**：
   ```bash
   cp docker-compose.override.yml.example docker-compose.override.yml
   ```

2. **编辑 `docker-compose.override.yml`**，设置你的密码：
   ```yaml
   services:
     database:
       environment:
         POSTGRES_PASSWORD: ${DB_PASSWORD:-your-strong-password-here}
   ```

3. **设置环境变量**（可选）：
   ```bash
   # Windows PowerShell
   $env:DB_PASSWORD="your-strong-password"
   
   # Linux/Mac
   export DB_PASSWORD="your-strong-password"
   ```

4. **确保后端 `.env` 文件中的密码一致**：
   ```bash
   DB_PASSWORD=your-strong-password-here
   ```

**注意**：`docker-compose.override.yml` 不会被提交到 Git，每个人可以有自己的配置。

详细配置说明请查看 [SECURITY.md](./SECURITY.md)

## ✨ 已实现功能

- ✅ 用户注册和登录
- ✅ 多主题对话管理
- ✅ 多轮对话生成海报
- ✅ 对话历史记录
- ✅ 海报预览
- ✅ 服务容错处理

## 📋 待实现功能

- [ ] 真实的海报生成算法
- [ ] 海报模板库
- [ ] 文字编辑和样式调整
- [ ] 图片上传和处理
- [ ] 多格式导出

## 🛠️ 技术栈

- **前端**: React 18 + Vite + React Router
- **后端**: Node.js + Express + PostgreSQL
- **数据库**: PostgreSQL (Docker)
- **算法服务**: Python Flask (Docker，当前为 dummy 版本)

## 📁 项目结构

```
vibe-coding-demo-poster-generation/
├── frontend/          # 前端应用
├── backend/           # 后端服务
├── algorithm/         # 算法模块
├── docker-compose.yml # Docker 配置
├── process/           # 开发过程记录
│   ├── conversation_log.md    # 讨论记录
│   └── develop_log.md         # 开发进度
└── README.md
```

## 🔧 故障排查

- **Docker 连接失败**: 启动 Docker Desktop 后重新运行 `docker-compose up -d`
- **数据库连接失败**: 检查 `.env` 文件配置，确保密码与 docker-compose.yml 一致
- **端口冲突**: 修改对应配置文件中的端口设置
- **详细故障排查**: 查看各子目录的 README.md 或 [SECURITY.md](./SECURITY.md)

## 📝 开发记录

所有开发过程中的讨论和进度都记录在 [`process/`](./process/) 目录中：

- [`conversation_log.md`](./process/conversation_log.md) - 与 AI 的讨论摘要
- [`develop_log.md`](./process/develop_log.md) - 详细的开发进度

## 📄 License

待定

---

**当前状态**: 🟢 核心功能已完成，算法服务待实现真实生成逻辑
