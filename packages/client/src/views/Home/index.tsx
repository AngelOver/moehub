import { Flex, Image, Card, Button, Checkbox, Typography, Space, Divider, Input, Row, Col, Tooltip } from 'antd'
import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getCharacters } from '@/http/index'
import Loading from '@/components/Loading'
import ErrorResult from '@/components/result/error'
import styles from './styles.module.css'
import useSWR from 'swr'
import { getSettings } from '@/store/settingsReducer'
import { getToken } from '@/store/adminReducer'
import { useSelector } from 'react-redux'
import { t } from '@/i18n'
import { SearchOutlined, PlusCircleOutlined } from '@ant-design/icons'

const { Title } = Typography
const { Search } = Input

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
  // 获取管理员Token，用于判断是否显示添加按钮
  const token = useSelector(getToken)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [searchText, setSearchText] = useState('')

  // 固定五个分类，排序不变
  const allTags = useMemo(() => {
    if (!data) return ['女性向', '男性向', '热门', '原创', '其它']
    
    // 固定的五个标签（按指定顺序）
    const fixedTags = ['女性向', '男性向', '热门', '原创', '其它'];
    const tagSet = new Set<string>(fixedTags);
    
    // 然后添加其他标签
    data.forEach((character) => {
      if (Array.isArray(character.tags)) {
        character.tags.forEach((tag) => tagSet.add(tag))
      }
    })
    
    // 转换为数组，确保固定五个标签在前面且顺序不变
    const tagsArray = Array.from(tagSet);
    
    // 自定义排序，保证固定标签的顺序
    return tagsArray.sort((a, b) => {
      const aIndex = fixedTags.indexOf(a);
      const bIndex = fixedTags.indexOf(b);
      
      // 如果两个都是固定标签，按照fixedTags中的顺序排序
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      
      // 如果只有a是固定标签，a排在前面
      if (aIndex !== -1) return -1;
      
      // 如果只有b是固定标签，b排在前面
      if (bIndex !== -1) return 1;
      
      // 两个都不是固定标签，按字母顺序排序
      return a.localeCompare(b);
    });
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
    setSearchText('')
  }
  
  const handleSearch = (value: string) => {
    setSearchText(value)
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
        
        // 搜索文本过滤
        const searchFilter = searchText === '' ||
          (item.name && item.name.toLowerCase().includes(searchText.toLowerCase())) ||
          (item.romaji && item.romaji.toLowerCase().includes(searchText.toLowerCase())) ||
          (item.description && item.description.toLowerCase().includes(searchText.toLowerCase()))
        
        return basicFilter && tagFilter && searchFilter
      })
      .reverse()
      .sort((a, b) => (a.order ?? 50) - (b.order ?? 50))
  }, [data, selectedTags, searchText])

  if (isLoading) return <Loading />
  if (error || !data) return <ErrorResult />

  return (
    <div className={styles.homeContainer}>
      {/* 创建角色按钮 - 仅管理员可见 */}
      {token && (
        <Tooltip title="管理员创建角色" placement="left">
          <Link to="/admin/create" className={styles.createButton}>
            <Button
              type="primary"
              shape="circle"
              icon={<PlusCircleOutlined />}
              size="large"
            />
          </Link>
        </Tooltip>
      )}
      
      {/* 游客创建角色按钮 - 所有人可见 */}
      <Tooltip title="创建新角色" placement="left">
        <Link to="/create" className={styles.guestCreateButton}>
          <Button
            type="default"
            shape="round"
            icon={<PlusCircleOutlined />}
            size="middle"
          >
            添加角色
          </Button>
        </Link>
      </Tooltip>
      
      <Row className={styles.mainContent}>
        {/* 左侧筛选栏 - 在大屏幕上占4列，小屏幕上占6列 */}
        <Col xs={6} sm={5} md={4} lg={4} xl={3} className={styles.filterSidebar}>
          <div>
            {/* 搜索框 */}
            <div className={styles.searchWrapper}>
              <Input
                placeholder="名称查询"
                allowClear
                suffix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={() => handleSearch(searchText)}
                className={styles.searchInput}
              />
            </div>
            
            {/* 清除按钮单独一行，居中显示 */}
            <div className={styles.clearBtnWrapper}>
              <Button
                type="link"
                onClick={clearFilters}
                className={styles.clearFilterBtn}
              >
                清除筛选
              </Button>
            </div>
            <div className={styles.tagList}>
              {allTags.map((tag) => (
                <div key={tag} className={styles.tagItem}>
                  <Checkbox
                    checked={selectedTags.includes(tag)}
                    onChange={(e) => handleTagChange(tag, e.target.checked)}
                    className={
                      ['女性向', '男性向', '热门', '原创', '其它'].includes(tag)
                        ? styles.primaryTag
                        : selectedTags.includes(tag)
                          ? styles.selectedTag
                          : ''
                    }
                  >
                    {tag}
                  </Checkbox>
                </div>
              ))}
            </div>
          </div>
        </Col>
        
        {/* 右侧角色列表 - 在大屏幕上占20列，小屏幕上占18列 */}
        <Col xs={18} sm={19} md={20} lg={20} xl={21}>
          <div className={styles.characterListContainer}>
            <Row gutter={[16, 16]} className={styles.characterList}>
              {filteredCharacters.map((item) => (
                <Col xs={24} sm={12} md={8} lg={6} xl={4} key={item.id}>
                  <Link to={`/character/${item.id}`} className={styles.characterLink}>
                    <Card
                      hoverable
                      className={styles.characterCard}
                      cover={<Image src={(item.images as string[])[0]} className={styles.characterImage} alt={item.romaji} />}
                    >
                      <br />
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
                </Col>
              ))}
              {filteredCharacters.length === 0 && (
                <Col span={24}>
                  <div className={styles.noResults}>
                    <p>{t`view.home.noResults`}</p>
                  </div>
                </Col>
              )}
            </Row>
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default HomeView
