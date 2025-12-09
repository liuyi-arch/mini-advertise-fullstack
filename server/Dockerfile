# 使用一个官方的、轻量的 Node.js 18 镜像作为基础
FROM node:23-alpine

# 在容器内创建一个工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json 到工作目录
COPY package*.json ./

# 安装后端依赖
RUN npm install

# 复制后端所有源代码到工作目录
COPY . .

# 暴露容器的 3001 端口，让外部可以访问
EXPOSE 3001

# 容器启动时运行的命令
CMD [ "node", "src/index.js" ]
