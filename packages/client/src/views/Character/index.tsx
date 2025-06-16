import { Card, Carousel, Descriptions, Flex, Image, Tag, Button, message, Tooltip } from 'antd'
import { DownloadOutlined, CopyOutlined } from '@ant-design/icons'
import { useParams } from 'react-router-dom'
import Loading from '@/components/Loading'
import ErrorResult from '@/components/result/error'
import styles from './styles.module.css'
import useSWR from 'swr'
import { getCharacter, getCharacterMd, recordCharacterDownload } from '@/http'
import { useSelector } from 'react-redux'
import { getSettings } from '@/store/settingsReducer'
import { useEffect, useState, useRef } from 'react'
import i18n, { t } from '@/i18n'
import type { MoehubApiCharacter } from '@moehub/common'

interface InfoCardProps {
  children: React.ReactNode
  title: string
}

function getRandomColor() {
  const list = ['magenta', 'red', 'volcano', 'orange', 'gold', 'lime', 'green', 'cyan', 'blue', 'geekblue', 'purple']
  return list[Math.floor(Math.random() * list.length)]
}

const GenderReflect = {
  MALE: t`view.character.gender.male`,
  OTHER: t`view.character.gender.other`
}

const SeriesGenreReflect = {
  ANIME: t`view.character.seriesGenre.anime`,
  COMIC: t`view.character.seriesGenre.comic`,
  GALGAME: t`view.character.seriesGenre.galgame`,
  GAME: t`view.character.seriesGenre.game`,
  NOVEL: t`view.character.seriesGenre.novel`,
  OTHER: t`view.character.seriesGenre.other`
}

const InfoCard: React.FC<InfoCardProps> = ({ title, children }) => (
  <Card title={title} bordered={false} className={styles.infoCard}>
    {children}
  </Card>
)

