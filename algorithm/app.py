"""
海报生成算法服务
支持 LLM API 调用、模板管理、海报渲染、图片处理、多格式导出
如果 LLM API 不可用，自动降级到 dummy 模式
"""
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import json
from io import BytesIO
from dotenv import load_dotenv

from llm_service import LLMService
from template_service import TemplateService
from poster_renderer import PosterRenderer
from image_service import ImageService

load_dotenv()

app = Flask(__name__)
CORS(app)  # 允许跨域

# 初始化服务
llm_service = LLMService()
template_service = TemplateService()
poster_renderer = PosterRenderer()
image_service = ImageService()

# 存储生成的海报（实际应该使用数据库或对象存储）
poster_storage = {}


def get_dummy_response(prompt: str) -> dict:
    """生成 dummy 响应"""
    return {
        'poster_url': f'https://via.placeholder.com/800x1200/4A90E2/FFFFFF?text={prompt.replace(" ", "+")}',
        'poster_data': {
            'prompt': prompt,
            'status': 'dummy',
            'width': 800,
            'height': 1200,
            'message': 'LLM API not available, returning dummy data',
            'elements': [
                {
                    'id': 'title',
                    'type': 'text',
                    'content': prompt,
                    'position': {'x': 400, 'y': 200},
                    'style': {
                        'fontSize': 48,
                        'fontWeight': 'bold',
                        'color': '#FFFFFF',
                        'textAlign': 'center'
                    },
                    'editable': True
                }
            ]
        }
    }


