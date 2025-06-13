import { Flex, Layout as AntLayout, Avatar, Menu, Button } from 'antd'
import { PictureOutlined, PoweroffOutlined, TranslationOutlined, PlusOutlined, HomeOutlined, UserAddOutlined } from '@ant-design/icons'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import styles from './styles.module.css'
import { useEffect, useRef, useState } from 'react'
import { getToken, nextLanguage } from '@/store/adminReducer'
import { getCurrentBackground, getSettings } from '@/store/settingsReducer'
import { useDispatch, useSelector } from 'react-redux'

interface LayoutProps {
  title: string
  outlet: React.ReactElement
  isPrivate?: boolean
}

const Layout: React.FC<LayoutProps> = ({ title, outlet, isPrivate }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isLogged = useSelector(getToken)
  const settings = useSelector(getSettings)
  const currentBackground = useSelector(getCurrentBackground)
  const styleInjected = useRef(false);

  // 添加全局样式，包括按钮动画
  useEffect(() => {
    if (!styleInjected.current) {
      const style = document.createElement('style');
      style.innerHTML = `
        @keyframes pulseButton {
          0% {
            transform: scale(1);
            box-shadow: 0 4px 12px rgba(255, 0, 0, 0.5), 0 0 20px rgba(255, 204, 0, 0.4);
          }
          100% {
            transform: scale(1.03);
            box-shadow: 0 4px 15px rgba(255, 0, 0, 0.6), 0 0 30px rgba(255, 204, 0, 0.6);
          }
        }
      `;
      document.head.appendChild(style);
      styleInjected.current = true;
    }
    
    document.title = title ? `${title} | ${settings.site_title}` : settings.site_title
    if (isPrivate && !isLogged) navigate('/admin/login')
  }, []);

  const location = useLocation();
  const [current, setCurrent] = useState('home');
  
  useEffect(() => {
    const path = location.pathname;
    if (path === '/') setCurrent('home');
    else if (path === '/create') setCurrent('create');
  }, [location]);

  // 菜单项配置
  const menuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: '首页',
      link: '/'
    },
    {
      key: 'create',
      icon: <UserAddOutlined />,
      label: '创建角色',
      link: '/create'
    }
  ];

  return (
    <>
      <div
        className={styles.background}
        style={{
          backgroundImage: `url(${currentBackground})`
        }}
      />
      <Flex gap="middle" wrap>
        <AntLayout className={styles.layout}>
          <AntLayout.Header className={styles.header}>
            <div className={styles.headerLeft}>
              <Link className={styles.headerTitle} to="/">
                <Avatar style={{ marginRight: 10 }} src={settings.site_logo} />
                <span className={styles.siteName}>{settings.site_name}</span>
              </Link>
            </div>
            
            <Menu
              mode="horizontal"
              selectedKeys={[current]}
              className={styles.headerMenu}
              items={menuItems.map(item => ({
                key: item.key,
                icon: item.icon,
                label: <Link to={item.link} className={styles.menuLink}>{item.label}</Link>,
                className: item.key === 'create' ? styles.createMenuItem : ''
              }))}
              theme="light"
            />
            
            <div className={styles.headerRight}>
              <Button
                type="text"
                icon={<TranslationOutlined />}
                className={styles.langButton}
                onClick={() => {
                  dispatch(nextLanguage())
                  navigate(0)
                }}
              />
              {isLogged && (
                <Link to="/admin">
                  <Button type="text" icon={<PoweroffOutlined />} className={styles.adminButton} />
                </Link>
              )}
            </div>
          </AntLayout.Header>
          <AntLayout.Content className={styles.content}>{outlet}</AntLayout.Content>
          <AntLayout.Footer className={styles.footer}>
            Made with ❤ By{' '}
            <a href="https://github.com/biyuehu" target="_blank" rel="noreferrer">
              Arimura Sena
            </a>{' '}
            In © 2024
          </AntLayout.Footer>
        </AntLayout>
      </Flex>
    </>
  )
}

export default Layout
