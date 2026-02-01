# 安全配置与部署指南

## 环境变量配置

### 后端环境变量

创建 `backend/.env` 文件：

```bash
# 服务器配置
PORT=3001
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=poster_db
DB_USER=poster_user
DB_PASSWORD=poster_password  # 必须与 docker-compose.yml 中的密码一致
DB_SSL=false  # 开发环境关闭，生产环境设为 true

# JWT 配置（必须设置强随机字符串）
# 生成命令：node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
JWT_SECRET=your-very-strong-random-secret-key-min-32-chars

# 前端 URL（用于 CORS，开发环境可留空）
FRONTEND_URL=

# 算法服务
ALGORITHM_SERVICE_URL=http://localhost:8000
```

## Docker Compose 配置详解

### 配置文件说明

项目使用两个 Docker Compose 配置文件：

1. **`docker-compose.yml`**（主配置文件）
   - 定义所有服务的完整配置
   - 会被提交到 Git
   - 包含默认配置值

2. **`docker-compose.override.yml`**（覆盖配置文件）
   - 用于覆盖敏感配置（如数据库密码）
   - **不会被提交到 Git**（已在 .gitignore 中）
   - 需要从 `docker-compose.override.yml.example` 复制创建

### 配置工作原理

Docker Compose 会自动合并两个文件：
- 先读取 `docker-compose.yml`
- 再读取 `docker-compose.override.yml`（如果存在）
- `docker-compose.override.yml` 中的配置会覆盖主文件中的相同配置

### 数据库密码配置

#### 方式 1：使用默认密码（开发环境）

直接运行，使用 `docker-compose.yml` 中的默认密码 `poster_password`：
```bash
docker-compose up -d
```

确保 `backend/.env` 中的 `DB_PASSWORD=poster_password`

#### 方式 2：使用自定义密码（推荐）

1. **复制示例文件**：
   ```bash
   cp docker-compose.override.yml.example docker-compose.override.yml
   ```

2. **编辑 `docker-compose.override.yml`**：
   ```yaml
   services:
     database:
       environment:
         POSTGRES_PASSWORD: ${DB_PASSWORD:-your-strong-password-here}
   ```
   
   或者直接写死密码（不推荐）：
   ```yaml
   services:
     database:
       environment:
         POSTGRES_PASSWORD: your-strong-password-here
   ```

3. **设置环境变量**（如果使用 `${DB_PASSWORD}`）：
   ```bash
   # Windows PowerShell
   $env:DB_PASSWORD="your-strong-password"
   
   # Linux/Mac
   export DB_PASSWORD="your-strong-password"
   ```

4. **更新后端 `.env` 文件**，确保密码一致：
   ```bash
   DB_PASSWORD=your-strong-password-here
   ```

5. **重启服务**：
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### 环境变量优先级

Docker Compose 读取环境变量的顺序：
1. 系统环境变量（`$DB_PASSWORD`）
2. `.env` 文件（项目根目录）
3. `docker-compose.override.yml` 中的默认值（`${DB_PASSWORD:-default}`）

### 安全注意事项

- ✅ `docker-compose.yml` 使用环境变量，不硬编码密码
- ✅ `docker-compose.override.yml` 已添加到 .gitignore
- ✅ 敏感文件不会被提交到 Git
- ⚠️ 生产环境必须使用强密码
- ⚠️ 不要将密码直接写在 `docker-compose.yml` 中

