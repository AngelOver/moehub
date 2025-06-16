import { inject, injectable } from 'inversify'
import { Symbols } from '../../container'
import Database from '../../utils/db'
import type SettingsService from './settings.service'
import { writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import config from '../../config'

interface ExportCharacterData {
  act: string
  prompt: string
}

@injectable()
export class ExportService {
  private jsonFilePath: string
  private lastGeneratedTime?: number
  private readonly cacheDuration = 30 * 60 * 1000 // 30分钟缓存

  public constructor(
    @inject(Symbols.Database) private readonly db: Database,
    @inject(Symbols.SettingsService) private readonly settingsService: SettingsService
  ) {
    // 确保导出目录存在
    const exportDir = join(config.public, 'exports')
    if (!existsSync(exportDir)) {
      mkdirSync(exportDir, { recursive: true })
    }
    this.jsonFilePath = join(exportDir, 'characters.json')
  }

  /**
   * 检查是否需要重新生成json文件
   */
  private shouldRegenerate(): boolean {
    if (!existsSync(this.jsonFilePath)) return true
    if (!this.lastGeneratedTime) return true
    return Date.now() - this.lastGeneratedTime > this.cacheDuration
  }

  /**
   * 从角色数据生成提示词
   */
  private generatePromptFromCharacter(character: {
    name: string
    romaji?: string | null
    description?: string | null
    tags?: string | null
    series?: string | null
    gender: string
    age?: number | null
    voice?: string | null
    hitokoto?: string | null
    comment?: string | null
  }): string {
    const name = character.name || '未知角色'
    const romaji = character.romaji || ''
    const description = character.description || ''
    const tags = character.tags ? character.tags.split('|').filter(Boolean) : []
    const series = character.series || ''
    const gender = character.gender === 'FEMALE' ? '女性' : character.gender === 'MALE' ? '男性' : '未知'
    const age = character.age ? `${character.age}岁` : ''
    const voice = character.voice || ''
    const hitokoto = character.hitokoto || ''
    const comment = character.comment || ''

    // 构建角色扮演提示词
    let prompt = `我希望你扮演${name}`
    if (romaji) prompt += `（${romaji}）`
    if (series) prompt += `，来自《${series}》`
    prompt += '。'

    if (description) {
      prompt += `角色背景：${description} `
    }

    if (tags.length > 0) {
      prompt += `角色特点：${tags.join('、')}。`
    }

    // 添加基本信息
    const info = []
    if (gender !== '未知') info.push(`性别${gender}`)
    if (age) info.push(`年龄${age}`)
    if (voice) info.push(`声优是${voice}`)
    
    if (info.length > 0) {
      prompt += `基本信息：${info.join('，')}。`
    }

    if (hitokoto) {
      prompt += `经典台词："${hitokoto}"。`
    }

    if (comment) {
      prompt += `角色评价：${comment} `
    }

    prompt += '请以这个角色的身份、语气和性格特点来回应我的对话，保持角色的一致性。'

    return prompt
  }

  /**
   * 生成json文件
   */
  public async generateJsonFile(): Promise<void> {
    try {
      console.log('开始生成角色导出JSON文件...')
      
      // 获取所有非隐藏的角色
      const characters = await this.db.character.findMany({
        where: { hide: false },
        orderBy: { order: 'asc' }
      })

      // 获取站点设置
      const settings = await this.settingsService.get(false)
      const siteTitle = settings.site_title || 'MoeHub'

      // 转换为导出格式
      const exportData: ExportCharacterData[] = characters.map((character: any) => ({
        act: `扮演${character.name}${character.romaji ? `（${character.romaji}）` : ''}`,
        prompt: this.generatePromptFromCharacter(character)
      }))

      // 添加站点信息到开头
      exportData.unshift({
        act: `${siteTitle}角色扮演助手`,
        prompt: `我是${siteTitle}的角色扮演助手。我可以帮助你扮演各种二次元角色，包括动画、漫画、游戏、轻小说等作品中的角色。请告诉我你想要扮演哪个角色，或者选择下面的角色之一开始对话。`
      })

      // 写入文件
      writeFileSync(this.jsonFilePath, JSON.stringify(exportData, null, 2), 'utf-8')
      this.lastGeneratedTime = Date.now()
      
      console.log(`JSON文件生成完成，共导出${exportData.length}个角色提示词`)
    } catch (error) {
      console.error('生成JSON文件时发生错误:', error)
      throw error
    }
  }

  /**
   * 获取json文件路径（用于下载）
   */
  public async getJsonFilePath(): Promise<string> {
    if (this.shouldRegenerate()) {
      await this.generateJsonFile()
    }
    return this.jsonFilePath
  }

  /**
   * 获取导出统计信息
   */
  public async getExportStats() {
    const totalCharacters = await this.db.character.count()
    const visibleCharacters = await this.db.character.count({ where: { hide: false } })
    const lastGenerated = this.lastGeneratedTime ? new Date(this.lastGeneratedTime) : null
    const fileExists = existsSync(this.jsonFilePath)

    return {
      totalCharacters,
      visibleCharacters,
      lastGenerated,
      fileExists,
      needsRegeneration: this.shouldRegenerate()
    }
  }
}

export default ExportService