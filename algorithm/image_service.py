"""
图片上传和处理服务
"""
import os
from PIL import Image
from io import BytesIO
from werkzeug.utils import secure_filename
from typing import Tuple, Optional
import base64


class ImageService:
    """图片处理服务"""
    
    def __init__(self, upload_dir: str = "/tmp/uploads"):
        self.upload_dir = upload_dir
        os.makedirs(upload_dir, exist_ok=True)
        self.allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
        self.max_size = (1920, 1920)  # 最大尺寸
        self.max_file_size = 10 * 1024 * 1024  # 10MB
    
    def allowed_file(self, filename: str) -> bool:
        """检查文件扩展名是否允许"""
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in self.allowed_extensions
    
    def process_image(self, file_data: bytes, filename: str, 
                     max_size: Optional[Tuple[int, int]] = None,
                     quality: int = 85) -> BytesIO:
        """
        处理图片：压缩、调整大小等
        
        Args:
            file_data: 图片二进制数据
            filename: 文件名
            max_size: 最大尺寸，默认使用 self.max_size
            quality: JPEG 质量 (1-100)
            
        Returns:
            处理后的图片 BytesIO
        """
        if max_size is None:
            max_size = self.max_size
        
        # 打开图片
        img = Image.open(BytesIO(file_data))
        
        # 转换为 RGB（如果是 RGBA）
        if img.mode == 'RGBA':
            background = Image.new('RGB', img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[3])
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        # 调整大小
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # 保存
        output = BytesIO()
        ext = filename.rsplit('.', 1)[1].lower()
        
        if ext in ['jpg', 'jpeg']:
            img.save(output, format='JPEG', quality=quality, optimize=True)
        elif ext == 'png':
            img.save(output, format='PNG', optimize=True)
        else:
            img.save(output, format='JPEG', quality=quality, optimize=True)
        
        output.seek(0)
        return output
    
    def save_image(self, image_data: BytesIO, filename: str) -> str:
        """
        保存图片到本地
        
        Returns:
            文件路径
        """
        filename = secure_filename(filename)
        filepath = os.path.join(self.upload_dir, filename)
        
        with open(filepath, 'wb') as f:
            f.write(image_data.read())
        
        return filepath
    
    def image_to_base64(self, image_data: BytesIO, format: str = "PNG") -> str:
        """将图片转换为 Base64"""
        image_data.seek(0)
        base64_str = base64.b64encode(image_data.read()).decode('utf-8')
        return f"data:image/{format.lower()};base64,{base64_str}"
    
    def get_image_info(self, file_data: bytes) -> dict:
        """获取图片信息"""
        img = Image.open(BytesIO(file_data))
        return {
            "width": img.width,
            "height": img.height,
            "format": img.format,
            "mode": img.mode,
            "size": len(file_data)
        }
