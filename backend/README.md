# Backend Service

## 快速开始

1. 安装依赖：`npm install`
2. 配置环境变量：创建 `.env` 文件（参考 [SECURITY.md](../SECURITY.md)）
3. 运行：`npm run dev`（开发）或 `npm start`（生产）

## 安装依赖

```bash
npm install
```

## 运行

```bash
# 开发模式（需要 nodemon）
npm run dev

# 生产模式
npm start
```

## 数据库迁移

如果数据库已经存在，需要运行迁移脚本添加新表结构：

```bash
node src/config/migrate-db.js
```

或者直接在数据库中执行 `src/config/db-migration.sql` 文件。

## API 端点

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录

### 对话主题
- `GET /api/thread/list` - 获取主题列表（需要认证）
- `POST /api/thread/create` - 创建新主题（需要认证）
- `GET /api/thread/:threadId` - 获取主题详情（需要认证）
- `PUT /api/thread/:threadId` - 更新主题标题（需要认证）
- `DELETE /api/thread/:threadId` - 删除主题（需要认证）

### 对话
- `GET /api/conversation/history` - 获取对话历史（需要认证，已废弃，建议使用thread API）
- `POST /api/conversation/new` - 在主题中创建新对话消息（需要认证，需要thread_id）

### 海报
- `POST /api/poster/generate` - 生成海报（需要认证）
- `GET /api/poster/list` - 获取海报列表（需要认证）

### 健康检查
- `GET /health` - 服务健康状态
