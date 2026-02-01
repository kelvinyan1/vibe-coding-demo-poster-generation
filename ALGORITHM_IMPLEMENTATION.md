# 算法与海报功能实现方案

## 整体架构设计

### 核心流程
```
用户输入需求 → LLM API 理解需求 → 选择模板 → 生成海报 → 编辑调整 → 导出
```

## 1. 连接大模型 API

### 方案选择

#### 选项 A：使用 OpenAI API（推荐用于演示）
- **优点**：API 稳定，文档完善，支持多模态（GPT-4 Vision）
- **缺点**：需要付费，国内访问可能受限
- **适用场景**：快速原型、演示项目

#### 选项 B：使用国内大模型 API
- **阿里云通义千问**、**百度文心一言**、**腾讯混元**、**智谱AI**
- **优点**：国内访问稳定，价格相对便宜
- **缺点**：API 可能不如 OpenAI 成熟
- **适用场景**：国内部署、成本敏感

#### 选项 C：使用开源模型（自部署）
- **Llama 2/3**、**Mistral**、**Qwen**（通义千问开源版）
- **优点**：完全免费，数据隐私可控
- **缺点**：需要 GPU 资源，部署复杂
- **适用场景**：企业内网、数据安全要求高

### 实现步骤

#### 1.1 环境变量配置

在 `algorithm/.env` 或通过 Docker 环境变量配置：

```bash
# OpenAI
OPENAI_API_KEY=your-api-key
OPENAI_MODEL=gpt-4-vision-preview  # 或 gpt-4-turbo

# 或使用国内 API
# 阿里云
DASHSCOPE_API_KEY=your-key
# 百度
BAIDU_API_KEY=your-key
BAIDU_SECRET_KEY=your-secret
# 智谱AI
ZHIPU_API_KEY=your-key
```

#### 1.2 LLM 调用模块

创建 `algorithm/llm_service.py`：

```python
import os
import requests
from typing import Dict, Any

class LLMService:
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        self.model = os.getenv('OPENAI_MODEL', 'gpt-4-turbo')
        self.base_url = os.getenv('OPENAI_BASE_URL', 'https://api.openai.com/v1')
    
    def generate_poster_design(self, user_prompt: str) -> Dict[str, Any]:
        """
        根据用户需求生成海报设计方案
        
        返回结构：
        {
            "title": "海报标题",
            "subtitle": "副标题",
            "description": "描述文字",
            "template_id": "template_001",
            "color_scheme": {"primary": "#4A90E2", "secondary": "#FFFFFF"},
            "layout": "vertical",  # vertical/horizontal/square
            "elements": [
                {"type": "text", "content": "...", "position": {...}},
                {"type": "image", "url": "...", "position": {...}}
            ]
        }
        """
        system_prompt = """你是一个专业的海报设计师。根据用户需求，生成详细的海报设计方案。
        返回 JSON 格式，包含：标题、副标题、描述、推荐模板ID、配色方案、布局、元素列表。"""
        
        # 调用 LLM API
        response = self._call_api(system_prompt, user_prompt)
        
        # 解析并返回结构化数据
        return self._parse_response(response)
    
    def _call_api(self, system_prompt: str, user_prompt: str) -> str:
        # 实现具体的 API 调用
        # 支持 OpenAI、国内 API 等
        pass
    
    def _parse_response(self, response: str) -> Dict[str, Any]:
        # 解析 LLM 返回的 JSON
        pass
```

#### 1.3 多模型支持

可以创建适配器模式，支持多个 LLM 提供商：

```python
# algorithm/llm_adapters/openai_adapter.py
# algorithm/llm_adapters/dashscope_adapter.py
# algorithm/llm_adapters/zhipu_adapter.py
```

## 2. 海报模板库

### 数据结构设计

#### 2.1 模板存储

**选项 A：数据库存储（推荐）**
- 在 PostgreSQL 中创建 `poster_templates` 表
- 存储模板元数据和配置 JSON

**选项 B：文件系统存储**
- 模板文件存储在 `algorithm/templates/` 目录
- 使用 JSON 配置文件描述模板

#### 2.2 模板表结构

```sql
CREATE TABLE poster_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50),  -- 活动/产品/节日等
    thumbnail_url TEXT,
    template_config JSONB,  -- 模板配置（尺寸、元素位置等）
    preview_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.3 模板配置格式

```json
{
    "id": "template_001",
    "name": "活动海报-竖版",
    "size": {"width": 800, "height": 1200},
    "background": {
        "type": "gradient",
        "colors": ["#4A90E2", "#357ABD"]
    },
    "elements": [
        {
            "id": "title",
            "type": "text",
            "position": {"x": 400, "y": 200},
            "style": {
                "fontSize": 48,
                "fontWeight": "bold",
                "color": "#FFFFFF",
                "textAlign": "center"
            },
            "editable": true
        },
        {
            "id": "subtitle",
            "type": "text",
            "position": {"x": 400, "y": 280},
            "style": {
                "fontSize": 24,
                "color": "#FFFFFF"
            },
            "editable": true
        },
        {
            "id": "image_placeholder",
            "type": "image",
            "position": {"x": 400, "y": 600},
            "size": {"width": 600, "height": 400},
            "editable": true
        }
    ]
}
```

#### 2.4 模板管理 API

```python
# algorithm/app.py 中添加

