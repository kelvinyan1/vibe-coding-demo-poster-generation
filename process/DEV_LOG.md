# 开发与讨论记录

本文件合并了开发进度与讨论记录，便于查阅。

---

## 一、开发进度

### 项目阶段

#### Phase 0: 项目初始化 ✅
- [x] 创建项目文件夹结构（frontend/、backend/、algorithm/、process/）

#### Phase 1: 技术架构设计 ✅
- [x] 技术栈：前后端 npm，数据库与算法 Docker
- [x] 架构原则：组件分离、服务容错

#### Phase 2: 基础设施搭建 ✅
- [x] docker-compose.yml、数据库与算法健康检查
- [x] 前端（React + Vite）、后端（Express）npm 初始化

#### Phase 3: 后端开发 ✅
- [x] Express + PostgreSQL，表：users、conversations、posters、conversation_threads
- [x] API：认证、对话、海报、对话主题（thread）；JWT、数据库迁移

#### Phase 4: 算法模块开发 ✅
- [x] Flask、Dummy 降级；LLM 国内 API（通义/智谱）
- [x] 模板库 + 设计应用（含 LLM elements）；Pillow 渲染、渐变优化
- [x] 海报与图片持久化（POSTERS_DIR/UPLOADS_DIR）；多格式导出（PNG/JPEG/PDF）
- [ ] 可选：更复杂模板或图像生成

#### Phase 5: 前端开发 ✅
- [x] 登录/注册、多主题对话、海报预览、与后端/算法集成

#### Phase 6: 测试与优化 ⏳
- [ ] 单元/集成/容错测试，性能优化

### 技术决策

- **架构**：前后端独立、数据库与算法容器化、HTTP API 解耦
- **容错**：健康检查、重试、降级、友好错误提示

### 更新记录摘要

- **2026/02/01**：初始化、架构、核心功能（DB/后端/前端/算法 dummy）、登录跳转修复、多主题对话、主题创建修复
- **2026/02/02**：算法优化——模板应用 LLM elements、渐变条带优化、海报/图片磁盘持久化（uuid、_safe_id）
- **2026/02/02 后续**：① 前端海报图不显示 → PosterImage 用带 token 的 api 拉 blob 再显示，外部 URL（dummy）直接 img src；② 刷新后图片加载失败 → 后端存 conversations.response 时用代理路径 finalPosterUrl，前端 normalizePosterUrl 兼容旧格式；③ 无论怎么输入海报都一样 → LLM system prompt 强调根据用户输入写文案、禁止占位，兜底用 prompt 作 title、占位时按 prompt hash 轮换模板；④ 海报中文乱码/方框 → Dockerfile 安装 fonts-wqy-zenhei + fontconfig + fc-cache，poster_renderer 使用正确路径（wenquanyi/wqy-zenhei）、.ttc 传 index=0、支持 POSTER_FONT_PATH；⑤ docker-compose 报错 ContainerConfig → 先 docker-compose rm -f algorithm 或按名删容器再 up，README 故障排查已补充
- **近期**：前端与后端容器化（frontend Dockerfile + nginx 代理 /api，backend Dockerfile），docker-compose 四服务；README 合并：后端/前端/算法说明并入根 README「各模块说明」，子目录 README 改为简短指向根目录

---

## 二、讨论记录

### 2026/02/01 - 项目启动与开发

