import React from 'react';
import { useSelector } from 'react-redux';
import { Flex, Text, TextInput, Button, Label } from '@gravity-ui/uikit';
import { Plus, Magnifier } from '@gravity-ui/icons';
import type { RootState } from '../redux/store';
import type { TaskStatus } from '@app/shared';

interface TaskListProps {
  selectedTaskId: string | null;
  onSelectTask: (taskId: string | null) => void;
}

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
  const [searchQuery, setSearchQuery] = React.useState('');
  const tasksFile = useSelector((state: RootState) => state.data.tasksFile);

  const tasks = tasksFile?.master.tasks || [];

  // Stable sorting by ID (convert to number for proper numeric sorting)
  const sortedTasks = React.useMemo(() => {
    return [...tasks].sort((a, b) => {
      const aId = typeof a.id === 'number' ? a.id : parseInt(String(a.id), 10) || 0;
      const bId = typeof b.id === 'number' ? b.id : parseInt(String(b.id), 10) || 0;
      return aId - bId;
    });
  }, [tasks]);

  const filteredTasks = sortedTasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Flex direction="column" className="task-list" grow>
      <div className="task-list-header">
        <Flex direction="column" gap={3}>
          <Flex alignItems="center" justifyContent="space-between">
            <Text variant="header-1">Задачи</Text>
            <Button view="action" size="s" title="Добавить задачу">
              <Button.Icon>
                <Plus />
              </Button.Icon>
            </Button>
          </Flex>
          <TextInput
            placeholder="Поиск задач..."
            value={searchQuery}
            onUpdate={setSearchQuery}
            startContent={<Magnifier />}
            size="m"
            hasClear
          />
        </Flex>
      </div>

      <Flex direction="column" grow>
        {filteredTasks.length === 0 ? (
          <div className="editor-placeholder">
            <Text color="secondary">{searchQuery ? 'Задачи не найдены' : 'Задач нет'}</Text>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const statusProps = getStatusLabelProps(task.status);
            const isSelected = selectedTaskId === String(task.id);

            return (
              <div
                key={task.id}
                className={`task-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectTask(String(task.id))}
              >
                <Flex
                  alignItems="center"
                  justifyContent="space-between"
                  className="task-item-header"
                >
                  <Flex alignItems="center" gap={2}>
                    <Text variant="caption-1" color="secondary">
                      #{task.id}
                    </Text>
                    <Text variant="body-2" className="task-item-title">
                      {task.title}
                    </Text>
                  </Flex>
                  <Label theme={statusProps.theme} size="s">
                    {statusProps.text}
                  </Label>
                </Flex>
                {task.description && (
                  <Text variant="caption-2" color="secondary" className="task-item-description">
                    {task.description}
                  </Text>
                )}
              </div>
            );
          })
        )}
      </Flex>
    </Flex>
  );
};
