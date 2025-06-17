import { inject, injectable } from 'inversify'
import { Symbols } from '../../container'
import Database from '../../utils/db'
import type { MoehubDataCharacter, MoehubDataCharacterSubmit } from '../../../../common/src'
import HttpError from '../../app/error'

@injectable()
export class CharacterService {
  // Everything is for typescript's type infer
  private getOrigin(id: number) {
    return this.db.character.findFirst({
      where: { id },
      include: { collections: true }
    })
  }

  public async getDataHandle(
    data: ReturnType<CharacterService['getOrigin']> extends Promise<infer T> ? T : never
  ): Promise<MoehubDataCharacter | null> {
    if (!data) return null
    return {
      ...this.db.characterDataParse(data),
      collections: (
        await Promise.all(data.collections.map((c) => this.db.collection.findFirst({ where: { id: c.collectionId } })))
      ).filter((c) => c !== null)
    }
  }

  public constructor(@inject(Symbols.Database) private readonly db: Database) {}

  public async get(id: number): Promise<MoehubDataCharacter> {
    const result = await this.getDataHandle(await this.getOrigin(id))
    if (!result) throw new HttpError('Character not found', 404)
    return result
  }

  public async getAll(sortBy?: 'downloadCount' | 'createdAt' | 'order'): Promise<MoehubDataCharacter[]> {
    // 设置排序选项
    const orderBy = sortBy === 'downloadCount'
      ? { downloadCount: 'desc' as const }
      : sortBy === 'createdAt'
      ? { createdAt: 'desc' as const }
      : { order: 'asc' as const };

    // Get all characters with its collections
    return (
      await Promise.all(
        (await this.db.character.findMany({
          include: { collections: true },
          orderBy
        }))?.map((data) => this.getDataHandle(data))
      )
    ).filter((data) => data !== null)
  }

  public async create(data: MoehubDataCharacterSubmit, md?: string) {
    /* Check if collections exists */
    const collectionsId = data.collections
      ? await Promise.all(
          data.collections.map(async (collection) => {
            const result = await this.db.collection.findFirst({ where: { id: collection } })
            if (!result) throw new HttpError(`Collection with id ${collection} does not exist`)
            return result.id
          })
        )
      : []

    /* Create character */
    const { id: characterId } = await this.db.character.create({
      data: { ...this.db.characterDataStringify(data), collections: undefined }
    })

    /* Connect character with collections */
    for (const collectionId of collectionsId) {
      this.db.characterWithCollection.create({ data: { collectionId, characterId } })
    }
    
    /* 保存角色设定MD内容 */
    if (md) {
      try {
        console.log('保存角色设定MD内容, 角色ID:', characterId);
        await this.db.characterMd.upsert({
          where: { id: characterId },
          update: { md },
          create: { id: characterId, md }
        });
        console.log('角色设定MD内容保存成功');
      } catch (error) {
        console.error('保存角色设定MD内容失败:', error);
        // 保存MD失败不影响角色创建的整体流程，所以这里只记录错误但不抛出
      }
    }

    return 201
  }

  public async update(id: number, data: MoehubDataCharacterSubmit) {
    /* Check if character exists */
    if (!(await this.db.character.findFirst({ where: { id } }))) throw new HttpError('Character not found', 404)

    // biome-ignore lint:
    delete data.collections
    await this.db.character.update({
      where: { id },
      data: {
        ...(this.db.characterDataStringify(data) as Omit<ReturnType<Database['characterDataStringify']>, 'collections'>)
      }
    })
  }

  public async remove(id: number) {
    if (!(await this.db.character.findFirst({ where: { id } }))) throw new HttpError('Character not found', 404)
    await this.db.character.delete({ where: { id } })
  }

  /**
   * 切换角色的显示/隐藏状态
   * @param id 角色ID
   * @param hide 是否隐藏
   */
  public async toggleHide(id: number, hide: boolean) {
    /* 检查角色是否存在 */
    const character = await this.db.character.findFirst({ where: { id } });
    if (!character) throw new HttpError('Character not found', 404);
    
    /* 更新角色的hide状态 */
    await this.db.character.update({
      where: { id },
      data: { hide }
    });
  }

