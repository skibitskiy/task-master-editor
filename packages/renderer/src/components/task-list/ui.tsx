import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Flex, Text, Button, Label, List } from '@gravity-ui/uikit';
import { Plus } from '@gravity-ui/icons';
import type { RootState } from '../../redux/store';
import type { TaskStatus, Task } from '@app/shared';
import type { TaskListProps } from './lib/types';
import styles from './styles.module.css';

// Helper function to map task status to Label theme
const getStatusLabelProps = (
  status?: TaskStatus,
): { theme: 'normal' | 'info' | 'success' | 'warning' | 'danger' | 'utility'; text: string } => {
  switch (status) {
    case 'done':
      return { theme: 'success', text: 'Готово' };
    case 'in-progress':
      return { theme: 'info', text: 'В работе' };
    case 'blocked':
      return { theme: 'danger', text: 'Заблокировано' };
    case 'deferred':
      return { theme: 'warning', text: 'Отложено' };
    case 'cancelled':
      return { theme: 'utility', text: 'Отменено' };
    case 'pending':
    default:
      return { theme: 'normal', text: 'Ожидает' };
  }
};

export const TaskList: React.FC<TaskListProps> = ({ selectedTaskId, onSelectTask }) => {
  const tasksFile = useSelector((state: RootState) => state.data.tasksFile);
  const dirtyState = useSelector((state: RootState) => state.data.dirty);

  const tasks = useMemo(() => tasksFile?.master.tasks || [], [tasksFile]);

  // Stable sorting by ID (convert to number for proper numeric sorting)
  const sortedTasks = React.useMemo(() => {
    return [...tasks].sort((a, b) => {
      const aId = typeof a.id === 'number' ? a.id : parseInt(String(a.id), 10) || 0;
      const bId = typeof b.id === 'number' ? b.id : parseInt(String(b.id), 10) || 0;
      return aId - bId;
    });
  }, [tasks]);

  // Memoized render function for List component
  const renderTaskItem = React.useCallback(
    (task: Task, isActive: boolean, _index: number) => {
      const statusProps = getStatusLabelProps(task.status);
      const isSelected = selectedTaskId === String(task.id);
      const isTaskDirty = dirtyState.byTaskId[String(task.id)] || false;

      return (
        <div
          className={`${styles.taskItem} ${isSelected ? styles.selected : ''} ${isActive ? 'active' : ''}`}
          onClick={() => onSelectTask(String(task.id))}
        >
          <Flex alignItems="center" justifyContent="space-between" className={styles.taskItemHeader}>
            <Flex alignItems="center" gap={2}>
              <Text variant="caption-1" color="secondary">
                #{task.id}
              </Text>
              {isTaskDirty && <span style={{ color: 'var(--g-color-text-warning)', fontSize: 16 }}>●</span>}
              <Text variant="body-2" className={styles.taskItemTitle}>
                {task.title}
              </Text>
            </Flex>
            <Label theme={statusProps.theme} size="s">
              {statusProps.text}
            </Label>
          </Flex>
          {task.description && (
            <Text variant="caption-2" color="secondary" className={styles.taskItemDescription}>
              {task.description}
            </Text>
          )}
        </div>
      );
    },
    [selectedTaskId, onSelectTask, dirtyState.byTaskId],
  );

  // Calculate item height dynamically based on content
  const getItemHeight = React.useCallback((task: Task) => {
    // Base height for task item
    const baseHeight = 56;
    // Additional height for description if present
    const descriptionHeight = task.description ? 24 : 0;
    return baseHeight + descriptionHeight;
  }, []);

  // Custom filter function for List component
  const filterTask = React.useCallback((query: string) => {
    return (task: Task): boolean => {
      if (!query.trim()) return true;
      const lowerQuery = query.toLowerCase();
      return (
        task.title.toLowerCase().includes(lowerQuery) || Boolean(task.description?.toLowerCase().includes(lowerQuery))
      );
    };
  }, []);

  return (
    <Flex direction="column" className={styles.taskList} grow>
      <div className={styles.taskListHeader}>
        <Flex direction="column" gap={3}>
          <Flex alignItems="center" justifyContent="space-between">
            <Text variant="header-1">Задачи</Text>
            <Button view="action" size="s" title="Добавить задачу">
              <Button.Icon>
                <Plus />
              </Button.Icon>
            </Button>
          </Flex>
        </Flex>
      </div>

      <Flex direction="column" grow style={{ minHeight: 0 }}>
        {sortedTasks.length === 0 ? (
          <div className="editor-placeholder">
            <Text color="secondary">Задач нет</Text>
          </div>
        ) : (
          <List
            items={sortedTasks}
            renderItem={renderTaskItem}
            itemHeight={getItemHeight}
            itemsHeight={(items) => Math.min(items.length * 80, 600)}
            filterable={true}
            filterPlaceholder="Поиск задач..."
            filterItem={filterTask}
            emptyPlaceholder={
              <div className="editor-placeholder">
                <Text color="secondary">Задачи не найдены</Text>
              </div>
            }
            virtualized={true}
            onItemClick={(task, _index) => onSelectTask(String(task.id))}
          />
        )}
      </Flex>
    </Flex>
  );
};
