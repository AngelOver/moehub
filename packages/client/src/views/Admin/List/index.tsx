import type { MoehubDataCharacter } from '@moehub/common'
import { Card, Flex, Popconfirm, Space, Table, notification, Switch, Button } from 'antd'
import Column from 'antd/es/table/Column'
import ColumnGroup from 'antd/es/table/ColumnGroup'
import { Link } from 'react-router-dom'
import { deleteCharacter, getCharacters } from '@/http'
import http from '@/http/http'
import Loading from '@/components/Loading'
import ErrorResult from '@/components/result/error'
import styles from './styles.module.css'
import useSWR from 'swr'
import { t } from '@/i18n'

const ListView: React.FC = () => {
  const { data, isLoading, mutate } = useSWR('/api/character', getCharacters)

  // 切换角色显示/隐藏状态
  const handleToggleVisibility = async (characterId: number, currentHideState: boolean | null | undefined) => {
    try {
      // 直接更新hide字段，而不是整个角色对象
      const isHidden = !!currentHideState; // 确保是布尔值
      
      // 使用HTTP请求直接更新hide字段
      await http.put(`/character/${characterId}/hide`, { hide: !isHidden });

      // 显示成功通知
      notification.success({
        message: currentHideState
          ? '角色已设为显示状态'
          : '角色已设为隐藏状态'
      });
      
      // 刷新数据
      mutate();
    } catch (error) {
      console.error('切换角色显示状态失败:', error);
      notification.error({ message: '操作失败，请重试' });
    }
  };

  return (
    <div>
      <h1>{t`view.characterList.title`}</h1>
      <Flex justify="center" align="center" vertical wrap>
        <Card hoverable className="card cardFixed">
          {data ? (
            <Table
              dataSource={data.map((data) => ({ ...data, key: data.id })).sort((el1, el2) => (el1.order || 50) - (el2.order || 50))}
              className={`${styles.table} cleanAll`}
            >
              <ColumnGroup title={t`view.characterList.column.characterName`}>
                <Column title={t`view.characterList.column.originalName`} dataIndex="name" key="name" />
                <Column title={t`view.characterList.column.romaji`} dataIndex="romaji" key="romaji" />
              </ColumnGroup>

              <ColumnGroup title={t`view.characterList.column.source`} responsive={['md']}>
                <Column title={t`view.characterList.column.series`} dataIndex="series" key="series" />
                <Column title={t`view.characterList.column.type`} dataIndex="seriesGenre" key="seriesGenre" />
              </ColumnGroup>
              <Column
                title={t`view.characterList.column.createdAt`}
                responsive={['md']}
                dataIndex="createdAt"
                key="createdAt"
              />
              <Column
                title="状态"
                key="status"
                render={(_, data: MoehubDataCharacter) => (
                  <div className={styles.switchContainer}>
                    <Switch
                      checkedChildren="显示"
                      unCheckedChildren="隐藏"
                      checked={!data.hide}
                      onChange={() => handleToggleVisibility(data.id, !!data.hide)}
                      className={`${styles.visibilitySwitch} ${!data.hide ? styles.switchOn : styles.switchOff}`}
                    />
                  </div>
                )}
              />
              <Column
                title={t`view.characterList.column.actions`}
                key="actions"
                render={(_, data: MoehubDataCharacter) => (
                  <Space size="middle">
                    <Link to={`/admin/edit/${data.id}`}>{t`view.characterList.action.edit`}</Link>
                    <Popconfirm
                      title={t`view.characterList.delete.title`}
                      description={t`view.characterList.delete.description`}
                      onConfirm={() =>
                        deleteCharacter(data.id).then(() =>
                          notification.success({ message: t`view.characterList.delete.success` })
                        )
                      }
                      okText={t`view.characterList.delete.confirm`}
                      cancelText={t`view.characterList.delete.cancel`}
                    >
                      <span>{t`view.characterList.action.delete`}</span>
                    </Popconfirm>
                  </Space>
                )}
              />
            </Table>
          ) : isLoading ? (
            <Loading />
          ) : (
            <ErrorResult />
          )}
        </Card>
      </Flex>
    </div>
  )
}

export default ListView
