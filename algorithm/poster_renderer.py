"""
海报渲染模块
使用 Pillow 生成海报图片
"""
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO
import os
import requests
from typing import Dict, Any, Optional
import base64


class PosterRenderer:
    """海报渲染器"""
    
    def __init__(self, upload_dir: str = "/tmp/posters"):
        self.upload_dir = upload_dir
        os.makedirs(upload_dir, exist_ok=True)
    
    def render(self, poster_data: Dict[str, Any], format: str = "PNG") -> BytesIO:
        """
        渲染海报
        
        Args:
            poster_data: 海报数据（包含 size, background, elements）
            format: 输出格式 (PNG, JPEG)
            
        Returns:
            BytesIO 对象
        """
        size = poster_data["size"]
        width = size["width"]
        height = size["height"]
        
        # 创建画布
        img = Image.new('RGB', (width, height), color='#FFFFFF')
        draw = ImageDraw.Draw(img)
        
        # 绘制背景
        self._draw_background(draw, img, poster_data.get("background", {}))
        
        # 绘制元素
        for element in poster_data.get("elements", []):
            if element["type"] == "text":
                self._draw_text(draw, element)
            elif element["type"] == "image":
                self._draw_image(img, element)
        
        # 转换为指定格式
        output = BytesIO()
        if format.upper() == "JPEG":
            # JPEG 不支持透明，需要转换为 RGB
            if img.mode == 'RGBA':
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[3] if img.mode == 'RGBA' else None)
                img = background
            img.save(output, format='JPEG', quality=95)
        else:
            img.save(output, format='PNG')
        
        output.seek(0)
        return output
    
    def _draw_background(self, draw: ImageDraw, img: Image, background: Dict[str, Any]):
        """绘制背景"""
        bg_type = background.get("type", "solid")
        
        if bg_type == "solid":
            color = background.get("color", "#FFFFFF")
            draw.rectangle([(0, 0), img.size], fill=color)
        elif bg_type == "gradient":
            colors = background.get("colors", ["#4A90E2", "#357ABD"])
            self._draw_gradient(img, colors[0], colors[1])
    
    def _draw_gradient(self, img: Image, color1: str, color2: str):
        """绘制渐变背景"""
        width, height = img.size
        
        # 简单的垂直渐变
        for y in range(height):
            ratio = y / height
            r1, g1, b1 = self._hex_to_rgb(color1)
            r2, g2, b2 = self._hex_to_rgb(color2)
            
            r = int(r1 + (r2 - r1) * ratio)
            g = int(g1 + (g2 - g1) * ratio)
            b = int(b1 + (b2 - b1) * ratio)
            
            for x in range(width):
                img.putpixel((x, y), (r, g, b))
    
    def _draw_text(self, draw: ImageDraw, element: Dict[str, Any]):
        """绘制文字"""
        content = element.get("content", element.get("defaultContent", ""))
        if not content:
            return
        
        position = element["position"]
        x = position["x"]
        y = position["y"]
        style = element.get("style", {})
        
        # 字体大小
        font_size = style.get("fontSize", 24)
        
        # 尝试加载字体
        try:
            # 使用默认字体
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
        except:
            try:
                # Windows 字体
                font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", font_size)
            except:
                # 使用默认字体
                font = ImageFont.load_default()
        
        # 颜色
        color = style.get("color", "#000000")
        color_rgb = self._hex_to_rgb(color)
        
        # 对齐方式
        text_align = style.get("textAlign", "left")
        
        # 获取文字边界框
        bbox = draw.textbbox((0, 0), content, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        # 根据对齐方式调整 x 坐标
        if text_align == "center":
            x = x - text_width // 2
        elif text_align == "right":
            x = x - text_width
        
        # 绘制文字
        draw.text((x, y - text_height), content, fill=color_rgb, font=font)
    
    def _draw_image(self, img: Image, element: Dict[str, Any]):
        """绘制图片"""
        image_url = element.get("url")
        if not image_url:
            return
        
        try:
            # 下载图片
            response = requests.get(image_url, timeout=10)
            response.raise_for_status()
            
            # 打开图片
            element_img = Image.open(BytesIO(response.content))
            
            # 调整大小
            size = element.get("size", {})
            if size:
                element_img = element_img.resize(
                    (size["width"], size["height"]),
                    Image.Resampling.LANCZOS
                )
            
            # 粘贴到主图片
            position = element["position"]
            x = position["x"] - element_img.width // 2
            y = position["y"] - element_img.height // 2
            
            if element_img.mode == 'RGBA':
                img.paste(element_img, (x, y), element_img)
            else:
                img.paste(element_img, (x, y))
        except Exception as e:
            print(f"Failed to draw image: {e}")
    
    def _hex_to_rgb(self, hex_color: str) -> tuple:
        """转换十六进制颜色为 RGB"""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    
    def render_to_pdf(self, poster_data: Dict[str, Any]) -> BytesIO:
        """渲染为 PDF（使用 reportlab）"""
        try:
            from reportlab.pdfgen import canvas
            from reportlab.lib.pagesizes import A4
            from reportlab.lib.units import mm
            
            output = BytesIO()
            width, height = poster_data["size"]["width"], poster_data["size"]["height"]
            
            # 创建 PDF，使用海报尺寸
            c = canvas.Canvas(output, pagesize=(width, height))
            
            # 绘制背景
            background = poster_data.get("background", {})
            if background.get("type") == "solid":
                color = background.get("color", "#FFFFFF")
                r, g, b = self._hex_to_rgb(color)
                c.setFillColorRGB(r/255, g/255, b/255)
                c.rect(0, 0, width, height, fill=1)
            
            # 绘制元素
            for element in poster_data.get("elements", []):
                if element["type"] == "text":
                    content = element.get("content", element.get("defaultContent", ""))
                    if content:
                        position = element["position"]
                        style = element.get("style", {})
                        color = style.get("color", "#000000")
                        r, g, b = self._hex_to_rgb(color)
                        c.setFillColorRGB(r/255, g/255, b/255)
                        c.setFont("Helvetica-Bold", style.get("fontSize", 24))
                        c.drawString(position["x"], height - position["y"], content)
            
            c.save()
            output.seek(0)
            return output
        except ImportError:
            raise Exception("reportlab not installed, cannot generate PDF")
