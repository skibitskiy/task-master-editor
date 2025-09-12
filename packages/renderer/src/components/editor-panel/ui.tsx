import { Code } from '@gravity-ui/icons';
import { Flex, Text } from '@gravity-ui/uikit';
import React from 'react';

import { useCurrentTask } from '../../redux/task';
import { Editor } from '../editor';

const EditorPanel: React.FC = () => {
  const { task } = useCurrentTask();

  if (!task) {
    return (
      <div className="editor-panel">
        <div className="editor-placeholder">
          <Flex direction="column" alignItems="center" gap={3}>
            <div style={{ color: 'var(--g-color-text-secondary)' }}>
              <Code width={48} height={48} />
            </div>
            <Text variant="header-2" color="secondary">
              Выберите задачу для редактирования
            </Text>
            <Text color="secondary">Выберите задачу из списка слева, чтобы начать редактирование</Text>
          </Flex>
        </div>
      </div>
    );
  }

  return <Editor key={task.id} task={task} />;
};

const MemoizedEditorPanel = React.memo(EditorPanel);

export { MemoizedEditorPanel as EditorPanel };
