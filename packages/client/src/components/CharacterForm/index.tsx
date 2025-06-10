import { Button, ColorPicker, DatePicker, Form, Input, InputNumber, Radio, Select, Space, Switch, Tabs, Upload, message, notification } from 'antd'
import type { MoehubDataCharacter, MoehubDataCharacterSubmit } from '@moehub/common'
import dayjs from 'dayjs'
import { getTags } from '@/http'
import useSWR from 'swr'
import { useEffect, useState } from 'react'
import ListForm from '../ListForm'
import { t } from '@/i18n'
import { InboxOutlined, PlusOutlined } from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd'
import { useSelector } from 'react-redux'
import { getToken } from '@/store/adminReducer'
import { handleUrl } from '@/utils'

export type MoehubDataCharacterHandle = Omit<MoehubDataCharacterSubmit, 'birthday' | 'color'> & {
  birthday?: dayjs.Dayjs
  color?: { toHex(): string; cleared: false | string }
  md?: string  // 角色设定字段
  uploadedImages?: UploadFile[] // 上传的图片文件
}

export function handleMoehubDataCharacter(values: MoehubDataCharacterHandle): MoehubDataCharacterSubmit {
  // 从values中过滤掉uploadedImages字段
  const { uploadedImages, ...otherValues } = values;
  
  // 打印原始值用于调试
  console.log("处理前的数据:", JSON.stringify(values));
  
  // 确保所有字符串类型的字段都有有效值
  const ensureStringFields = {
    name: values.name || '',
    romaji: values.romaji || '', // 确保romaji是字符串
    series: values.series || '',
    voice: values.voice || '',
    hitokoto: values.hitokoto || '',
    hairColor: values.hairColor || '',
    eyeColor: values.eyeColor || '',
    description: values.description || '',
    comment: values.comment || ''
  };
  
  // 根据schema，gender和seriesGenre是必填字段，必须确保有有效值
  const processedData = {
    ...otherValues,
    ...ensureStringFields,
    // 必填枚举字段必须有值
    gender: values.gender || 'OTHER', // 默认值为OTHER
    seriesGenre: values.seriesGenre || 'OTHER', // 默认值为OTHER
    // bloodType是可选字段
    bloodType: values.bloodType, // 可以是undefined
    color: values.color
      ? typeof values.color === 'string'
        ? values.color
        : values.color.cleared === false
          ? values.color.toHex()
          : ''
      : undefined,
    birthday: values.birthday ? new Date(values.birthday.toString()).getTime() : undefined
  };
  
  // 打印处理后的数据用于调试
  console.log("处理后的数据:", JSON.stringify(processedData));
  
  return processedData;
}

interface CharacterFormProps {
  onSubmit: (values: MoehubDataCharacterHandle) => void
  data?: MoehubDataCharacter
}

