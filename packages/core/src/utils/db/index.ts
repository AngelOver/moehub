import type { PrismaClient } from '@prisma/client'
import { inject, injectable } from 'inversify'
import type { MoehubDataCharacterInCollection, MoehubDataCharacterSubmit } from '../../../../common/src'
import { Symbols } from '../../container'

@injectable()
export class Database {
  private static client?: PrismaClient

  public readonly character: PrismaClient['character']

  public readonly characterMd: PrismaClient['characterMd']

  public readonly characterWithCollection: PrismaClient['characterWithCollection']

  public readonly collection: PrismaClient['collection']

  public readonly settings: PrismaClient['settings']
  
  // 直接访问character_md表的原始客户端
  public readonly prismaClient: PrismaClient

  public constructor(@inject(Symbols.DatabaseFactory) prismaFactory: () => PrismaClient) {
    if (!Database.client) Database.client = prismaFactory()
    this.character = Database.client.character
    this.characterMd = Database.client.characterMd
    this.characterWithCollection = Database.client.characterWithCollection
    this.collection = Database.client.collection
    this.settings = Database.client.settings
    this.prismaClient = Database.client
  }
  
  /**
   * 获取角色的MD设定
   * @param id 角色ID
   * @returns MD设定内容，如果不存在则返回空字符串
   */
  public async getCharacterMd(id: number): Promise<string> {
    try {
      console.log('Database.getCharacterMd - 查询角色ID:', id);
      
      // 使用Prisma客户端API查询
      const result = await this.characterMd.findFirst({
        where: { id }
      });
      
      console.log('查询结果:', result);
      
      if (result && result.md) {
        console.log('成功获取MD内容，长度:', result.md.length);
        return result.md;
      } else {
        console.log('查询结果为空或不包含md字段');
      }
    } catch (error) {
      console.error('获取角色MD设定失败:', error);
    }
    
    console.log('未能从数据库获取到MD内容，返回空字符串');
    return '';
  }

  public characterDataParse(
    data: ReturnType<Database['character']['findFirst']> extends Promise<infer T> ? Exclude<T, null> : never
  ): MoehubDataCharacterInCollection {
    return {
      ...data,
      alias: data.alias?.split('|'),
      url: data.url?.split('|'),
      images: data.images?.split('|'),
      birthday: data.birthday ? data.birthday.getTime() : undefined,
      tags: data.tags?.split('|')
    }
  }

  public characterDataStringify(data: MoehubDataCharacterSubmit) {
    return {
      ...data,
      alias: data.alias?.join('|'),
      url: data.url?.join('|'),
      images: data.images?.join('|'),
      birthday: data.birthday ? new Date(data.birthday) : undefined,
      tags: data.tags?.join('|')
    }
  }
  /* 
  public cleanFromCharacter(characterId: number, collectionId: number) {
    return Database.client.characterWithCollection.deleteMany({
      where: {
        characterId_collectionId: {
          characterId,
          collectionId
        } 
  } */
}

export default Database
