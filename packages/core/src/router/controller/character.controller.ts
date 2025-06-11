import type { Response } from 'koa'
import {
  controller,
  httpDelete,
  httpGet,
  httpPost,
  httpPut,
  type interfaces,
  requestBody,
  requestParam,
  response
} from 'inversify-koa-utils'
import { inject, injectable } from 'inversify'
import { Symbols } from '../../container'
import type CharacterService from '../service/character.service'
import { characterSchema } from '../../../../common/src'
import Auth from '../../utils/auth'

@controller('/character')
@injectable()
class CharacterController implements interfaces.Controller {
  public constructor(@inject(Symbols.CharacterService) private readonly service: CharacterService) {}

  @httpGet('/:id')
  public async get(@requestParam('id') id: string, @response() res: Response) {
    res.body = await this.service.get(Number(id))
  }

  @httpGet('/')
  public async getAll(@response() res: Response) {
    res.body = await this.service.getAll()
  }

  @httpPost('/', Auth.middleware())
  public async post(@requestBody() body: unknown, @response() res: Response) {
    // 从请求体中提取md内容
    const { md, ...characterData } = body as { md?: string } & Record<string, unknown>
    const data = characterSchema.parse(characterData)
    res.status = await this.service.create(data, md)
  }

  @httpPut('/:id', Auth.middleware())
  public async put(@requestParam('id') id: string, @requestBody() body: unknown, @response() res: Response) {
    const data = characterSchema.parse(body)
    await this.service.update(Number(id), data)
    res.status = 204
  }

  @httpDelete('/:id', Auth.middleware())
  public async delete(@requestParam('id') id: string, @response() res: Response) {
    await this.service.remove(Number(id))
    res.status = 204
  }

  /**
   * 获取角色的MD设定
   * @param id 角色ID
   * @param res 响应对象
   */
  @httpGet('/:id/md')
  public async getMd(@requestParam('id') id: string, @response() res: Response) {
    const md = await this.service.getMd(Number(id))
    res.body = md
  }

  /**
   * 切换角色的显示/隐藏状态
   * @param id 角色ID
   * @param body 请求体，包含hide状态
   * @param res 响应对象
   */
  @httpPut('/:id/hide', Auth.middleware())
  public async toggleHide(@requestParam('id') id: string, @requestBody() body: unknown, @response() res: Response) {
    const { hide } = body as { hide: boolean };
    await this.service.toggleHide(Number(id), hide);
    res.status = 204;
  }
}

export default CharacterController
