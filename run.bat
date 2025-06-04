@echo off

REM 安装依赖
call pnpm install

REM 生成 Prisma Client
cd packages\core
call npx prisma generate
cd ..\..

REM 构建核心服务
call pnpm core build

REM 启动核心服务（开发模式）
start cmd /k call pnpm dev:core

REM 等待核心服务启动
timeout /t 5

REM 启动客户端
call pnpm dev:client