import { Flex, Image, Card, Button, Checkbox, Typography, Space, Divider } from 'antd'
import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getCharacters } from '@/http/index'
import Loading from '@/components/Loading'
import ErrorResult from '@/components/result/error'
import styles from './styles.module.css'
import useSWR from 'swr'
import { getSettings } from '@/store/settingsReducer'
import { useSelector } from 'react-redux'
import { t } from '@/i18n'

const { Title } = Typography

function renderLinkBlock(link: string, text: string) {
  return (
    <a href={link} target="_blank" rel="noreferrer">
      <Button className="cardButton" ghost>
        {text}
      </Button>
    </a>
  )
}

function renderTimeline(date: string, content: string) {
  return (
    <li>
      <strong>{date}</strong> {content}
    </li>
  )
}

const HomeView: React.FC = () => {
  const { data, error, isLoading } = useSWR('/api/character', getCharacters)
  // 只保留实际使用的settings
  useSelector(getSettings)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // 获取所有标签
  const allTags = useMemo(() => {
    if (!data) return []
    const tagSet = new Set<string>()
    data.forEach((character) => {
      if (Array.isArray(character.tags)) {
        character.tags.forEach((tag) => tagSet.add(tag))
      }
    })
    return Array.from(tagSet).sort()
  }, [data])

  const handleTagChange = (tag: string, checked: boolean) => {
    setSelectedTags((prev) => {
      if (checked) {
        return [...prev, tag]
      } else {
        return prev.filter((t) => t !== tag)
      }
    })
  }

  const clearFilters = () => {
    setSelectedTags([])
  }

  // 过滤角色列表
  const filteredCharacters = useMemo(() => {
    if (!data) return []
    
    return data
      .filter((item) => {
        // 基本过滤：有图片且不隐藏
        const basicFilter = Array.isArray(item.images) && item.images.length > 0 && !item.hide
        
        // 标签过滤
        const tagFilter = selectedTags.length === 0 ||
          (Array.isArray(item.tags) && item.tags && selectedTags.every(tag => item.tags!.includes(tag)))
        
        return basicFilter && tagFilter
      })
      .reverse()
      .sort((a, b) => (a.order ?? 50) - (b.order ?? 50))
  }, [data, selectedTags])

  if (isLoading) return <Loading />
  if (error || !data) return <ErrorResult />

  return (
    <div>
         {/* 右侧角色列表 */}
     
     

      <h1>{t`view.home.characterList`}</h1>
      <Flex className={styles.mainContent}>
        {/* 左侧筛选栏 */}
        <div className={styles.filterSidebar}>
          <Title level={4}>{t`view.home.tagFilter`}</Title>
          <Button type="link" onClick={clearFilters} style={{ padding: '0 0 16px 0' }}>
            {t`view.home.clearFilters`}
          </Button>
          <div className={styles.tagList}>
            {allTags.map((tag) => (
              <div key={tag} className={styles.tagItem}>
                <Checkbox
                  checked={selectedTags.includes(tag)}
                  onChange={(e) => handleTagChange(tag, e.target.checked)}
                >
                  {tag}
                </Checkbox>
              </div>
            ))}
          </div>
        </div>
        
        <Divider type="vertical" style={{ height: 'auto' }} />
        
        {/* 右侧角色列表 */}
        <Flex justify="start" wrap className={styles.characterList}>
          {filteredCharacters.map((item) => (
            <Link to={`/character/${item.id}`} key={item.id} className={styles.characterLink}>
              <Card
                hoverable
                className={`card ${styles.characterCard}`}
                cover={<Image src={(item.images as string[])[0]} className={styles.characterImage} alt={item.romaji} />}
              >
                <br />
                <span>{}</span>
                <Card.Meta
                  title={item.name}
                  description={
                    item.description
                      ? item.description.length > 70
                        ? `${item.description.slice(0, 67)} ...`
                        : item.description
                      : ''
                  }
                />
              </Card>
            </Link>
          ))}
          {filteredCharacters.length === 0 && (
            <div className={styles.noResults}>
              <p>{t`view.home.noResults`}</p>
            </div>
          )}
        </Flex>
      </Flex>
    </div>
  )
}

export default HomeView
