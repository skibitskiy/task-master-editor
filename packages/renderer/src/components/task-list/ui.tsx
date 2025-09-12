import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Flex, Text, List } from '@gravity-ui/uikit';
import type { RootState } from '../../redux/store';
import type { Task } from '@app/shared';
import type { TaskListProps } from './lib/types';
import { TaskListHeader } from '../task-list-header';
import { TaskItem } from './task-item';
import styles from './styles.module.css';

export const TaskList: React.FC<TaskListProps> = ({ selectedTaskId, onSelectTask }) => {
  const tasksFile = useSelector((state: RootState) => state.data.tasksFile);
  const currentBranch = useSelector((state: RootState) => state.data.currentBranch);
  const dirtyState = useSelector((state: RootState) => state.data.dirty);

  const tasks = useMemo(() => {
    if (!tasksFile || !currentBranch) {
      return [];
    }
    return tasksFile[currentBranch]?.tasks || [];
  }, [tasksFile, currentBranch]);

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
      const isSelected = selectedTaskId === String(task.id);
      const isTaskDirty = dirtyState.byTaskId[String(task.id)] || false;

      return (
        <TaskItem
          task={task}
          isActive={isActive}
          isSelected={isSelected}
          isTaskDirty={isTaskDirty}
          onSelectTask={onSelectTask}
        />
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
      if (!query.trim()) {
        return true;
      }
      const lowerQuery = query.toLowerCase();
      return (
        task.title.toLowerCase().includes(lowerQuery) || Boolean(task.description?.toLowerCase().includes(lowerQuery))
      );
    };
  }, []);

  return (
    <Flex direction="column" className={styles.taskList} grow gap={4}>
      <TaskListHeader />
      <Flex direction="column" grow>
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
