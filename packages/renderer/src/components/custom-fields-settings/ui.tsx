import type { CustomField } from '@app/shared';
import { Button, Flex, Label, Text, TextInput } from '@gravity-ui/uikit';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

import { saveFile, updateCustomFields } from '../../redux/dataSlice';
import type { AppDispatch } from '../../redux/store';
import { useCustomFields } from '../../shared/hooks';
import { notifyError, notifySuccess } from '../../utils/notify';

export const CustomFieldsSettings: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const customFields = useCustomFields();

  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldKey, setNewFieldKey] = useState('');
  const [fieldKeyError, setFieldKeyError] = useState('');

  const handleAddField = async () => {
    if (!newFieldName.trim() || !newFieldKey.trim()) {
      notifyError('Ошибка', 'Заполните название и ключ поля');
      return;
    }

    // Additional validation for field key
    if (fieldKeyError) {
      notifyError('Ошибка', 'Исправьте ошибки в ключе поля');
      return;
    }

    // Check if key already exists
    if (customFields.some((field) => field.key === newFieldKey.trim())) {
      notifyError('Ошибка', 'Поле с таким ключом уже существует');
      return;
    }

    const newField: CustomField = {
      name: newFieldName.trim(),
      key: newFieldKey.trim(),
      type: 'text',
    };

    try {
      const updatedFields = [...customFields, newField];
      dispatch(updateCustomFields(updatedFields));

      // Save file immediately to persist changes
      await dispatch(saveFile()).unwrap();

      setNewFieldName('');
      setNewFieldKey('');
      notifySuccess('Успешно', 'Кастомное поле добавлено и сохранено');
    } catch (error) {
      notifyError('Ошибка', 'Не удалось добавить или сохранить поле');
    }
  };

  const handleRemoveField = async (fieldKey: string) => {
    try {
      const updatedFields = customFields.filter((field) => field.key !== fieldKey);
      dispatch(updateCustomFields(updatedFields));

      // Save file immediately to persist changes
      await dispatch(saveFile()).unwrap();

      notifySuccess('Успешно', 'Кастомное поле удалено и изменения сохранены');
    } catch (error) {
      notifyError('Ошибка', 'Не удалось удалить или сохранить изменения');
    }
  };

  const handleNameChange = (name: string) => {
    setNewFieldName(name);
  };

  const handleKeyChange = (value: string) => {
    // Фильтруем только английские буквы и цифры
    const filteredValue = value.replace(/[^a-zA-Z0-9]/g, '');
    setNewFieldKey(value);

    // Проверяем валидность
    if (value !== filteredValue) {
      setFieldKeyError('Поле может содержать только английские буквы и цифры');
    } else {
      setFieldKeyError('');
    }
  };

  return (
    <Flex direction="column" gap={4}>
      <Flex direction="column" gap={0}>
        <Text variant="subheader-3">Кастомные поля задач</Text>
        <Text variant="caption-2" color="secondary">
          Эти поля будут доступны как отдельные вкладки при редактировании задач.
        </Text>
      </Flex>
      <Flex direction="column" gap={6}>
        <Flex direction={'column'} gap={2}>
          <Flex direction="column" gap={2}>
            <Text variant="caption-2">Название поля</Text>
            <TextInput
              placeholder="Введите"
              value={newFieldName}
              onChange={(e) => handleNameChange(e.target.value)}
              style={{ flex: 1 }}
            />
          </Flex>
          <Flex direction="column" gap={2}>
            <Text variant="caption-2">Ключ поля</Text>
            <TextInput
              placeholder="Введите"
              value={newFieldKey}
              onChange={(e) => handleKeyChange(e.target.value)}
              style={{ flex: 1 }}
              validationState={fieldKeyError ? 'invalid' : undefined}
            />
            {fieldKeyError && (
              <Text variant="caption-2" color="danger">
                {fieldKeyError}
              </Text>
            )}
          </Flex>
        </Flex>
        <Button
          onClick={handleAddField}
          disabled={!newFieldName.trim() || !newFieldKey.trim() || !!fieldKeyError}
          view="action"
          size="l"
        >
          Добавить
        </Button>
      </Flex>

      {customFields.length > 0 && (
        <Flex wrap gap={2}>
          {customFields.map((field) => (
            <Label key={field.key} size="s" type="close" onCloseClick={() => handleRemoveField(field.key)}>
              {field.name}
            </Label>
          ))}
        </Flex>
      )}
    </Flex>
  );
};
