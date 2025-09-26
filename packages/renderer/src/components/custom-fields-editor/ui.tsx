import { Task } from '@app/shared';
import { Text, TextArea } from '@gravity-ui/uikit';
import React from 'react';

import { useCustomFields } from '../../shared/hooks';
import styles from './styles.module.css';

interface CustomFieldsEditorProps {
  task: Task;
  onFieldChange: (key: string, value: string) => void;
}

export const CustomFieldsEditor: React.FC<CustomFieldsEditorProps> = ({ task, onFieldChange }) => {
  const customFields = useCustomFields();

  if (customFields.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Text color="secondary">Кастомные поля не настроены. Добавьте их в настройках проекта.</Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {customFields.map((field) => {
        const currentValue = (task[field.key] as string) || '';
        return (
          <div key={field.key} className={styles.fieldContainer}>
            <Text variant="subheader-1" className={styles.fieldLabel}>
              {field.name}
            </Text>
            <TextArea
              value={currentValue}
              onUpdate={(value) => onFieldChange(field.key, value)}
              placeholder={`Введите ${field.name.toLowerCase()}`}
              rows={4}
            />
          </div>
        );
      })}
    </div>
  );
};
