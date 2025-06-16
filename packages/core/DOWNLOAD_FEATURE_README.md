# 下载量排序功能部署指南

## 功能概述
添加了按下载量排序角色的功能，包括：
1. 数据库添加 `downloadCount` 字段记录下载次数
2. 后端 API 支持按下载量排序
3. 前端首页添加排序选择器
4. 角色详情页下载时自动记录下载次数

## 部署步骤

### 1. 数据库迁移
执行以下 SQL 语句添加下载量字段：
```sql
ALTER TABLE `Character` ADD COLUMN `downloadCount` INT NOT NULL DEFAULT 0;
```

或者运行迁移脚本：
```bash
# 在数据库中执行
mysql -u [username] -p [database_name] < migration_add_download_count.sql
```

### 2. 更新 Prisma 客户端
```bash
cd packages/core
npx prisma generate
```

### 3. 重启后端服务
重启 Node.js 后端服务以加载新的数据模型和 API 接口。

### 4. 重新构建前端
```bash
cd packages/client
npm run build
```

## API 变更

### 新增接口
- `POST /character/:id/download` - 记录角色下载

### 修改接口
- `GET /character?sortBy=downloadCount|createdAt|order` - 获取角色列表，支持排序参数

## 前端变更
- 首页添加排序选择器，支持按下载量、创建时间、默认排序
- 角色详情页下载时自动记录下载次数

## 注意事项
1. 现有角色的下载量初始值为 0
2. 下载记录失败不会影响用户的下载体验
3. 排序功能向后兼容，不传 sortBy 参数时使用默认排序