  /**
   * 获取角色的MD设定
   * @param id 角色ID
   * @returns 角色的MD设定文本
   */
  public async getMd(id: number): Promise<string> {
    // 首先检查角色是否存在
    if (!(await this.db.characterMd.findFirst({ where: { id } })))
      throw new HttpError('Character not found', 404)
    
    try {
      console.log('getMd - 角色ID:', id);
      
      // 尝试使用Database类中的getCharacterMd方法获取MD内容
      console.log('尝试从character_md表获取数据...');
      const mdContent = await this.db.getCharacterMd(id);
      
      if (mdContent && mdContent.length > 0) {
        console.log('成功从数据库获取MD内容，长度:', mdContent.length);
        return mdContent;
      }
      
      console.log('数据库中没有找到MD内容，尝试生成...');
      
      // 如果数据库中没有MD内容，则基于角色数据生成
      const characterData = await this.db.character.findFirst({
        where: { id }
      });
      
      console.log('获取到角色数据:', characterData);
      
      if (characterData) {
        // 生成一个基于角色数据的MD内容
        const generatedMd = this.generateMdFromCharacter(characterData);
        console.log('生成的MD内容长度:', generatedMd.length);
        return generatedMd;
      }
    } catch (error) {
      console.error('获取角色MD时发生错误:', error);
    }
    
    console.log('所有尝试都失败，返回空字符串');
    // 返回空字符串，前端会使用自动生成的内容作为备用
    return '';
  }
  
  /**
   * 从角色数据生成MD内容
   * @param character 角色数据
   * @returns 生成的MD内容
   */
  private generateMdFromCharacter(character: any): string {
    try {
      // 解析character对象中的数据
      const name = character.name || '';
      const romaji = character.romaji || '';
      const description = character.description || '';
      const tags = character.tags ? character.tags.split('|') : [];
      const comment = character.comment || '';
      const gender = character.gender || '';
      const age = character.age || '';
      const birthday = character.birthday ? `${new Date(character.birthday).getMonth() + 1}月${new Date(character.birthday).getDate()}日` : '';
      const series = character.series || '';
      const seriesGenre = character.seriesGenre || '';
      const voice = character.voice || '';
      const bloodType = character.bloodType || '';
      const height = character.height ? `${character.height}cm` : '';
      const weight = character.weight ? `${character.weight}kg` : '';
      const hitokoto = character.hitokoto || '';
      
      // 构建MD内容
      let md = `# ${name} / ${romaji}\n\n`;
      
      if (description) {
        md += `## 我是谁\n${description}\n\n`;
      }
      
      if (tags.length > 0) {
        md += `## 我的萌点\n${tags.join(', ')}\n\n`;
      }
      
      if (comment) {
        md += `## 站长评价\n${comment}\n\n`;
      }
      
      // 详细信息部分
      md += `## 详细信息\n`;
      if (gender) md += `- 性别: ${gender === 'FEMALE' ? '女性' : gender === 'MALE' ? '男性' : '其它/未知'}\n`;
      if (age) md += `- 年龄: ${age}\n`;
      if (birthday) md += `- 出生日期: ${birthday}\n`;
      if (series) md += `- 来源作品: ${series}\n`;
      if (seriesGenre) md += `- 作品类型: ${this.getSeriesGenreText(seriesGenre)}\n`;
      if (voice) md += `- 声优: ${voice}\n`;
      if (bloodType) md += `- 血型: ${bloodType}\n`;
      if (height) md += `- 身高: ${height}\n`;
      if (weight) md += `- 体重: ${weight}\n`;
      
      // 一言
      if (hitokoto) {
        md += `\n## 一言\n「${hitokoto}」\n`;
      }
      
      return md;
    } catch (error) {
      console.error('生成MD内容时出错:', error);
      return '';
    }
  }
  
  /**
   * 获取作品类型的文本表示
   * @param seriesGenre 作品类型枚举值
   * @returns 作品类型的文本
   */
  private getSeriesGenreText(seriesGenre: string): string {
    const genreMap: Record<string, string> = {
      'ANIME': '动画',
      'COMIC': '漫画',
      'GALGAME': 'Galgame',
      'GAME': '游戏',
      'NOVEL': '轻小说',
      'OTHER': '其它'
    };
    
    return genreMap[seriesGenre] || seriesGenre;
  }

  /**
   * 记录角色下载
   * @param id 角色ID
   */
  public async recordDownload(id: number) {
    /* 检查角色是否存在 */
    const character = await this.db.character.findFirst({ where: { id } });
    if (!character) throw new HttpError('Character not found', 404);
    
    /* 增加下载计数 */
    await this.db.character.update({
      where: { id },
      data: {
        downloadCount: {
          increment: 1
        }
      }
    });
  }
}

export default CharacterService
