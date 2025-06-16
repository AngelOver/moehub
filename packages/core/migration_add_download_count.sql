-- 为 Character 表添加下载量字段
ALTER TABLE `Character` ADD COLUMN `downloadCount` INT NOT NULL DEFAULT 0;

-- 为现有角色设置默认下载量为0（可选，因为已经设置了默认值）
UPDATE `Character` SET `downloadCount` = 0 WHERE `downloadCount` IS NULL;