const items = (isDisabled: boolean, tags?: { label: string; value: string }[], imageUploadProps?: UploadProps) => [
  {
    key: '1',
    label: t`com.characterForm.label.1`,
    children: (
      <>
        <Form.Item name="name" label={t`com.characterForm.name`} rules={[{ required: true }]}>
          <Input disabled={isDisabled} placeholder="请输入角色名称" />
        </Form.Item>
        
        <Form.Item
          name="uploadedImages"
          label={t`com.characterForm.images`}
          rules={[{ required: true, message: '请上传至少一张角色图片' }]}
        >
          <Upload
            listType="picture-card"
            fileList={imageUploadProps?.fileList}
            onChange={imageUploadProps?.onChange}
            beforeUpload={imageUploadProps?.beforeUpload}
            action={imageUploadProps?.action}
            headers={imageUploadProps?.headers}
            multiple={true}
          >
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>上传图片</div>
            </div>
          </Upload>
        </Form.Item>
        
        <Form.Item name="md" label="角色设定" rules={[{ required: true, message: '请输入角色设定内容' }]}>
          <Input.TextArea rows={6} placeholder="请输入角色设定内容，该内容会被保存为Markdown格式" />
        </Form.Item>
        
        <Form.Item name="romaji" label={t`com.characterForm.romaji`}>
          <Input placeholder="请输入罗马音（选填）" />
        </Form.Item>
      </>
    )
  },
  {
    key: '2',
    label: t`com.characterForm.label.2`,
    children: (
      <>
        <Form.Item name="gender" label={t`com.characterForm.gender`} initialValue="OTHER">
          <Radio.Group>
            <Radio.Button value="MALE">{t`com.characterForm.gender.male`}</Radio.Button>
            <Radio.Button value="FEMALE">{t`com.characterForm.gender.female`}</Radio.Button>
            <Radio.Button value="OTHER">{t`com.characterForm.gender.other`}</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Form.Item name="series" label={t`com.characterForm.series`}>
          <Input />
        </Form.Item>
        <Form.Item name="seriesGenre" label={t`com.characterForm.seriesGenre`} initialValue="OTHER">
          <Radio.Group>
            <Radio value="ANIME">{t`com.characterForm.seriesGenre.anime`}</Radio>
            <Radio value="COMIC">{t`com.characterForm.seriesGenre.comic`}</Radio>
            <Radio value="GALGAME">{t`com.characterForm.seriesGenre.galgame`}</Radio>
            <Radio value="GAME">{t`com.characterForm.seriesGenre.game`}</Radio>
            <Radio value="NOVEL">{t`com.characterForm.seriesGenre.novel`}</Radio>
            <Radio value="OTHER">{t`com.characterForm.seriesGenre.other`}</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item name="alias" label={t`com.characterForm.alias`}>
          <Select mode="tags" />
        </Form.Item>
        <Form.Item name="description" label={t`com.characterForm.description`}>
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="hitokoto" label={t`com.characterForm.hitokoto`}>
          <Input />
        </Form.Item>
        <Form.Item name="birthday" label={t`com.characterForm.birthday`}>
          <DatePicker format="MM-DD" />
        </Form.Item>
        <Form.Item name="comment" label={t`com.characterForm.comment`}>
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="tags" label={t`com.characterForm.tags`}>
          <Select mode="tags" options={tags ?? []} />
        </Form.Item>
        <Form.Item name="color" label={t`com.characterForm.color`}>
          <ColorPicker showText allowClear />
        </Form.Item>
        <Form.Item name="songId" label={t`com.characterForm.songId`}>
          <InputNumber placeholder={t`com.characterForm.songId.placeholder`} min="1" />
        </Form.Item>
      </>
    )
  },
  {
    key: '3',
    label: t`com.characterForm.label.3`,
    children: (
      <>
        <Form.Item name="voice" label={t`com.characterForm.voice`}>
          <Input />
        </Form.Item>
        <Form.Item name="age" label={t`com.characterForm.age`} rules={[{ type: 'number' }]}>
          <InputNumber min={1} />
        </Form.Item>
        <Form.Item name="height" label={t`com.characterForm.height`} rules={[{ type: 'number' }]}>
          <InputNumber min={1} />
        </Form.Item>
        <Form.Item name="weight" label={t`com.characterForm.weight`} rules={[{ type: 'number' }]}>
          <InputNumber min={1} />
        </Form.Item>
        <Form.Item name="bust" label={t`com.characterForm.bust`} rules={[{ type: 'number' }]}>
          <InputNumber min={1} />
        </Form.Item>
        <Form.Item name="waist" label={t`com.characterForm.waist`} rules={[{ type: 'number' }]}>
          <InputNumber min={1} />
        </Form.Item>
        <Form.Item name="hip" label={t`com.characterForm.hip`} rules={[{ type: 'number' }]}>
          <InputNumber min={1} />
        </Form.Item>
        <Form.Item name="hairColor" label={t`com.characterForm.hairColor`}>
          <Input />
        </Form.Item>
        <Form.Item name="eyeColor" label={t`com.characterForm.eyeColor`}>
          <Input />
        </Form.Item>
        <Form.Item name="bloodType" label={t`com.characterForm.bloodType`}>
          <Radio.Group>
            <Radio value="A">{t`com.characterForm.bloodType.A`}</Radio>
            <Radio value="B">{t`com.characterForm.bloodType.B`}</Radio>
            <Radio value="AB">{t`com.characterForm.bloodType.AB`}</Radio>
            <Radio value="O">{t`com.characterForm.bloodType.O`}</Radio>
            <Radio value={undefined}>不选择</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item name="url" label={t`com.characterForm.url`}>
          <Select mode="tags" />
        </Form.Item>
        <Form.Item name="order" label={t`com.characterForm.order`} rules={[{ type: 'number' }]}>
          <InputNumber min={1} />
        </Form.Item>
        <Form.Item name="hide" label={t`com.characterForm.hide`}>
          <Switch
            checkedChildren={t`com.characterForm.hide.checked`}
            unCheckedChildren={t`com.characterForm.hide.unchecked`}
          />
        </Form.Item>
      </>
    )
  }
]

