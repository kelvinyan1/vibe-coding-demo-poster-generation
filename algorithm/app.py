from flask import Flask, request, jsonify
import os

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health():
    """健康检查端点"""
    return jsonify({'status': 'ok'}), 200

@app.route('/generate', methods=['POST'])
def generate_poster():
    """生成海报 - 当前返回 dummy 数据"""
    try:
        data = request.get_json()
        prompt = data.get('prompt', '')
        
        # Dummy return - 后续会替换为真实的算法实现
        result = {
            'poster_url': 'https://via.placeholder.com/800x1200/4A90E2/FFFFFF?text=' + prompt.replace(' ', '+'),
            'poster_data': {
                'prompt': prompt,
                'status': 'dummy',
                'width': 800,
                'height': 1200,
                'message': 'This is a dummy response. Algorithm implementation pending.'
            }
        }
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)