@app.route('/health', methods=['GET'])
def health():
    """健康检查端点 - 检查 LLM API 可用性"""
    try:
        llm_available = llm_service.is_available()
        
        return jsonify({
            'status': 'ok',
            'llm_api': {
                'available': llm_available,
                'provider': llm_service.provider if llm_service.enabled else None,
                'enabled': llm_service.enabled
            },
            'services': {
                'template': True,
                'renderer': True,
                'image': True
            }
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500


@app.route('/generate', methods=['POST'])
def generate_poster():
    """生成海报"""
    try:
        data = request.get_json()
        prompt = data.get('prompt', '')
        
        if not prompt:
            return jsonify({'error': 'Prompt is required'}), 400
        
        # 检查 LLM API 是否可用
        if not llm_service.is_available():
            # 降级到 dummy 模式
            return jsonify(get_dummy_response(prompt)), 200
        
        try:
            # 1. 调用 LLM 生成设计方案
            design = llm_service.generate_poster_design(prompt)
            
            # 2. 获取模板
            template_id = design.get('template_id', 'template_001')
            template = template_service.get_template(template_id)
            
            if not template:
                # 如果模板不存在，使用默认模板
                template = template_service.get_template('template_001')
            
            # 3. 应用设计到模板
            poster_data = template_service.apply_design_to_template(template, design)
            
            # 4. 渲染海报
            poster_image = poster_renderer.render(poster_data, format='PNG')
            
            # 5. 保存海报（实际应该上传到对象存储）
            poster_id = f"poster_{len(poster_storage)}"
            poster_storage[poster_id] = {
                'poster_data': poster_data,
                'image_data': poster_image.read()
            }
            poster_image.seek(0)
            
            # 生成海报 URL（实际应该返回对象存储 URL）
            poster_url = f"/api/poster/{poster_id}/image"
            
            return jsonify({
                'poster_id': poster_id,
                'poster_url': poster_url,
                'poster_data': poster_data,
                'status': 'success'
            }), 200
            
        except Exception as e:
            # LLM 调用失败，降级到 dummy
            print(f"LLM API call failed: {e}, falling back to dummy mode")
            return jsonify(get_dummy_response(prompt)), 200
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/templates', methods=['GET'])
def list_templates():
    """获取模板列表"""
    try:
        category = request.args.get('category')
        templates = template_service.list_templates(category=category)
        return jsonify({'templates': templates}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/templates/<template_id>', methods=['GET'])
def get_template(template_id):
    """获取模板详情"""
    try:
        template = template_service.get_template(template_id)
        if not template:
            return jsonify({'error': 'Template not found'}), 404
        return jsonify({'template': template}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/upload/image', methods=['POST'])
def upload_image():
    """上传图片"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not image_service.allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400
        
        # 读取文件数据
        file_data = file.read()
        
        # 检查文件大小
        if len(file_data) > image_service.max_file_size:
            return jsonify({'error': 'File too large'}), 400
        
        # 处理图片
        processed_image = image_service.process_image(
            file_data, 
            file.filename
        )
        
        # 保存图片（实际应该上传到对象存储）
        image_id = f"image_{len(poster_storage)}"
        poster_storage[image_id] = {
            'image_data': processed_image.read(),
            'filename': file.filename
        }
        processed_image.seek(0)
        
        # 返回图片 URL
        image_url = f"/api/image/{image_id}"
        
        return jsonify({
            'image_id': image_id,
            'url': image_url,
            'message': 'Image uploaded successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/poster/<poster_id>', methods=['GET'])
def get_poster(poster_id):
    """获取海报数据"""
    try:
        if poster_id not in poster_storage:
            return jsonify({'error': 'Poster not found'}), 404
        
        poster = poster_storage[poster_id]
        return jsonify({
            'poster_id': poster_id,
            'poster_data': poster.get('poster_data', {})
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/poster/<poster_id>/update', methods=['PUT'])
def update_poster(poster_id):
    """更新海报内容"""
    try:
        data = request.get_json()
        poster_data = data.get('poster_data')
        
        if not poster_data:
            return jsonify({'error': 'poster_data is required'}), 400
        
        # 重新渲染海报
        poster_image = poster_renderer.render(poster_data, format='PNG')
        
        # 更新存储
        if poster_id not in poster_storage:
            poster_storage[poster_id] = {}
        
        poster_storage[poster_id]['poster_data'] = poster_data
        poster_storage[poster_id]['image_data'] = poster_image.read()
        poster_image.seek(0)
        
        return jsonify({
            'poster_id': poster_id,
            'poster_url': f"/api/poster/{poster_id}/image",
            'poster_data': poster_data,
            'message': 'Poster updated successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/poster/<poster_id>/image', methods=['GET'])
def get_poster_image(poster_id):
    """获取海报图片"""
    try:
        if poster_id not in poster_storage:
            return jsonify({'error': 'Poster not found'}), 404
        
        image_data = poster_storage[poster_id].get('image_data')
        if not image_data:
            return jsonify({'error': 'Image not found'}), 404
        
        return send_file(
            BytesIO(image_data),
            mimetype='image/png',
            as_attachment=False
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/poster/<poster_id>/export', methods=['POST'])
def export_poster(poster_id):
    """导出海报（支持多种格式）"""
    try:
        if poster_id not in poster_storage:
            return jsonify({'error': 'Poster not found'}), 404
        
        data = request.get_json() or {}
        format_type = data.get('format', 'png').lower()
        
        poster_data = poster_storage[poster_id].get('poster_data')
        if not poster_data:
            return jsonify({'error': 'Poster data not found'}), 404
        
        # 根据格式渲染
        if format_type == 'pdf':
            output = poster_renderer.render_to_pdf(poster_data)
            mimetype = 'application/pdf'
            filename = f'poster_{poster_id}.pdf'
        elif format_type == 'jpeg' or format_type == 'jpg':
            output = poster_renderer.render(poster_data, format='JPEG')
            mimetype = 'image/jpeg'
            filename = f'poster_{poster_id}.jpg'
        else:  # png
            output = poster_renderer.render(poster_data, format='PNG')
            mimetype = 'image/png'
            filename = f'poster_{poster_id}.png'
        
        return send_file(
            output,
            mimetype=mimetype,
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/image/<image_id>', methods=['GET'])
def get_image(image_id):
    """获取上传的图片"""
    try:
        if image_id not in poster_storage:
            return jsonify({'error': 'Image not found'}), 404
        
        image_data = poster_storage[image_id].get('image_data')
        if not image_data:
            return jsonify({'error': 'Image data not found'}), 404
        
        return send_file(
            BytesIO(image_data),
            mimetype='image/jpeg',
            as_attachment=False
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)