@app.route('/templates/list', methods=['GET'])
def list_templates():
    """获取模板列表"""
    category = request.args.get('category')
    # 从数据库或文件系统读取模板列表
    pass

@app.route('/templates/<template_id>', methods=['GET'])
def get_template(template_id):
    """获取模板详情"""
    pass
```

## 3. 海报生成与渲染

### 3.1 生成流程

```python
@app.route('/generate', methods=['POST'])
def generate_poster():
    data = request.get_json()
    user_prompt = data.get('prompt', '')
    
    # 1. 调用 LLM 生成设计方案
    llm_service = LLMService()
    design = llm_service.generate_poster_design(user_prompt)
    
    # 2. 加载模板
    template = load_template(design['template_id'])
    
    # 3. 应用设计到模板
    poster_data = apply_design_to_template(template, design)
    
    # 4. 渲染海报（生成图片）
    poster_url = render_poster(poster_data)
    
    return jsonify({
        'poster_url': poster_url,
        'poster_data': poster_data,  # 包含可编辑的结构化数据
        'template_id': design['template_id']
    })
```

### 3.2 渲染引擎选择

#### 选项 A：Pillow (PIL) - Python 图像库
- **优点**：简单易用，纯 Python
- **缺点**：功能相对基础
- **适用**：简单文字和图片合成

```python
from PIL import Image, ImageDraw, ImageFont

def render_poster(poster_data):
    # 创建画布
    img = Image.new('RGB', (800, 1200), color='#FFFFFF')
    draw = ImageDraw.Draw(img)
    
    # 绘制背景
    # 绘制文字
    # 绘制图片
    
    # 保存
    img.save('poster.png')
    return upload_to_storage('poster.png')
```

#### 选项 B：Cairo / PyCairo
- **优点**：功能强大，支持矢量图形
- **缺点**：学习曲线陡峭
- **适用**：复杂图形设计

#### 选项 C：使用前端渲染（推荐）
- **优点**：实时预览，交互性好
- **缺点**：需要前端实现渲染逻辑
- **适用**：需要实时编辑的场景

**方案**：后端返回结构化数据，前端使用 Canvas 或 SVG 渲染

## 4. 文字编辑和样式调整

### 4.1 数据结构

海报数据包含可编辑元素：

```json
{
    "poster_id": "123",
    "elements": [
        {
            "id": "title",
            "type": "text",
            "content": "活动标题",
            "position": {"x": 400, "y": 200},
            "style": {
                "fontSize": 48,
                "fontFamily": "Arial",
                "fontWeight": "bold",
                "color": "#FFFFFF",
                "textAlign": "center",
                "lineHeight": 1.2
            },
            "editable": true
        }
    ]
}
```

### 4.2 前端编辑界面

使用 Canvas 或 SVG 实现拖拽编辑：

```javascript
// frontend/src/components/PosterEditor.jsx
function PosterEditor({ posterData, onSave }) {
    const [elements, setElements] = useState(posterData.elements);
    
    // 文字编辑
    const handleTextChange = (elementId, newText) => {
        setElements(prev => prev.map(el => 
            el.id === elementId ? {...el, content: newText} : el
        ));
    };
    
    // 样式调整
    const handleStyleChange = (elementId, style) => {
        setElements(prev => prev.map(el => 
            el.id === elementId ? {...el, style: {...el.style, ...style}} : el
        ));
    };
    
    // 位置拖拽
    const handleDrag = (elementId, newPosition) => {
        setElements(prev => prev.map(el => 
            el.id === elementId ? {...el, position: newPosition} : el
        ));
    };
    
    return (
        <Canvas>
            {elements.map(element => (
                <EditableElement
                    key={element.id}
                    element={element}
                    onTextChange={handleTextChange}
                    onStyleChange={handleStyleChange}
                    onDrag={handleDrag}
                />
            ))}
        </Canvas>
    );
}
```

### 4.3 后端保存 API

```python
@app.route('/poster/<poster_id>/update', methods=['PUT'])
def update_poster(poster_id):
    """更新海报内容"""
    data = request.get_json()
    elements = data.get('elements')
    
    # 保存到数据库
    # 重新渲染海报
    poster_url = render_poster(data)
    
    return jsonify({
        'poster_url': poster_url,
        'poster_data': data
    })
```

## 5. 图片上传和处理

### 5.1 存储方案

#### 选项 A：本地文件系统
- 简单，适合开发环境
- 需要处理文件路径和访问权限

#### 选项 B：对象存储（推荐）
- **阿里云 OSS**、**腾讯云 COS**、**AWS S3**
- **优点**：可扩展，CDN 加速
- **适用**：生产环境

#### 选项 C：Base64 编码
- 直接存储在数据库
- **缺点**：数据库体积大，不适合大图片

### 5.2 图片上传 API

```python
from werkzeug.utils import secure_filename
import boto3  # 如果使用 AWS S3

