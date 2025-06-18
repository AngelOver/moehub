import { Card, Flex, notification } from 'antd'
import { useParams } from 'react-router-dom'
import { getCharacter, updateCharacter, getCharacterMd } from '@/http'
import Loading from '@/components/Loading'
import useSWR from 'swr'
import CharacterForm from '@/components/CharacterForm'
import { handleMoehubDataCharacter, type MoehubDataCharacterHandle } from '@/components/CharacterForm'
import ErrorResult from '@/components/result/error'
import { t } from '@/i18n'

const EditView: React.FC = () => {
  const { id: characterId } = useParams()

  const { data: characterData, error: characterError } = useSWR(`/api/character/${characterId}`, () => getCharacter(Number(characterId)))
  const { data: mdData, error: mdError } = useSWR(`/api/character/${characterId}/md`, () => getCharacterMd(Number(characterId)))

  async function onSubmit(values: MoehubDataCharacterHandle) {
    console.log("编辑表单提交的原始数据:", values);
    const { md, ...characterData } = values;
    const processedData = handleMoehubDataCharacter(characterData);
    console.log("编辑处理后的数据:", processedData);
    try {
      await updateCharacter(Number(characterId), processedData, md as string);
      notification.success({ message: t`view.characterEdit.success` });
    } catch (error) {
      console.error("更新角色时出错:", error);
      notification.error({ message: `更新失败: ${error instanceof Error ? error.message : String(error)}` });
    }
  }

  // 合并角色数据和MD数据
  const data = characterData && mdData !== undefined ? { ...characterData, md: mdData } : null
  const error = characterError || mdError

  return (
    <div>
      <h1>{t`view.characterEdit.title`}</h1>
      <Flex justify="center" align="center" vertical>
        <Card hoverable className="card cardFixed cleanAll">
          {data ? <CharacterForm onSubmit={onSubmit} data={data} /> : error ? <ErrorResult /> : <Loading />}
        </Card>
      </Flex>
    </div>
  )
}

export default EditView
