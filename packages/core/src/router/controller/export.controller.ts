import type { Response } from 'koa'
import {
  controller,
  httpGet,
  type interfaces,
  response
} from 'inversify-koa-utils'
import { inject, injectable } from 'inversify'
import { Symbols } from '../../container'
import type ExportService from '../service/export.service'
import { createReadStream } from 'node:fs'
import { basename } from 'node:path'

@controller('/export')
@injectable()
class ExportController implements interfaces.Controller {
  public constructor(@inject(Symbols.ExportService) private readonly service: ExportService) {}

  /**
   * 获取导出统计信息
   */
  @httpGet('/stats')
  public async getStats(@response() res: Response) {
    res.body = await this.service.getExportStats()
  }

  /**
   * 下载角色数据JSON文件
   */
  @httpGet('/characters.json')
  public async downloadJson(@response() res: Response) {
    try {
      const filePath = await this.service.getJsonFilePath()
      const fileName = basename(filePath)
      
      // 设置响应头
      res.set({
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache'
      })
      
      // 创建文件流并返回
      res.body = createReadStream(filePath)
    } catch (error) {
      console.error('下载JSON文件时发生错误:', error)
      res.status = 500
      res.body = { error: '生成下载文件失败' }
    }
  }

  /**
   * 手动触发重新生成JSON文件
   */
  @httpGet('/regenerate')
  public async regenerateJson(@response() res: Response) {
    try {
      await this.service.generateJsonFile()
      res.body = { message: 'JSON文件重新生成成功' }
    } catch (error) {
      console.error('重新生成JSON文件时发生错误:', error)
      res.status = 500
      res.body = { error: '重新生成文件失败' }
    }
  }
}

export default ExportController