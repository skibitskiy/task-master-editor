import { TaskPriority } from '@app/shared';
import { Check } from '@gravity-ui/icons';
import { Flex, Icon, Label, Select, SelectRenderControl, SelectRenderOption } from '@gravity-ui/uikit';
import { useCallback } from 'react';

import { saveFile, updateTask } from '@/redux/dataSlice';
import { useAppDispatch } from '@/redux/store';
import { useCurrentTask } from '@/redux/task';
import { priorityTypeGuard } from '@/shared/lib';
import { getPriorityLabelProps } from '@/shared/lib';
import { notifySuccess } from '@/utils/notify';

import styles from './styles.module.css';

type PrioritySelectProps = {
  className?: string;
};

export const PrioritySelect = ({ className }: PrioritySelectProps) => {
  const dispatch = useAppDispatch();

  const currentTask = useCurrentTask();

  const taskPriority = currentTask.task?.priority;
  const taskId = currentTask.taskId;

  const priorityOptions: Array<{ value: TaskPriority; content: string }> = [
    { value: TaskPriority.LOW, content: 'Низкий' },
    { value: TaskPriority.MEDIUM, content: 'Средний' },
    { value: TaskPriority.HIGH, content: 'Высокий' },
  ];

  const handlePriorityChange = useCallback(
    (newPriority: TaskPriority) => {
      if (!taskId || !priorityTypeGuard(newPriority)) {
        return;
      }

      dispatch(
        updateTask({
          id: parseInt(taskId),
          patch: {
            priority: newPriority,
          },
        }),
      );
      dispatch(saveFile());
      notifySuccess('Изменения применены');
    },
    [taskId, dispatch],
  );

  const renderControl: SelectRenderControl<HTMLDivElement> = useCallback(
    ({ ref, triggerProps: { onClick, onKeyDown } }) => {
      return (
        <div className={styles.prioritySelectControl} ref={ref} onClick={onClick} onKeyDown={onKeyDown}>
          <Label theme={getPriorityLabelProps(taskPriority).theme} size="xs">
            {getPriorityLabelProps(taskPriority).text}
          </Label>
        </div>
      );
    },
    [taskPriority],
  );

  const renderOption: SelectRenderOption<unknown> = useCallback(
    (option) => {
      const value = option.value;

      const isSelected = option.value === taskPriority;

      if (!priorityTypeGuard(value)) {
        return <span>–</span>;
      }

      const priorityProps = getPriorityLabelProps(value);

      return (
        <Flex width={'100%'} alignItems="center" justifyContent="space-between">
          <Label theme={priorityProps.theme} size="xs">
            {priorityProps.text}
          </Label>
          {isSelected && <Icon data={Check} />}
        </Flex>
      );
    },
    [taskPriority],
  );

  const handleUpdate = useCallback(
    (values: string[]) => {
      const value = values[0];

      if (priorityTypeGuard(value)) {
        handlePriorityChange?.(value);
      }
    },
    [handlePriorityChange],
  );

  return (
    <Select
      className={className}
      popupClassName={styles.prioritySelectPopup}
      renderControl={renderControl as SelectRenderControl<HTMLElement>}
      value={taskPriority ? [taskPriority] : []}
      onUpdate={handleUpdate}
      size="s"
      renderOption={renderOption}
      options={priorityOptions}
    />
  );
};
