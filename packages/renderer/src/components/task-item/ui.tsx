import { isNil, TaskStatus } from '@app/shared';
import { Flex, Label, Text } from '@gravity-ui/uikit';
import classNames from 'classnames';
import React from 'react';

import { getPriorityLabelProps, getStatusLabelProps } from '@/shared/lib';

import type { TaskItemProps } from './lib/types';
import styles from './styles.module.css';

export const TaskItem: React.FC<TaskItemProps> = ({ task, isSelected, isTaskDirty, isSubtask, onSelectTask }) => {
  const statusProps = getStatusLabelProps(task.status);
  const priorityProps = getPriorityLabelProps(task.priority);

  const isInProgress = task.status === TaskStatus.IN_PROGRESS;
  const isPending = task.status === TaskStatus.PENDING;
  const isNotSet = isNil(task.status);

  const shouldShowPriority = isPending || isInProgress || isNotSet;

  return (
    <div
      className={classNames(styles.taskItem, { [styles.selected]: isSelected, [styles.subtask]: isSubtask })}
      onClick={() => onSelectTask(String(task.id))}
    >
      <Flex direction="column" gap={1}>
        <Flex alignItems="center" gap={2} className={styles.taskItemTitleContainer}>
          <Text variant="caption-1" color="secondary">
            #{task.id}
          </Text>
          {isTaskDirty && <span className={styles.taskItemDirty}>●</span>}
          <Text variant="body-2" className={styles.taskItemTitle}>
            {task.title}
          </Text>
        </Flex>
      </Flex>
      <Flex alignItems="center" gap={2} className={styles.badgeRow}>
        <Label theme={statusProps.theme} size="xs">
          {statusProps.text}
        </Label>
        {shouldShowPriority && (
          <Label theme={priorityProps.theme} size="xs">
            {priorityProps.text}
          </Label>
        )}
      </Flex>
      <Text variant="caption-2" color="secondary" className={styles.taskItemDescription}>
        {task.description || task.details || 'Нет описания'}
      </Text>
    </div>
  );
};
