# Algorithm Service - 海报生成算法服务

## 功能

- ✅ LLM API 集成（支持通义千问、智谱AI、文心一言）
- ✅ 海报模板库管理
- ✅ 海报生成和渲染
- ✅ 文字编辑和样式调整
- ✅ 图片上传和处理
- ✅ 多格式导出（PNG/JPEG/PDF）
- ✅ 自动降级机制（API 不可用时使用 dummy 模式）

## 环境变量配置

复制 `.env.example` 为 `.env` 并配置：

```bash
LLM_PROVIDER=dashscope  # dashscope/zhipu/baidu
LLM_API_KEY=your-api-key
LLM_MODEL=qwen-turbo
```

## API 端点

### 健康检查
- `GET /health` - 检查服务状态和 LLM API 可用性

### 海报生成
- `POST /generate` - 生成海报
  ```json
  {
    "prompt": "用户需求描述"
  }
  ```

### 模板管理
- `GET /templates` - 获取模板列表（支持 category 参数）
- `GET /templates/<template_id>` - 获取模板详情

### 图片上传
- `POST /upload/image` - 上传图片（multipart/form-data）

### 海报管理
- `GET /poster/<poster_id>` - 获取海报数据
- `PUT /poster/<poster_id>/update` - 更新海报内容
- `GET /poster/<poster_id>/image` - 获取海报图片
- `POST /poster/<poster_id>/export` - 导出海报（支持 format: png/jpeg/pdf）

## 自动降级机制

如果检测到：
- 没有配置 `LLM_API_KEY`
- LLM API 调用失败
- LLM API 健康检查失败

服务会自动降级到 dummy 模式，返回占位符海报，确保服务可用性。

## 运行

```bash
# 开发模式
python app.py

# 生产模式（Docker）
docker-compose up algorithm
```

## 设计说明与扩展

- **核心流程**：用户输入 → LLM 生成设计方案（JSON）→ 选模板 → 应用设计 → Pillow 渲染 → 持久化/返回。
- **LLM 选型**：当前支持通义/智谱/百度；可扩展 OpenAI 或自部署（Llama/Qwen 等）。环境变量见 `.env.example`。
- **模板**：`template_service.py` 中默认 3 个模板（竖版/横版/方形），元素含 id、type、position、style、defaultContent；扩展可加 JSON 配置或数据库表。
- **导出**：PNG/JPEG 由 Pillow 渲染，PDF 由 reportlab；可扩展 SVG 或对象存储上传。
- **扩展优先级**：前端海报编辑（拖拽/样式）→ 模板管理界面 → 更复杂模板或图像生成。
