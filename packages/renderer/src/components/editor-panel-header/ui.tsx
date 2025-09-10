import React from 'react';
import { Flex, Text, Button } from '@gravity-ui/uikit';
import { FloppyDisk, Eye, Code } from '@gravity-ui/icons';

interface EditorPanelHeaderProps {
  taskId: string;
  taskTitle: string;
  editorMode: 'editor' | 'preview';
  showModeToggle: boolean;
  onToggleMode: () => void;
  onSave: () => void;
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
  isTaskDirty,
  hasErrors,
}) => {
  return (
    <Flex alignItems="center" justifyContent="space-between">
      <Text variant="header-2">
        #{taskId} {taskTitle}
      </Text>
      <Flex gap={2}>
        {showModeToggle && (
          <Button view="outlined" size="m" onClick={onToggleMode}>
            <Button.Icon>{editorMode === 'editor' ? <Eye /> : <Code />}</Button.Icon>
            {editorMode === 'editor' ? 'Предпросмотр' : 'Редактор'}
          </Button>
        )}
        <Button view="action" size="m" onClick={onSave} disabled={hasErrors}>
          <Button.Icon>
            <FloppyDisk />
          </Button.Icon>
          Сохранить
          {isTaskDirty && <span style={{ marginLeft: 8, color: 'var(--g-color-text-warning)' }}>●</span>}
        </Button>
      </Flex>
    </Flex>
  );
};
