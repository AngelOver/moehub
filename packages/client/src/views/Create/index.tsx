import { Card, Flex, notification } from 'antd'
import { createCharacter } from '@/http'
import CharacterForm, { handleMoehubDataCharacter } from '@/components/CharacterForm'
import type { MoehubDataCharacterHandle } from '@/components/CharacterForm'
import { useNavigate } from 'react-router-dom'
import { t } from '@/i18n'
import styles from './styles.module.css'

/**
 * 游客创建角色视图组件
 * 与管理员创建组件类似，但针对游客使用场景优化
 */
const GuestCreateView: React.FC = () => {
  const navigate = useNavigate()

  async function onSubmit(values: MoehubDataCharacterHandle) {
    console.log("游客表单提交的原始数据:", values);
    const { md, ...characterData } = values;
    const processedData = handleMoehubDataCharacter(characterData);
    console.log("处理后的数据:", processedData);
    try {
      await createCharacter(processedData, md as string);
      notification.success({ 
        message: '角色创建成功', 
        description: '您的角色已提交，等待管理员审核后将显示在首页。'
      });
      setTimeout(() => navigate('/'), 1500);
    } catch (error) {
      console.error("创建角色时出错:", error);
      notification.error({ message: `创建失败: ${error instanceof Error ? error.message : String(error)}` });
    }
  }

  return (
    <div className={styles["guest-create-container"]}>
      <p className={styles.description}>创建您喜欢的角色，提交后将由管理员审核</p>
      <Flex justify="center" align="center" vertical>
        <Card hoverable className={`${styles.card} ${styles.cardFixed}`}>
          <CharacterForm onSubmit={onSubmit} />
        </Card>
      </Flex>
    </div>
  )
}

export default GuestCreateView