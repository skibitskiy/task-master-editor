import React, { useState, useRef, useEffect } from 'react';
import { Flex, Text, Button, TextInput, Icon } from '@gravity-ui/uikit';
import { FloppyDisk, Eye, Code, TrashBin, Gear } from '@gravity-ui/icons';
import { CircleFill } from '@gravity-ui/icons';
import styles from './styles.module.css';

interface EditorPanelHeaderProps {
  taskId: string;
  taskTitle: string;
  editorMode: 'editor' | 'preview';
  showModeToggle: boolean;
  onToggleMode: () => void;
  onSave: () => void;
  onDelete: () => void;
  onGptSettings: () => void;
  onTitleChange: (newTitle: string) => void;
  onTitleBlur: () => void;
  titleError?: string;
  isTaskDirty: boolean;
  hasErrors: boolean;
}

export const EditorPanelHeader: React.FC<EditorPanelHeaderProps> = ({
  taskId,
  taskTitle,
  editorMode,
  showModeToggle,
  onToggleMode,
  onSave,
  onDelete,
  onGptSettings,
  onTitleChange,
  onTitleBlur,
  titleError,
  isTaskDirty,
  hasErrors,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(taskTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(taskTitle);
  }, [taskTitle]);

  const handleTitleClick = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    onTitleChange(trimmedValue);
    setIsEditing(false);
  };

  const handleBlur = () => {
    handleSave();
    onTitleBlur();
  };

  const handleCancel = () => {
    setEditValue(taskTitle);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <Flex alignItems="center" justifyContent="space-between" wrap gapRow={4}>
      <div className={styles.titleContainer}>
        {isEditing ? (
          <TextInput
            controlRef={inputRef}
            size="m"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            validationState={titleError ? 'invalid' : undefined}
            errorMessage={titleError}
          />
        ) : (
          <Text variant="header-2" className={styles.title} onClick={handleTitleClick}>
            #{taskId} {taskTitle}{' '}
            {isTaskDirty && (
              <span className={styles.dirtyIndicator}>
                <Icon data={CircleFill} />
              </span>
            )}
          </Text>
        )}
      </div>
      <Flex gap={2}>
        <Button view="outlined" size="m" onClick={onGptSettings} title="Настройки ИИ">
          <Button.Icon>
            <Gear />
          </Button.Icon>
          ИИ
        </Button>
        {showModeToggle && (
          <Button view="outlined" size="m" onClick={onToggleMode}>
            <Button.Icon>{editorMode === 'editor' ? <Eye /> : <Code />}</Button.Icon>
            {editorMode === 'editor' ? 'Предпросмотр' : 'Редактор'}
          </Button>
        )}
        <Button view="outlined-action" size="m" onClick={onSave} disabled={hasErrors}>
          <Button.Icon>
            <FloppyDisk />
          </Button.Icon>
          Сохранить
          {isTaskDirty && <span style={{ marginLeft: 8, color: 'var(--g-color-text-warning)' }}>●</span>}
        </Button>
        <Button view="outlined-danger" size="m" onClick={onDelete}>
          <Button.Icon>
            <TrashBin />
          </Button.Icon>
          Удалить
        </Button>
      </Flex>
    </Flex>
  );
};