const CharacterForm: React.FC<CharacterFormProps> = ({ onSubmit, data }) => {
  const [form] = Form.useForm<MoehubDataCharacterHandle>()
  const token = useSelector(getToken)
  const [fileList, setFileList] = useState<UploadFile[]>([])

  useEffect(() => {
    if (data) {
      form.setFieldsValue(
        (data.birthday ? { ...data, birthday: dayjs(data.birthday) } : data) as unknown as MoehubDataCharacterHandle
      )
      
      // 如果有images数据，转换为UploadFile格式
      if (data.images && data.images.length > 0) {
        const initialFileList = data.images.map((url, index) => {
          const fileName = url.split('/').pop() || `image-${index}.jpg`;
          return {
            uid: `-${index}`,
            name: fileName,
            status: 'done',
            url: url,
            thumbUrl: url,
          } as UploadFile;
        });
        setFileList(initialFileList);
      }
    }
  }, [form, data])

  const { data: tags } = useSWR('/api/tags', async () => {
    return (await getTags()).data.map((tag) => ({ label: tag.name, value: tag.name }))
  })

  // 图片上传配置
  const imageUploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    action: `${handleUrl()}/settings/imgs`,
    headers: {
      Authorization: `Bearer ${token}`
    },
    fileList,
    beforeUpload: (file) => {
      const isPNG = file.type.startsWith('image/')
      if (!isPNG) notification.error({ message: `${file.name} 不是图片文件!` })
      return isPNG || Upload.LIST_IGNORE
    },
    onChange(info) {
      let newFileList = [...info.fileList];
      
      // 处理上传完成的文件，转换url
      newFileList = newFileList.map(file => {
        if (file.response) {
          const newName = file.response?.data?.[0]?.filename;
          // 使用相对路径，确保能够正确加载图片
          const url = newName ? `/imgs/${newName}` : undefined;
          console.log("原始文件名:", file.name);
          console.log("服务器返回的文件名:", newName);
          console.log("处理后的图片URL:", url);
          console.log("完整响应数据:", JSON.stringify(file.response));
          return { ...file, name: newName ?? file.name, url };
        }
        return file;
      });
      
      setFileList(newFileList);
      
      // 将文件列表同步到表单值
      form.setFieldsValue({ uploadedImages: newFileList });
      
      // 处理上传状态通知
      const { status } = info.file;
      if (status === 'done') {
        notification.success({ message: `${info.file.name} 上传成功!` });
      } else if (status === 'error') {
        notification.error({ message: `${info.file.name} 上传失败!` });
      }
    }
  };
  
  // 重写提交处理
  const handleSubmit = (values: MoehubDataCharacterHandle) => {
    // 记录提交表单的原始数据
    console.log("表单提交原始数据:", JSON.stringify(values));
    
    // 处理上传的图片，提取URL
    const images = values.uploadedImages?.map(file => file.url || '') || [];
    
    // 过滤掉空URL
    const filteredImages = images.filter(url => url);
    console.log("处理后的图片URLs:", filteredImages);
    
    // 确保hide字段为true，这样角色默认隐藏，需要管理员手动显示
    const hide = true;
    
    // 确保所有字符串字段都有合法值
    const romaji = values.romaji || '';
    const name = values.name || '';
    const series = values.series || '';
    const description = values.description || '';
    const comment = values.comment || '';
    const hitokoto = values.hitokoto || '';
    const voice = values.voice || '';
    const hairColor = values.hairColor || '';
    const eyeColor = values.eyeColor || '';
    
    // 创建新的表单数据，包含处理后的图片URL和确保的字符串字段
    const newValues = {
      ...values,
      name,
      romaji,
      series,
      description,
      comment,
      hitokoto,
      voice,
      hairColor,
      eyeColor,
      images: filteredImages,
      hide, // 确保hide为false
      uploadedImages: undefined // 删除uploadedImages字段，因为后端不需要它
    };
    
    // 记录处理后的数据
    console.log("处理后要提交的数据:", JSON.stringify(newValues));
    
    // 调用原始的onSubmit函数
    onSubmit(newValues);
  };

  return (
    <Form form={form} name="control-hooks" className="cardForm cleanAll" onFinish={handleSubmit}>
      <Tabs defaultActiveKey="1" items={items(!!data, tags, imageUploadProps)} />
      <br />
      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" className="cardButton">
            {t`com.characterForm.submit`}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  )
}

export default CharacterForm