- **用户**：讨论项目；前后端 npm、数据库与算法 docker、组件分离、容错。
- **cursor auto**：微服务架构，容器化与容错。
- **用户**：需求——用户输入、AI 生成海报；前端登录与对话；数据库存对话/海报/账号；算法先 dummy。
- **cursor auto**：实现 DB/后端/前端/算法 dummy。
- **用户**：Docker 连接失败、如何注册登录、注册无反应。
- **cursor auto**：故障排查说明；登录流程；排查发现 DB 正常，前端问题，加调试日志。
- **用户**：控制台显示登录 200、有 token。
- **cursor auto**：定位为 isAuthenticated 未更新导致重定向；修复：onLogin 回调 + 路由变化时重新检查认证。
- **用户**：加入 debug 过程到 log；要多轮对话与多 topic。
- **cursor auto**：多主题功能（thread 表、API、ThreadList/Chat）。
- **用户**：前端“创建失败”；是否需重启 backend。
- **cursor auto**：需重启后端加载 thread 路由；加错误日志。
- **用户**：可以了；继续记录 log，时间统一 2026/02/01，名字 cursor auto。
- **cursor auto**：已更新。
- **用户**：SETUP.md 合并到 README，README 更简单。
- **cursor auto**：已合并并简化 README。
- **用户**：上架与部署讨论。
- **cursor auto**：DEPLOYMENT.md（前端静态/后端容器/DB 托管/算法容器）。
- **用户**：前端做好看、去掉 emoji、更商业。
- **cursor auto**：UI 优化，专业配色与样式。
- **用户**：研究安全性、快速解决。
- **cursor auto**：SECURITY.md 与实施（环境变量、JWT、CORS、验证、限流、Helmet、错误处理、DB SSL）。
- **用户**：密码验证先略过；文档太多，整合。
- **cursor auto**：整合到 SECURITY.md，删冗余，backend README 简化。
- **用户**：前端 “Database service unavailable”。
- **cursor auto**：缺 .env、密码与 DB 一致；自动重连。
- **用户**：算法如何做（LLM、模板、编辑、上传、多格式导出）。
- **cursor auto**：ALGORITHM_IMPLEMENTATION.md 方案。
- **用户**：用国内 API、无 key 或 health 失败时 dummy。
- **cursor auto**：算法完整实现（LLM/模板/渲染/上传/导出、降级）。

### 2026/02/02 - 算法检查与修复

- **用户**：检查算法服务、如何生成海报。
- **cursor auto**：梳理流程；指出 elements 未用、渐变慢、内存存储。
- **用户**：不管百度，其他都修。
- **cursor auto**：应用 elements、渐变优化、磁盘持久化。
- **用户**：更新 process/ 和 readme。
- **cursor auto**：已更新 develop_log、conversation_log、README。

### 2026/02/02 后续 - 海报显示与中文

- **用户**：前端看不到图片（裂图）。
- **cursor auto**：img src 不带 JWT，后端图片接口需认证；前端改为 PosterImage 组件用 api 拉 blob 再 URL.createObjectURL 显示，外部 URL 直接显示。
- **用户**：刷新页面后图片加载失败。
- **cursor auto**：刷新后 posterUrl 来自 conversations.response，存的是算法格式 /api/poster/:id/image，后端只认 /api/poster/image/:id；后端存 response 时改为存 finalPosterUrl，前端增加 normalizePosterUrl 兼容旧数据。
- **用户**：无论怎么输入生成的海报都一样。
- **cursor auto**：加强 LLM prompt（必须根据用户输入写、禁止占位），兜底用 prompt 作 title、占位时按 prompt 轮换模板（md5 取模）。
- **用户**：海报里面没有内容 / 乱码。
- **cursor auto**：字体不支持中文导致方框；Dockerfile 安装 fonts-wqy-zenhei，poster_renderer 使用正确路径（/usr/share/fonts/wenquanyi/wqy-zenhei/wqy-zenhei.ttc）、.ttc 传 index=0，支持 POSTER_FONT_PATH。
- **用户**：docker-compose up 报错 ContainerConfig。
- **cursor auto**：旧版 docker-compose 重建容器兼容性问题；先 docker-compose rm -f algorithm 或按名删容器再 up，README 故障排查已加。
- **用户**：记得记录 process/。
- **cursor auto**：已更新 process/DEV_LOG.md（更新记录摘要 + 2026/02/02 后续讨论）。
- **用户**：弄一个前端容器，后端怎么弄好。
- **cursor auto**：前端 Dockerfile（Node 构建 + nginx 提供静态并代理 /api 到 backend）、后端 Dockerfile（Node 生产），docker-compose 增加 frontend、backend 服务，README 补充全容器化运行与故障排查。
- **用户**：顺便处理所有 README，能合并就合并，更新 process/。
- **cursor auto**：后端/前端/算法三份 README 内容合并至根 README「各模块说明」；backend、frontend、algorithm 下 README 改为 1～2 行指向根 README。已更新 process/DEV_LOG 更新记录摘要。