@app.route('/upload/image', methods=['POST'])
def upload_image():
    """上传图片"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file'}), 400
    
    file = request.files['file']
    
    # 验证文件类型和大小
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400
    
    # 处理图片（压缩、裁剪等）
    processed_image = process_image(file)
    
    # 上传到存储
    image_url = upload_to_storage(processed_image)
    
    return jsonify({'url': image_url})
```

### 5.3 图片处理

使用 Pillow 进行图片处理：

```python
from PIL import Image

def process_image(file, max_size=(1920, 1920), quality=85):
    """处理图片：压缩、裁剪等"""
    img = Image.open(file)
    
    # 调整大小
    img.thumbnail(max_size, Image.Resampling.LANCZOS)
    
    # 转换为 RGB（如果是 RGBA）
    if img.mode == 'RGBA':
        background = Image.new('RGB', img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[3])
        img = background
    
    # 保存
    output = BytesIO()
    img.save(output, format='JPEG', quality=quality)
    output.seek(0)
    
    return output
```

## 6. 多格式导出

### 6.1 导出格式

- **PNG**：高质量，支持透明背景
- **JPEG**：文件小，适合分享
- **PDF**：适合打印
- **SVG**：矢量图，可缩放

### 6.2 导出 API

```python
@app.route('/poster/<poster_id>/export', methods=['POST'])
def export_poster(poster_id):
    """导出海报"""
    data = request.get_json()
    format_type = data.get('format', 'png')  # png/jpeg/pdf/svg
    
    # 加载海报数据
    poster_data = load_poster_data(poster_id)
    
    # 渲染
    if format_type == 'pdf':
        output = render_to_pdf(poster_data)
    elif format_type == 'svg':
        output = render_to_svg(poster_data)
    else:
        output = render_to_image(poster_data, format_type)
    
    # 返回下载链接或直接返回文件
    return send_file(output, mimetype=f'image/{format_type}')
```

### 6.3 PDF 导出

使用 `reportlab` 或 `weasyprint`：

```python
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

def render_to_pdf(poster_data):
    """渲染为 PDF"""
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    
    # 绘制元素
    for element in poster_data['elements']:
        if element['type'] == 'text':
            c.drawString(element['position']['x'], 
                        element['position']['y'], 
                        element['content'])
        elif element['type'] == 'image':
            c.drawImage(element['url'], 
                       element['position']['x'], 
                       element['position']['y'])
    
    c.save()
    buffer.seek(0)
    return buffer
```

## 7. 实现优先级建议

### Phase 1：基础功能（MVP）
1. ✅ 连接 LLM API（OpenAI 或国内 API）
2. ✅ 基础模板库（3-5 个模板）
3. ✅ 简单渲染（Pillow）
4. ✅ PNG 导出

### Phase 2：编辑功能
1. ✅ 文字编辑
2. ✅ 样式调整（字体、颜色、大小）
3. ✅ 位置拖拽

### Phase 3：高级功能
1. ✅ 图片上传
2. ✅ 多格式导出（PDF、SVG）
3. ✅ 模板管理界面

### Phase 4：优化
1. ✅ 前端 Canvas 实时渲染
2. ✅ 模板市场
3. ✅ AI 智能推荐模板

## 8. 技术栈建议

### 后端（Algorithm Service）
- **Python 3.11+**
- **Flask**：Web 框架
- **Pillow**：图片处理
- **openai** / **dashscope**：LLM API 调用
- **boto3** / **oss2**：对象存储
- **reportlab** / **weasyprint**：PDF 生成

### 前端
- **React**：UI 框架
- **Fabric.js** 或 **Konva.js**：Canvas 编辑
- **react-draggable**：拖拽功能
- **html2canvas**：Canvas 转图片

### 数据库扩展
- 添加 `poster_templates` 表
- 扩展 `posters` 表，存储结构化数据

## 9. 依赖更新

更新 `algorithm/requirements.txt`：

```txt
flask==3.0.0
requests==2.31.0
gunicorn==21.2.0
pillow==10.1.0
openai==1.3.0  # 或 dashscope, zhipuai
boto3==1.29.0  # AWS S3，或使用 oss2（阿里云）
reportlab==4.0.7  # PDF 生成
python-dotenv==1.0.0  # 环境变量管理
```

## 10. 成本估算

### LLM API 成本
- **OpenAI GPT-4**：约 $0.03-0.06 每张海报
- **国内 API**：约 ¥0.01-0.05 每张海报

### 存储成本
- **对象存储**：约 ¥0.12/GB/月
- **CDN**：约 ¥0.15/GB 流量

### 优化建议
- 缓存常用模板
- 图片压缩
- 使用 CDN 加速
