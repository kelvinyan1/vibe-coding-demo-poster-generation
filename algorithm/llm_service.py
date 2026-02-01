"""
LLM 服务模块
支持多个国内 API 提供商
"""
import os
import json
import requests
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()


class LLMService:
    """LLM 服务，支持多个 API 提供商"""
    
    def __init__(self):
        self.provider = os.getenv('LLM_PROVIDER', 'dashscope').lower()
        self.api_key = os.getenv('LLM_API_KEY', '')
        self.model = os.getenv('LLM_MODEL', 'qwen-turbo')
        self.base_url = os.getenv('LLM_BASE_URL', '')
        self.enabled = bool(self.api_key)
    
    def is_available(self) -> bool:
        """检查 API 是否可用"""
        if not self.enabled:
            return False
        
        try:
            # 简单的健康检查：尝试调用 API
            if self.provider == 'dashscope':
                return self._check_dashscope()
            elif self.provider == 'zhipu':
                return self._check_zhipu()
            elif self.provider == 'baidu':
                return self._check_baidu()
            else:
                return False
        except Exception:
            return False
    
    def _check_dashscope(self) -> bool:
        """检查通义千问 API"""
        try:
            import dashscope
            dashscope.api_key = self.api_key
            response = dashscope.Generation.call(
                model=self.model,
                prompt='test',
                max_tokens=1
            )
            return response.status_code == 200
        except Exception:
            return False
    
    def _check_zhipu(self) -> bool:
        """检查智谱 AI API"""
        try:
            url = "https://open.bigmodel.cn/api/paas/v4/models"
            headers = {
                "Authorization": f"Bearer {self.api_key}"
            }
            response = requests.get(url, headers=headers, timeout=5)
            return response.status_code == 200
        except Exception:
            return False
    
    def _check_baidu(self) -> bool:
        """检查百度文心一言 API"""
        # 百度 API 需要 access_token，这里简化检查
        return bool(self.api_key)
    
    def generate_poster_design(self, user_prompt: str) -> Dict[str, Any]:
        """
        根据用户需求生成海报设计方案
        
        Args:
            user_prompt: 用户输入的需求描述
            
        Returns:
            海报设计方案字典
        """
        if not self.is_available():
            raise Exception("LLM API not available")
        
        system_prompt = """你是一个专业的海报设计师。根据用户的具体需求，生成海报设计方案。
重要：title、subtitle、description 必须根据用户输入来写，不能使用示例占位文字（如"标题内容"、"海报主标题"）。每条用户需求都要得到不同的、与之对应的文案。
template_id 根据内容选择：template_001 活动/竖版、template_002 产品/横版、template_003 节日/方形。color_scheme 的 primary/secondary 可根据主题换不同颜色（如节日用红金、产品用蓝白）。
请只返回一个 JSON 对象，不要其他说明。格式如下：
{
    "title": "根据用户需求写的标题",
    "subtitle": "根据用户需求写的副标题",
    "description": "根据用户需求写的描述",
    "template_id": "template_001 或 template_002 或 template_003",
    "color_scheme": {
        "primary": "#4A90E2",
        "secondary": "#FFFFFF",
        "accent": "#FFD700"
    },
    "layout": "vertical",
    "elements": [
        {
            "id": "title",
            "type": "text",
            "content": "与上面 title 一致的具体标题文案",
            "position": {"x": 400, "y": 200},
            "style": {"fontSize": 48, "fontWeight": "bold", "color": "#FFFFFF", "textAlign": "center"}
        }
    ]
}"""
        
        try:
            if self.provider == 'dashscope':
                return self._call_dashscope(system_prompt, user_prompt)
            elif self.provider == 'zhipu':
                return self._call_zhipu(system_prompt, user_prompt)
            elif self.provider == 'baidu':
                return self._call_baidu(system_prompt, user_prompt)
            else:
                raise Exception(f"Unsupported provider: {self.provider}")
        except Exception as e:
            raise Exception(f"LLM API call failed: {str(e)}")
    
    def _call_dashscope(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        """调用通义千问 API"""
        import dashscope
        dashscope.api_key = self.api_key
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        response = dashscope.Generation.call(
            model=self.model,
            messages=messages,
            result_format='message'
        )
        
        if response.status_code != 200:
            raise Exception(f"DashScope API error: {response.message}")
        
        content = response.output.choices[0].message.content
        
        # 尝试提取 JSON
        json_str = self._extract_json(content)
        return json.loads(json_str)
    
    def _call_zhipu(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        """调用智谱 AI API"""
        url = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": self.model or "glm-4",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.7
        }
        
        response = requests.post(url, json=data, headers=headers, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        content = result['choices'][0]['message']['content']
        
        json_str = self._extract_json(content)
        return json.loads(json_str)
    
    def _call_baidu(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        """调用百度文心一言 API"""
        # 需要先获取 access_token
        access_token = self._get_baidu_token()
        
        url = f"https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token={access_token}"
        
        data = {
            "messages": [
                {"role": "user", "content": f"{system_prompt}\n\n用户需求：{user_prompt}"}
            ],
            "temperature": 0.7
        }
        
        response = requests.post(url, json=data, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        content = result['result']
        
        json_str = self._extract_json(content)
        return json.loads(json_str)
    
    def _get_baidu_token(self) -> str:
        """获取百度 access_token"""
        url = "https://aip.baidubce.com/oauth/2.0/token"
        params = {
            "grant_type": "client_credentials",
            "client_id": self.api_key,
            "client_secret": os.getenv('BAIDU_SECRET_KEY', '')
        }
        
        response = requests.post(url, params=params, timeout=10)
        response.raise_for_status()
        
        result = response.json()
        return result['access_token']
    
    def _extract_json(self, text: str) -> str:
        """从文本中提取 JSON"""
        # 尝试找到 JSON 代码块
        import re
        
        # 查找 ```json ... ``` 或 ``` ... ```
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
        if json_match:
            return json_match.group(1)
        
        # 查找 {...}
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json_match.group(0)
        
        # 如果都没找到，返回原文本
        return text
