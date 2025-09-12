import { Flex, Label, Text } from '@gravity-ui/uikit';
import React from 'react';

import { getStatusLabelProps } from './lib/get-status-label-props';
import type { TaskItemProps } from './lib/types';
import styles from './styles.module.css';

export const TaskItem: React.FC<TaskItemProps> = ({ task, isActive, isSelected, isTaskDirty, onSelectTask }) => {
  const statusProps = getStatusLabelProps(task.status);

  return (
    <div
      className={`${styles.taskItem} ${isSelected ? styles.selected : ''} ${isActive ? 'active' : ''}`}
      onClick={() => onSelectTask(String(task.id))}
    >
      <Flex alignItems="center" justifyContent="space-between" className={styles.taskItemHeader} gap={2}>
        <Flex alignItems="center" gap={2} className={styles.taskItemTitleContainer}>
          <Text variant="caption-1" color="secondary">
            #{task.id}
          </Text>
          {isTaskDirty && <span className={styles.taskItemDirty}>●</span>}
          <Text variant="body-2" className={styles.taskItemTitle}>
            {task.title}
          </Text>
        </Flex>
        <Label theme={statusProps.theme} size="xs">
          {statusProps.text}
        </Label>
      </Flex>
      <Text variant="caption-2" color="secondary" className={styles.taskItemDescription}>
        {task.description || 'Нет описания'}
      </Text>
    </div>
  );
};
