# 构建阶段
FROM node:20-slim AS builder

# 设置工作目录
WORKDIR /app

# 一次性安装所有依赖和工具，减少层数
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates wget \
    && wget -O /tmp/libssl1.1.deb http://security.debian.org/debian-security/pool/updates/main/o/openssl/libssl1.1_1.1.1n-0+deb10u6_amd64.deb \
    && dpkg -i /tmp/libssl1.1.deb \
    && rm -f /tmp/libssl1.1.deb \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g pnpm

# 复制package.json文件并安装依赖
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/client/package.json ./packages/client/
COPY packages/core/package.json ./packages/core/
COPY packages/common/package.json ./packages/common/
RUN pnpm install

# 复制源代码并构建项目
COPY . .
RUN cd packages/core && npx prisma generate \
    && cd /app \
    && pnpm common build \
    && pnpm core build \
    && pnpm client build
    
# 确保前端配置使用相对路径API
RUN echo "确保前端配置使用相对路径API"

# 生产阶段 - 使用更小的基础镜像
FROM node:lts-slim AS production

# 安装libssl1.1（不需要nginx）
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates wget \
    && wget -O /tmp/libssl1.1.deb http://security.debian.org/debian-security/pool/updates/main/o/openssl/libssl1.1_1.1.1n-0+deb10u6_amd64.deb \
    && dpkg -i /tmp/libssl1.1.deb \
    && rm -f /tmp/libssl1.1.deb \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g pnpm

# 设置工作目录
WORKDIR /app

# 复制package.json
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/client/package.json ./packages/client/
COPY packages/core/package.json ./packages/core/
COPY packages/common/package.json ./packages/common/

# 安装生产依赖，包括dotenv
RUN pnpm install --prod
RUN npm install -g dotenv

# 复制构建产物
COPY --from=builder /app/packages/core/lib ./packages/core/lib
COPY --from=builder /app/packages/client/dist ./packages/client/dist
COPY --from=builder /app/packages/core/prisma ./packages/core/prisma
COPY --from=builder /app/packages/core/public ./packages/core/public

# 生成Prisma客户端
RUN cd packages/core && npx prisma generate

# 复制前端构建文件到后端静态目录（使用与run3.bat完全相同的方式）
RUN mkdir -p /app/packages/core/public/client && \
    cp -r /app/packages/client/dist/* /app/packages/core/public/client/ && \
    mkdir -p /app/packages/core/public/assets && \
    cp -r /app/packages/client/dist/assets/* /app/packages/core/public/assets/ && \
    cp /app/packages/client/dist/index.html /app/packages/core/public/index.html

# 创建启动脚本，直接加载.env文件
RUN echo '#!/bin/bash\n\
# 输出调试信息\n\
echo "Starting service..."\n\
echo "Loading environment variables from .env file"\n\
\n\
# 设置环境变量\n\
cd /app\n\
export PORT=5000\n\
export NODE_ENV=production\n\
echo "使用挂载的.env文件，并确保PORT=5000"\n\
\n\
# 调试静态文件目录\n\
echo "====== 调试信息 ======"\n\
echo "检查静态文件目录:"\n\
ls -la /app/packages/core/public/\n\
echo "检查前端文件:"\n\
ls -la /app/packages/core/public/index.html 2>/dev/null || echo "根目录中index.html不存在"\n\
ls -la /app/packages/core/public/assets/ 2>/dev/null || echo "assets目录不存在"\n\
ls -la /app/packages/core/public/client/ 2>/dev/null || echo "client目录不存在"\n\
echo "====================="\n\
\n\
# 直接启动后端服务在5000端口，它会同时提供前端静态文件和API\n\
echo "Service will run on http://localhost:5000"\n\
node packages/core/lib/index.js\n\
' > /app/start.sh && chmod +x /app/start.sh

# 只暴露一个端口
EXPOSE 5000

# 启动服务
CMD ["/app/start.sh"]