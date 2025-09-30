import { ChevronLeft, Gear, Plus } from '@gravity-ui/icons';
import { Button, Flex, Icon, Select, Text } from '@gravity-ui/uikit';
import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { addNewTaskAsync, createBranch, switchBranch } from '../../redux/dataSlice';
import type { AppDispatch, RootState } from '../../redux/store';
import { clearSelectedTask, setSelectedTaskId } from '../../redux/task/taskSlice';
import { CreateBranchModal } from '../create-branch-modal';
import { ProjectSettingsModal } from '../project-settings';
import { TaskPath } from '../task-path';
import { TaskStatusFilter } from '../task-status-filter';
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
            <TaskPath />
            <Flex gap={2}>
              <Button view="flat" size="s" title="Добавить задачу" onClick={handleAddNewTask}>
                <Button.Icon>
                  <Plus />
                </Button.Icon>
              </Button>
              <Button view="flat" size="s" title="Настройки проекта" onClick={() => setIsSettingsOpen(true)}>
                <Button.Icon>
                  <Gear />
                </Button.Icon>
              </Button>
            </Flex>
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
                    <Text className={styles.createBranch} onClick={handleOpenModal}>
                      <span>Создать новую ветку</span>
                      <span className={styles.createBranchIcon}>
                        <Icon data={Plus} size={12} />
                      </span>
                    </Text>
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
          <TaskStatusFilter />
        </Flex>
      </div>

      <CreateBranchModal open={isModalOpen} onClose={() => setIsModalOpen(false)} onCreate={handleCreateBranch} />
      <ProjectSettingsModal open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
};
