import { Flex, Layout as AntLayout, Avatar } from 'antd'
import { PictureOutlined, PoweroffOutlined, TranslationOutlined, PlusOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import styles from './styles.module.css'
import { useEffect, useRef } from 'react'
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
              <h1>
                <Link className={styles.headerTitle} to="/">
                  <Avatar onClick={() => {}} style={{ marginRight: 10 }} src={settings.site_logo} />
                  {settings.site_name}
                </Link>
              </h1>
              <Link
                to="/create"
                className={styles.createButton}
                style={{
                  display: 'inline-block',
                  background: 'linear-gradient(45deg, #ff0000, #ffcc00)',
                  color: 'white',
                  padding: '6px 18px',
                  borderRadius: '18px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 8px rgba(255, 0, 0, 0.5), 0 0 12px rgba(255, 204, 0, 0.4)',
                  textDecoration: 'none',
                  lineHeight: 'normal',
                  letterSpacing: '1px',
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.6)',
                  animation: 'pulseButton 2s infinite alternate',
                  margin: '0 10px'
                }}
              >
                创建角色
              </Link>
            </div>
            <div>
              <a
                //  biome-ignore lint:
                onClick={() => {
                  dispatch(nextLanguage())
                  navigate(0)
                }}
              >
                <Avatar style={{ background: 'none', color: '#eee' }} icon={<TranslationOutlined />} />
              </a>
              <Link to="/photos">
                <Avatar style={{ background: 'none', color: '#eee' }} icon={<PictureOutlined />} />
              </Link>
              <Link to="/admin">
                <Avatar style={{ background: 'none', color: '#eee' }} icon={<PoweroffOutlined />} />
              </Link>
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
