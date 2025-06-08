# 基础镜像
FROM node:20-alpine AS base

# 安装pnpm
RUN npm install -g pnpm

# 设置工作目录
WORKDIR /app

# 创建必要的目录结构
RUN mkdir -p packages/client packages/core packages/common

# 复制package.json文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/client/package.json packages/client/
COPY packages/core/package.json packages/core/
COPY packages/common/package.json packages/common/

# 安装依赖
RUN pnpm install

# 复制源代码
COPY packages/client/public packages/client/public
COPY packages/client/src packages/client/src
COPY packages/client/index.html packages/client/
COPY packages/client/tsconfig.json packages/client/
COPY packages/client/tsconfig.node.json packages/client/
COPY packages/client/vite.config.ts packages/client/

COPY packages/common/src packages/common/src
COPY packages/common/tsconfig.json packages/common/

COPY packages/core/src packages/core/src
COPY packages/core/prisma packages/core/prisma
COPY packages/core/public packages/core/public
COPY packages/core/tsconfig.json packages/core/
COPY packages/core/data.sql packages/core/

# 复制配置文件
COPY tsconfig.base.json tsconfig.json tsup.config.ts ./

# 生成Prisma客户端
RUN cd packages/core && npx prisma generate

# 构建项目
RUN pnpm common build
RUN pnpm core build
RUN pnpm client build

# 设置环境变量
ENV NODE_ENV=production
ENV COMPOSE_BAKE=true

# 暴露端口
EXPOSE 3000 5173

# 启动应用
WORKDIR /app
CMD cd packages/core && npx prisma generate && cd .. && cd .. && node packages/core/lib/index.js