import React from 'react';
import { useSelector } from 'react-redux';
import { Flex, Text, TextInput, Button } from '@gravity-ui/uikit';
import { Plus, Magnifier } from '@gravity-ui/icons';
import type { RootState } from '../redux/store';

interface TaskListProps {
  selectedTaskId: string | null;
  onSelectTask: (taskId: string | null) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ selectedTaskId, onSelectTask }) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const tasksFile = useSelector((state: RootState) => state.data.tasksFile);

  const tasks = tasksFile?.master.tasks || [];

  const filteredTasks = tasks.filter(
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
            <Text color="secondary">{searchQuery ? 'Задачи не найдены' : 'Нет задач'}</Text>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`task-item ${selectedTaskId === String(task.id) ? 'selected' : ''}`}
              onClick={() => onSelectTask(String(task.id))}
            >
              <div className="task-item-title">{task.title}</div>
              {task.description && <div className="task-item-description">{task.description}</div>}
            </div>
          ))
        )}
      </Flex>
    </Flex>
  );
};
