import React, { useState } from 'react';
import { Card, Select, Input, DatePicker, Slider } from 'antd';
import { t } from '@/i18n';

const { Option } = Select;

interface FilterBoxProps {
  onFilterChange: (filters: any) => void;
}

const FilterBox: React.FC<FilterBoxProps> = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    gender: undefined,
    age: undefined,
    seriesGenre: undefined,
    hairColor: '',
    eyeColor: '',
    bloodType: undefined,
    height: undefined,
    birthday: undefined,
  });

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <Card title={t`components.filterBox.title`} style={{ width: 300, marginRight: 16 }}>
      <Select
        style={{ width: '100%', marginBottom: 8 }}
        placeholder={t`components.filterBox.gender`}
        onChange={(value) => handleFilterChange('gender', value)}
      >
        <Option value="MALE">{t`components.filterBox.male`}</Option>
        <Option value="FEMALE">{t`components.filterBox.female`}</Option>
        <Option value="OTHER">{t`components.filterBox.other`}</Option>
      </Select>

      <Select
        style={{ width: '100%', marginBottom: 8 }}
        placeholder={t`components.filterBox.seriesGenre`}
        onChange={(value) => handleFilterChange('seriesGenre', value)}
      >
        <Option value="ANIME">{t`components.filterBox.anime`}</Option>
        <Option value="COMIC">{t`components.filterBox.comic`}</Option>
        <Option value="GALGAME">{t`components.filterBox.galgame`}</Option>
        <Option value="GAME">{t`components.filterBox.game`}</Option>
        <Option value="NOVEL">{t`components.filterBox.novel`}</Option>
        <Option value="OTHER">{t`components.filterBox.other`}</Option>
      </Select>

      <Input
        placeholder={t`components.filterBox.hairColor`}
        onChange={(e) => handleFilterChange('hairColor', e.target.value)}
        style={{ marginBottom: 8 }}
      />

      <Input
        placeholder={t`components.filterBox.eyeColor`}
        onChange={(e) => handleFilterChange('eyeColor', e.target.value)}
        style={{ marginBottom: 8 }}
      />

      <Select
        style={{ width: '100%', marginBottom: 8 }}
        placeholder={t`components.filterBox.bloodType`}
        onChange={(value) => handleFilterChange('bloodType', value)}
      >
        <Option value="A">A</Option>
        <Option value="B">B</Option>
        <Option value="AB">AB</Option>
        <Option value="O">O</Option>
      </Select>

      <div style={{ marginBottom: 8 }}>
        <span>{t`components.filterBox.height`}: </span>
        <Slider
          range
          min={100}
          max={200}
          onChange={(value) => handleFilterChange('height', value)}
        />
      </div>

      <DatePicker
        style={{ width: '100%', marginBottom: 8 }}
        placeholder={t`components.filterBox.birthday`}
        onChange={(date) => handleFilterChange('birthday', date)}
      />
    </Card>
  );
};

export default FilterBox;