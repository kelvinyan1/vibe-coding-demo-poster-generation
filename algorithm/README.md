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
