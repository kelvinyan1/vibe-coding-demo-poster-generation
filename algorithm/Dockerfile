# 算法服务 Dockerfile
# 待实现具体算法服务时完善

FROM python:3.11-slim

WORKDIR /app

# 安装 curl 用于健康检查
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制代码
COPY . .

# 暴露端口
EXPOSE 8000

# 健康检查端点
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# 启动服务
CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:8000", "app:app"]
