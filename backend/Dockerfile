FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src ./src
EXPOSE 3001
# 环境变量由 docker-compose 注入，不在此写死
CMD ["node", "src/index.js"]
