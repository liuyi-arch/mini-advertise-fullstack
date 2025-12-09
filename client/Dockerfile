# --- Stage 1: Build --- #
# 使用 Node.js 18 镜像作为构建环境
FROM node:18-alpine AS build

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装前端依赖
RUN npm install

# 复制所有前端源代码
COPY . .

# 执行构建命令
RUN npm run build

# --- Stage 2: Production --- #
# 使用轻量的 Nginx 镜像作为生产环境
FROM nginx:alpine

# 将我们自定义的 Nginx 配置复制到容器中
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 将第一阶段构建出的静态文件复制到 Nginx 的网站根目录
COPY --from=build /app/dist /usr/share/nginx/html

# 暴露 80 端口
EXPOSE 80

# Nginx 默认会启动，我们只需要保持它在前台运行
CMD ["nginx", "-g", "daemon off;"]