const CharacterView: React.FC = () => {
  const { id: characterId } = useParams()
  const { data, error, isLoading } = useSWR(`/api/character/${characterId}`, () => getCharacter(Number(characterId)))
  const { site_title } = useSelector(getSettings)
  const [isDownloading, setIsDownloading] = useState(false)
  const [mdContent, setMdContent] = useState('')
  const [isMdLoading, setIsMdLoading] = useState(false)

  useEffect(() => {
    if (data)
      document.title = `${['ja_JP', 'zh_CN', 'zh_TW'].includes(i18n.get()) ? data.name : data.romaji} - ${site_title}`
    // 角色详情加载完成后获取角色设定内容
    const fetchMdContent = async () => {
      if (data && characterId) {
        try {
          setIsMdLoading(true)
          const content = await getCharacterMd(Number(characterId))
          setMdContent(content || generateCharacterMd(data))
        } catch (err) {
          console.error('获取角色设定内容失败:', err)
          // 如果API请求失败，使用前端生成的内容作为备用
          setMdContent(generateCharacterMd(data))
        } finally {
          setIsMdLoading(false)
        }
      }
    }
    
    if (data && characterId) {
      fetchMdContent()
    }
  }, [data, site_title, characterId])

  const handleDownloadMd = async () => {
    if (!data || !characterId) return
    
    try {
      setIsDownloading(true)
      
      // 从API获取角色MD设定
      let mdContent = ''
      try {
        mdContent = await getCharacterMd(Number(characterId))
      } catch (err) {
        console.error('Failed to fetch MD from API:', err)
      }
      
      // 如果API返回的内容为空，则使用前端生成的内容作为备用
      const finalMdContent = mdContent || generateCharacterMd(data)
      
      // 创建Blob对象
      const blob = new Blob([finalMdContent], { type: 'text/markdown;charset=utf-8' })
      
      // 创建下载链接
      const url = URL.createObjectURL(blob)
      
      // 创建临时a标签并触发下载
      const link = document.createElement('a')
      link.href = url
      link.download = `${data.name}_character_profile.txt`
      document.body.appendChild(link)
      link.click()
      
      // 清理
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      // 记录下载
      try {
        await recordCharacterDownload(Number(characterId))
      } catch (err) {
        console.error('记录下载失败:', err)
        // 下载记录失败不影响用户体验，只记录错误
      }
      
      message.success(t`view.character.downloadSuccess`)
    } catch (err) {
      console.error('Download failed:', err)
      message.error(t`view.character.downloadFailed`)
    } finally {
      setIsDownloading(false)
    }
  }
  
  // 生成基本角色设定MD
  const generateCharacterMd = (character: MoehubApiCharacter['data']) => {
    return `# ${character.name} / ${character.romaji}

## ${t`view.character.whoAmI`}
${character.description || ''}

## ${t`view.character.myCharmPoints`}
${character.tags ? character.tags.join(', ') : ''}

${character.comment ? `## ${t`view.character.adminComment`}\n${character.comment}` : ''}

## ${t`view.character.details`}
- ${t`view.character.gender`}: ${character.gender !== 'FEMALE' ? GenderReflect[character.gender as keyof typeof GenderReflect] : '女性'}
${character.age ? `- ${t`view.character.age`}: ${character.age}` : ''}
${character.birthday ? `- ${t`view.character.birthday`}: ${new Date(character.birthday).getMonth() + 1}月${new Date(character.birthday).getDate()}日` : ''}
${character.series ? `- ${t`view.character.sourceSeries`}: ${character.series}` : ''}
${character.seriesGenre ? `- ${t`view.character.seriesType`}: ${SeriesGenreReflect[character.seriesGenre as keyof typeof SeriesGenreReflect]}` : ''}
${character.voice ? `- ${t`view.character.voiceActor`}: ${character.voice}` : ''}
${character.bloodType ? `- ${t`view.character.bloodType`}: ${character.bloodType}` : ''}
${character.height ? `- ${t`view.character.height`}: ${character.height}cm` : ''}
${character.weight ? `- ${t`view.character.weight`}: ${character.weight}kg` : ''}

${character.hitokoto ? `## 一言\n「${character.hitokoto}」` : ''}
`
  }

  if (isLoading) return <Loading />
  if (error || !data) return <ErrorResult />

  return (
    <div>
      <h1>{t`view.character.title`}</h1>
      <Flex justify="center" align="center" vertical>
        <Card hoverable className="card cardFixed">
          <Button
            type="primary"
            className={styles.downloadButton}
            onClick={handleDownloadMd}
            loading={isDownloading}
            icon={<DownloadOutlined />}
          >
            {t`view.character.downloadMd`}
          </Button>
          {data.hitokoto ? (
            <div {...(data.color ? { style: { color: `#${data.color}` } } : {})} className={styles.hitokoto}>
              『{data.hitokoto}』
            </div>
          ) : null}
          {data.songId ? (
            <>
              <br />
              <iframe
                title={t`view.character.themeSong`}
                style={{ maxWidth: '80%', width: 330, height: 86 }}
                src={`https://music.163.com/outchain/player?auto=1&type=2&id=${data.songId}&height=66`}
              />
              <br />
            </>
          ) : null}
          {data.images && data.images.length > 1 ? (
            <Carousel arrows draggable fade infinite autoplay>
              {data.images.map((item, index) => (
                <Image className={styles.content} src={item} key={Number(index)} />
              ))}
            </Carousel>
          ) : null}
          {data.images && data.images.length === 1 ? <Image className={styles.content} src={data.images[0]} /> : null}
          <div className={styles.characterNameCard} style={data.color ? { color: `#${data.color}` } : {}}>
            <div>{data.name}</div>
            <div>{data.romaji}</div>
          </div>
          
          <Descriptions layout="vertical" title={t`view.character.details`}>
            {data.gender !== 'FEMALE' && (
              <Descriptions.Item label={t`view.character.gender`}>{GenderReflect[data.gender]}</Descriptions.Item>
            )}
            {data.alias && (
              <Descriptions.Item label={t`view.character.alias`}>{data.alias.join('、')}</Descriptions.Item>
            )}
            {data.age && <Descriptions.Item label={t`view.character.age`}>{data.age}</Descriptions.Item>}
            {data.birthday && (
              <Descriptions.Item label={t`view.character.birthday`}>
                {new Date(data.birthday).getMonth() + 1}, {new Date(data.birthday).getDate()}
              </Descriptions.Item>
            )}
            <Descriptions.Item label={t`view.character.sourceSeries`}>{data.series}</Descriptions.Item>
            <Descriptions.Item label={t`view.character.seriesType`}>
              {SeriesGenreReflect[data.seriesGenre]}
            </Descriptions.Item>

            {data.voice && <Descriptions.Item label={t`view.character.voiceActor`}>{data.voice}</Descriptions.Item>}
            {data.bloodType && (
              <Descriptions.Item label={t`view.character.bloodType`}>{data.bloodType}</Descriptions.Item>
            )}
            {data.height && <Descriptions.Item label={t`view.character.height`}>{data.height}cm</Descriptions.Item>}
            {data.weight && <Descriptions.Item label={t`view.character.weight`}>{data.weight}kg</Descriptions.Item>}
            {(data.bust || data.waist || data.hip) && (
              <Descriptions.Item label={t`view.character.measurements`}>
                {(() => {
                  let content = ''
                  if (data.bust) content += `B${data.bust}`
                  if (data.waist) content += `${data.bust ? '/' : ''}W${data.waist}`
                  if (data.hip) content += `${data.bust || data.waist ? '/' : ''}H${data.hip}`
                  return content
                })()}
              </Descriptions.Item>
            )}
          </Descriptions>
          
          {/* 角色设定文本框 */}
          <InfoCard title={t`view.character.characterSetting` || "角色设定"}>
            {isMdLoading ? (
              <div>加载中...</div>
            ) : (
              <>
                <div className={styles.mdDisplayBox}>
                  {mdContent}
                </div>
                <div className={styles.copyButtonContainer}>
                  <Button
                    type="primary"
                    onClick={() => {
                      navigator.clipboard.writeText(mdContent)
                        .then(() => message.success('已复制到剪贴板'))
                        .catch(err => {
                          console.error('复制失败:', err);
                          message.error('复制失败');
                        });
                    }}
                  >
                    复制内容
                  </Button>
                </div>
              </>
            )}
          </InfoCard>
          
          {data.description && <InfoCard title={t`view.character.whoAmI`}>{data.description}</InfoCard>}
          {data.tags && data.tags.length > 0 && (
            <InfoCard title={t`view.character.myCharmPoints`}>
              {data.tags.map((value, index) => (
                <Tag key={Number(index)} color={getRandomColor()}>
                  {value}
                </Tag>
              ))}
            </InfoCard>
          )}
          {data.comment ? <InfoCard title={t`view.character.adminComment`}>{data.comment}</InfoCard> : null}
          {data.url && data.url.length > 0 && (
            <InfoCard title={t`view.character.relatedLinks`}>
              {(data.url as string[]).map((item, index) => (
                <li key={Number(index)}>
                  <a href={item} target="_blank" rel="noreferrer">
                    {item.length > 30 ? `${item.slice(0, 30)}...` : item}
                  </a>
                </li>
              ))}
            </InfoCard>
          )}
        </Card>
      </Flex>
    </div>
  )
}

export default CharacterView
