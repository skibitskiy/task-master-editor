import React, { useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Flex, Text, Button, Select, Icon } from '@gravity-ui/uikit';
import { Plus, ChevronLeft } from '@gravity-ui/icons';
import type { RootState, AppDispatch } from '../../redux/store';
import { switchBranch, createBranch, addNewTaskAsync } from '../../redux/dataSlice';
import { clearSelectedTask, setSelectedTaskId } from '../../redux/task/taskSlice';
import { CreateBranchModal } from '../create-branch-modal';
import { TaskPath } from '../task-path';
import type { BranchOption } from './lib/types';
import styles from './styles.module.css';

interface TaskListHeaderProps {
  onBackToProjects: () => void;
}

export const TaskListHeader: React.FC<TaskListHeaderProps> = ({ onBackToProjects }) => {
  const dispatch = useDispatch<AppDispatch>();
  const tasksFile = useSelector((state: RootState) => state.data.tasksFile);
  const currentBranch = useSelector((state: RootState) => state.data.currentBranch);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get list of available branches
  const branches = useMemo((): BranchOption[] => {
    if (!tasksFile) {
      return [];
    }
    return Object.keys(tasksFile).map((branchName) => ({
      value: branchName,
      content: branchName,
    }));
  }, [tasksFile]);

  const handleBranchChange = (value: string[]) => {
    if (value.length > 0) {
      dispatch(switchBranch(value[0]));
      dispatch(clearSelectedTask());
    }
  };

  const handleCreateBranch = (branchName: string) => {
    dispatch(createBranch(branchName));
    dispatch(clearSelectedTask());
    setIsModalOpen(false);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleAddNewTask = async () => {
    try {
      const result = await dispatch(addNewTaskAsync()).unwrap();
      // Выбираем новую задачу в редакторе
      dispatch(setSelectedTaskId(String(result.taskId)));
    } catch (error) {
      console.error('Failed to create new task:', error);
    }
  };

  return (
    <>
      <div className={styles.container}>
        <Text className={styles.backToProjects} variant="body-short" onClick={onBackToProjects}>
          <Icon data={ChevronLeft} />
          Проекты
        </Text>
        <Flex direction="column" gap={3}>
          <Flex alignItems="center" justifyContent="space-between">
            <Flex direction="column" gap={1}>
              <Text variant="header-1">Задачи</Text>
              <TaskPath />
            </Flex>
            <Button view="action" size="s" title="Добавить задачу" onClick={handleAddNewTask}>
              <Button.Icon>
                <Plus />
              </Button.Icon>
            </Button>
          </Flex>

          <Flex alignItems="center" gap={2}>
            <Text variant="body-2" color="secondary">
              Ветка:
            </Text>
            <Select
              value={[currentBranch]}
              onUpdate={handleBranchChange}
              size="s"
              width={'max'}
              renderPopup={({ renderFilter, renderList }) => {
                return (
                  <React.Fragment>
                    {renderFilter && renderFilter()}
                    <div style={{ padding: '8px', borderBottom: '1px solid var(--g-color-line-generic)' }}>
                      <Button view="flat" size="s" width="max" onClick={handleOpenModal}>
                        Создать новую ветку
                        <Button.Icon>
                          <Plus />
                        </Button.Icon>
                      </Button>
                    </div>
                    {renderList()}
                  </React.Fragment>
                );
              }}
            >
              {branches.map((branch) => (
                <Select.Option key={branch.value} value={branch.value}>
                  {branch.content}
                </Select.Option>
              ))}
            </Select>
          </Flex>
        </Flex>
      </div>

      <CreateBranchModal open={isModalOpen} onClose={() => setIsModalOpen(false)} onCreate={handleCreateBranch} />
    </>
  );
};
