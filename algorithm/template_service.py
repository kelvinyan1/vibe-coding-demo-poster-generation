"""
模板管理服务
"""
import json
import os
from typing import Dict, Any, List

# 默认模板库
DEFAULT_TEMPLATES = {
    "template_001": {
        "id": "template_001",
        "name": "活动海报-竖版",
        "category": "活动",
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
                    "textAlign": "center",
                    "fontFamily": "Arial"
                },
                "editable": True,
                "defaultContent": "活动标题"
            },
            {
                "id": "subtitle",
                "type": "text",
                "position": {"x": 400, "y": 280},
                "style": {
                    "fontSize": 24,
                    "color": "#FFFFFF",
                    "textAlign": "center",
                    "fontFamily": "Arial"
                },
                "editable": True,
                "defaultContent": "副标题"
            },
            {
                "id": "description",
                "type": "text",
                "position": {"x": 400, "y": 800},
                "style": {
                    "fontSize": 18,
                    "color": "#FFFFFF",
                    "textAlign": "center",
                    "fontFamily": "Arial"
                },
                "editable": True,
                "defaultContent": "活动描述"
            }
        ]
    },
    "template_002": {
        "id": "template_002",
        "name": "产品海报-横版",
        "category": "产品",
        "size": {"width": 1200, "height": 800},
        "background": {
            "type": "solid",
            "color": "#F5F5F5"
        },
        "elements": [
            {
                "id": "title",
                "type": "text",
                "position": {"x": 600, "y": 200},
                "style": {
                    "fontSize": 56,
                    "fontWeight": "bold",
                    "color": "#333333",
                    "textAlign": "center",
                    "fontFamily": "Arial"
                },
                "editable": True,
                "defaultContent": "产品名称"
            },
            {
                "id": "description",
                "type": "text",
                "position": {"x": 600, "y": 300},
                "style": {
                    "fontSize": 20,
                    "color": "#666666",
                    "textAlign": "center",
                    "fontFamily": "Arial"
                },
                "editable": True,
                "defaultContent": "产品描述"
            }
        ]
    },
    "template_003": {
        "id": "template_003",
        "name": "节日海报-方形",
        "category": "节日",
        "size": {"width": 1000, "height": 1000},
        "background": {
            "type": "gradient",
            "colors": ["#FF6B6B", "#FFD93D"]
        },
        "elements": [
            {
                "id": "title",
                "type": "text",
                "position": {"x": 500, "y": 400},
                "style": {
                    "fontSize": 64,
                    "fontWeight": "bold",
                    "color": "#FFFFFF",
                    "textAlign": "center",
                    "fontFamily": "Arial"
                },
                "editable": True,
                "defaultContent": "节日快乐"
            },
            {
                "id": "subtitle",
                "type": "text",
                "position": {"x": 500, "y": 500},
                "style": {
                    "fontSize": 28,
                    "color": "#FFFFFF",
                    "textAlign": "center",
                    "fontFamily": "Arial"
                },
                "editable": True,
                "defaultContent": "祝福语"
            }
        ]
    }
}


class TemplateService:
    """模板管理服务"""
    
    def __init__(self):
        self.templates = DEFAULT_TEMPLATES.copy()
        self._load_custom_templates()
    
    def _load_custom_templates(self):
        """加载自定义模板（从文件或数据库）"""
        # 可以扩展从数据库或文件加载
        pass
    
    def get_template(self, template_id: str) -> Dict[str, Any]:
        """获取模板"""
        return self.templates.get(template_id)
    
    def list_templates(self, category: str = None) -> List[Dict[str, Any]]:
        """获取模板列表"""
        templates = list(self.templates.values())
        
        if category:
            templates = [t for t in templates if t.get('category') == category]
        
        # 只返回基本信息
        return [
            {
                "id": t["id"],
                "name": t["name"],
                "category": t["category"],
                "size": t["size"]
            }
            for t in templates
        ]
    
    def apply_design_to_template(self, template: Dict[str, Any], design: Dict[str, Any]) -> Dict[str, Any]:
        """将设计应用到模板（含 LLM 返回的 elements：content / position / style）"""
        # 复制模板
        poster_data = json.loads(json.dumps(template))
        
        # 1. 应用顶层 title / subtitle / description（兼容只返回字段的 LLM）
        if "title" in design:
            for element in poster_data["elements"]:
                if element["id"] == "title":
                    element["content"] = design["title"]
        if "subtitle" in design:
            for element in poster_data["elements"]:
                if element["id"] == "subtitle":
                    element["content"] = design.get("subtitle", "")
        if "description" in design:
            for element in poster_data["elements"]:
                if element["id"] == "description":
                    element["content"] = design.get("description", "")
        
        # 2. 应用 LLM 返回的 elements（按 id 覆盖 content / position / style）
        design_elements = design.get("elements") or []
        by_id = {el["id"]: el for el in design_elements if el.get("id")}
        for element in poster_data["elements"]:
            eid = element.get("id")
            if eid not in by_id:
                continue
            de = by_id[eid]
            if "content" in de:
                element["content"] = de["content"]
            if "position" in de and isinstance(de["position"], dict):
                element["position"] = {**element.get("position", {}), **de["position"]}
            if "style" in de and isinstance(de["style"], dict):
                element["style"] = {**element.get("style", {}), **de["style"]}
        
        # 3. 应用配色方案
        if "color_scheme" in design:
            poster_data["color_scheme"] = design["color_scheme"]
            if "background" in poster_data and poster_data["background"]["type"] == "gradient":
                cs = design["color_scheme"]
                primary = cs.get("primary", "#4A90E2")
                secondary = cs.get("secondary", "#FFFFFF")
                poster_data["background"]["colors"] = [primary, secondary]
        
        return poster_data
