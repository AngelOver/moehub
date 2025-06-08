# Docker 部署说明

本项目使用 Docker 和 Docker Compose 进行容器化部署，包括前端和后端服务，连接到远程数据库。

## 前提条件

- 安装 [Docker](https://docs.docker.com/get-docker/)
- 安装 [Docker Compose](https://docs.docker.com/compose/install/)
- 远程数据库连接信息

## 环境变量配置

在项目根目录创建 `.env` 文件，添加以下内容：

```
# 数据库连接URL - 必须以mysql://开头
DATABASE_URL=mysql://用户名:密码@数据库地址:端口/数据库名
```

> 重要提示：Prisma要求DATABASE_URL必须以mysql://开头，否则会报错。请确保按照此格式正确配置数据库连接字符串。

## 快速启动

在项目根目录下执行以下命令：

```bash 
# 1. 复制环境变量模板
cp .env.example .env

# 2. 编辑.env文件，填入实际数据库连接信息
# 确保DATABASE_URL格式正确：mysql://用户名:密码@数据库地址:端口/数据库名

# 3. 构建并启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

## 服务说明

- 前后端应用: http://localhost:3000
- 前端开发服务: http://localhost:5173

## 数据持久化

- 图片等静态资源挂载在 `./packages/core/public` 目录

## 常用命令

```bash
# 停止服务
docker-compose down

# 重新构建并启动服务
docker-compose up -d --build

# 查看容器状态
docker-compose ps

# 进入应用容器
docker-compose exec app sh
```

## 配置说明

- Dockerfile: 多阶段构建前后端应用
- docker-compose.yml: 配置应用服务和环境变量

## 注意事项

1. 请确保远程数据库可以从容器网络访问
2. 敏感信息如数据库连接字符串应存储在 `.env` 文件中，并且不要将该文件提交到版本控制系统
3. 如需在生产环境中部署，建议进一步加强安全措施，如使用 Docker secrets 管理敏感信息