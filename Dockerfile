# 基础镜像
FROM node:20-alpine AS base

# 设置工作目录
WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm

# 依赖安装阶段
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/client/package.json ./packages/client/
COPY packages/core/package.json ./packages/core/
COPY packages/common/package.json ./packages/common/

# 安装依赖
RUN pnpm install

# 构建阶段
FROM deps AS builder

# 复制所有源代码
COPY . .

# 生成Prisma客户端
RUN cd packages/core && npx prisma generate

# 构建common和core
RUN pnpm common build
RUN pnpm core build

# 构建客户端
RUN pnpm client build

# 生产阶段
FROM base AS runner

# 设置环境变量
ENV NODE_ENV=production

# 创建必要的目录
WORKDIR /app
RUN mkdir -p packages/core/lib packages/core/public packages/client/dist

# 复制必要的文件
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages/core/package.json ./packages/core/
COPY --from=builder /app/packages/core/lib ./packages/core/lib
COPY --from=builder /app/packages/core/prisma ./packages/core/prisma
COPY --from=builder /app/packages/core/public ./packages/core/public
COPY --from=builder /app/packages/core/data.sql ./packages/core/
COPY --from=builder /app/packages/client/dist ./packages/client/dist

# 安装生产依赖
RUN pnpm install --prod

# 创建启动脚本
RUN echo '#!/bin/sh\n\
cd packages/core\n\
npx prisma generate\n\
cd ../..\n\
node packages/core/lib/index.js\n\
' > /app/start.sh && chmod +x /app/start.sh

# 暴露端口（根据应用配置调整）
EXPOSE 3000 5173

# 启动应用
CMD ["/app/start.sh"]