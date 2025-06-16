import { Flex, Image, Card, Button, Typography, Input, Row, Col, Tooltip, Menu, Layout } from 'antd'
import { UserOutlined, FireOutlined } from '@ant-design/icons'
import React, { useState, useMemo, useEffect } from 'react'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
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
import { SearchOutlined, PlusCircleOutlined, FilterOutlined, ClearOutlined } from '@ant-design/icons'

const { Title } = Typography
const { Sider, Content } = Layout;

const HomeView: React.FC = () => {
  const sortBy = 'downloadCount' // 固定按下载量排序
  const { data, error, isLoading } = useSWR(`/api/character?sortBy=${sortBy}`, () => getCharacters(sortBy))
  // 只保留实际使用的settings
  useSelector(getSettings)
  // 获取管理员Token，用于判断是否显示添加按钮
  const token = useSelector(getToken)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [searchText, setSearchText] = useState('')
  const [mobileMenuCollapsed, setMobileMenuCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // 监听窗口大小变化
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    // 初始检查
    checkIfMobile()
    
    // 添加窗口大小变化监听
    window.addEventListener('resize', checkIfMobile)
    
    // 清理函数
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

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
      // 移除前端重新排序，保持后端排序结果
  }, [data, selectedTags, searchText])

  if (isLoading) return <Loading />
  if (error || !data) return <ErrorResult />

  const toggleMobileMenu = () => {
    setMobileMenuCollapsed(!mobileMenuCollapsed)
  }

  return (
    <div className={styles.homeContainer}>
      {/* 移动端菜单折叠按钮 - 仅在移动端显示 */}
      {isMobile && (
        <div className={styles.mobileMenuToggle}>
          <Button
            type="primary"
            onClick={toggleMobileMenu}
          >
            {mobileMenuCollapsed ? "展开筛选" : "折叠筛选"}
          </Button>
        </div>
      )}

      {/* 游客创建角色按钮 - 仅在移动端显示 */}
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
      
      <Layout className={styles.mainLayout}>
        {/* 左侧筛选菜单 */}
        <Sider width={220} className={`${styles.menuSider} ${isMobile && mobileMenuCollapsed ? styles.menuCollapsed : ''}`} theme="light">
          {/* 搜索框 */}
          <div className={styles.searchWrapper}>
            <Input
              placeholder="搜索角色..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={() => handleSearch(searchText)}
              className={styles.searchInput}
              bordered={true}
            />
          </div>
          
          
          {/* 菜单 */}
          <Menu
            mode="inline"
            className={styles.mainMenu}
            defaultOpenKeys={['filter', 'tags']}
            items={[
              {
                key: 'filter',
                label: '筛选',
                icon: <FilterOutlined />,
                children: allTags
                  .filter(tag => ['女性向', '男性向', '热门', '原创', '其它'].includes(tag))
                  .map((tag) => ({
                    key: tag,
                    label: tag,
                    className: selectedTags.includes(tag) ? styles.menuItemActive : '',
                    onClick: () => handleTagChange(tag, !selectedTags.includes(tag))
                  }))
              },
              {
                key: 'tags',
                label: '标签',
                children: allTags
                  .filter(tag => !['女性向', '男性向', '热门', '原创', '其它'].includes(tag))
                  .map((tag) => ({
                    key: tag,
                    label: tag,
                    className: selectedTags.includes(tag) ? styles.menuItemActive : '',
                    onClick: () => handleTagChange(tag, !selectedTags.includes(tag))
                  }))
              }
            ]}
          />
          
          {/* 清除筛选按钮 */}
          {(selectedTags.length > 0 || searchText) && (
            <div className={styles.clearBtnWrapper}>
              <Button
                type="text"
                icon={<ClearOutlined />}
                onClick={clearFilters}
                className={styles.clearFilterBtn}
              >
                清除筛选
              </Button>
            </div>
          )}
          
        </Sider>
        
        {/* 右侧内容区域 */}
        <Content className={styles.contentArea}>
          <div className={styles.characterListContainer}>
            <Row gutter={[16, 16]} className={styles.characterList}>
              {filteredCharacters.map((item) => (
                <Col xs={24} sm={12} md={8} lg={6} xl={4} key={item.id}>
                  <Link to={`/character/${item.id}`} className={styles.characterLink}>
                    <Card
                      hoverable
                      className={styles.characterCard}
                    >
                      {/* 下载数显示 - 右上角 */}
                      {(item as any).downloadCount > 0 && (
                        <div className={styles.downloadBadge}>
                          <FireOutlined className={styles.fireIcon} />
                          <span className={styles.downloadCount}>{(item as any).downloadCount}</span>
                        </div>
                      )}
                      
                      <Image
                        src={(item.images as string[])[0]}
                        className={styles.characterImage}
                        alt={item.romaji}
                        preview={false}
                        fallback="data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20width='200'%20height='200'%20viewBox='0%200%2024%2024'%20fill='%23f8bbd0'%3e%3cpath%20d='M12%2012c2.21%200%204-1.79%204-4s-1.79-4-4-4-4%201.79-4%204%201.79%204%204%204zm0%202c-2.67%200-8%201.34-8%204v2h16v-2c0-2.66-5.33-4-8-4z'/%3e%3c/svg%3e"
                      />
                      <Card.Meta
                        title={item.name}
                        description={item.description || ''}
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
        </Content>
      </Layout>
    </div>
  )
}

export default HomeView
