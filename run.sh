#!/bin/bash

# 安装依赖
pnpm install

# 生成 Prisma Client
cd packages/core
npx prisma generate
cd ../..

# 构建核心服务
pnpm core build

# 启动核心服务（开发模式）
pnpm dev:core &

# 等待核心服务启动
sleep 5

# 启动客户端
pnpm dev:client