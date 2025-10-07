import { Flex, List, Text } from '@gravity-ui/uikit';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectTaskStatusFilter } from '@/redux/settingsSelectors';
import type { FlattenedTask } from '@/shared/lib';
import { flattenTasks, sortTasksRecursively } from '@/shared/lib';

import type { RootState } from '../../redux/store';
import { TaskItem } from '../task-item';
import { TaskListHeader } from '../task-list-header';
import type { TaskListProps } from './lib/types';
import styles from './styles.module.css';

export const TaskList: React.FC<TaskListProps> = ({ selectedTaskId, onSelectTask, onBackToProjects }) => {
  const tasksFile = useSelector((state: RootState) => state.data.tasksFile);
  const currentBranch = useSelector((state: RootState) => state.data.currentBranch);
  const dirtyState = useSelector((state: RootState) => state.data.dirty);
  const statusFilter = useSelector(selectTaskStatusFilter);

  const tasks = useMemo(() => {
    if (!tasksFile || !currentBranch) {
      return [];
    }
    return tasksFile[currentBranch]?.tasks || [];
  }, [tasksFile, currentBranch]);

  const flattenedTasks = React.useMemo(() => {
    if (!tasks.length) {
      return [];
    }

    const sorted = sortTasksRecursively(tasks);
    return flattenTasks(sorted);
  }, [tasks]);

  const filteredTasks = React.useMemo(() => {
    if (!statusFilter.length) {
      return flattenedTasks;
    }

    const allowed = new Set(statusFilter);
    return flattenedTasks.filter((item) => (item.task.status ? allowed.has(item.task.status) : false));
  }, [flattenedTasks, statusFilter]);

  // Memoized render function for List component
  const renderTaskItem = React.useCallback(
    (item: FlattenedTask) => {
      const { task, depth, path } = item;
      const isSelected = selectedTaskId === path;
      const isTaskDirty = dirtyState.byTaskId[path] || false;

      return (
        <TaskItem
          task={task}
          isSelected={isSelected}
          isTaskDirty={isTaskDirty}
          isSubtask={depth > 0}
          taskPath={path}
          onSelectTask={onSelectTask}
        />
      );
    },
    [selectedTaskId, onSelectTask, dirtyState.byTaskId],
  );

  // Custom filter function for List component
  const filterTask = React.useCallback((query: string) => {
    return (item: FlattenedTask): boolean => {
      const { task } = item;
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
      <TaskListHeader onBackToProjects={onBackToProjects} />
      <Flex className={styles.taskListContent} direction="column" grow>
        {filteredTasks.length === 0 ? (
          <div className="editor-placeholder">
            <Text color="secondary">Задач нет</Text>
          </div>
        ) : (
          <List
            items={filteredTasks}
            renderItem={renderTaskItem}
            itemHeight={100}
            itemsHeight={0}
            filterable={true}
            filterPlaceholder="Поиск задач..."
            filterItem={filterTask}
            emptyPlaceholder={
              <div className="editor-placeholder">
                <Text color="secondary">Задачи не найдены</Text>
              </div>
            }
            virtualized={true}
            onItemClick={(item, _index) => onSelectTask(item.path)}
          />
        )}
      </Flex>
    </Flex>
  );
};
