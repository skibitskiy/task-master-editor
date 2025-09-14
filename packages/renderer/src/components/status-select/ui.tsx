import { TaskStatus } from '@app/shared';
import { Check } from '@gravity-ui/icons';
import { Flex, Icon, Label, Select, SelectRenderControl, SelectRenderOption } from '@gravity-ui/uikit';
import { useCallback } from 'react';

import { saveFile, updateTask } from '@/redux/dataSlice';
import { useAppDispatch } from '@/redux/store';
import { useCurrentTask } from '@/redux/task';
import { statusTypeGuard } from '@/shared/lib';
import { getStatusLabelProps } from '@/shared/lib';
import { notifySuccess } from '@/utils/notify';

import styles from './styles.module.css';

type StatusSelectProps = {
  className?: string;
};

export const StatusSelect = ({ className }: StatusSelectProps) => {
  const dispatch = useAppDispatch();

  const currentTask = useCurrentTask();

  const taskStatus = currentTask.task?.status || TaskStatus.PENDING;
  const taskId = currentTask.taskId;

  const statusOptions: Array<{ value: TaskStatus; content: string }> = [
    { value: TaskStatus.PENDING, content: 'Ожидает' },
    { value: TaskStatus.IN_PROGRESS, content: 'В работе' },
    { value: TaskStatus.DONE, content: 'Готово' },
    { value: TaskStatus.BLOCKED, content: 'Заблокировано' },
    { value: TaskStatus.DEFERRED, content: 'Отложено' },
    { value: TaskStatus.CANCELLED, content: 'Отменено' },
  ];

  const handleStatusChange = useCallback(
    (newStatus: TaskStatus) => {
      if (!taskId || !statusTypeGuard(newStatus)) {
        return;
      }

      dispatch(
        updateTask({
          id: parseInt(taskId),
          patch: {
            status: newStatus,
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
        <div className={styles.statusSelectControl} ref={ref} onClick={onClick} onKeyDown={onKeyDown}>
          <Label theme={getStatusLabelProps(taskStatus).theme} size="xs">
            {getStatusLabelProps(taskStatus).text}
          </Label>
        </div>
      );
    },
    [taskStatus],
  );

  const renderOption: SelectRenderOption<unknown> = useCallback(
    (option) => {
      const value = option.value;

      const isSelected = option.value === taskStatus;

      if (!statusTypeGuard(value)) {
        return <span>–</span>;
      }

      const statusProps = getStatusLabelProps(value);

      return (
        <Flex width={'100%'} alignItems="center" justifyContent="space-between">
          <Label theme={statusProps.theme} size="xs">
            {statusProps.text}
          </Label>
          {isSelected && <Icon data={Check} />}
        </Flex>
      );
    },
    [taskStatus],
  );

  const handleUpdate = useCallback(
    (values: string[]) => {
      const value = values[0];

      if (statusTypeGuard(value)) {
        handleStatusChange?.(value);
      }
    },
    [handleStatusChange],
  );

  return (
    <Select
      className={className}
      popupClassName={styles.statusSelectPopup}
      renderControl={renderControl as SelectRenderControl<HTMLElement>}
      value={[taskStatus]}
      onUpdate={handleUpdate}
      size="s"
      renderOption={renderOption}
      options={statusOptions}
    />
  );
};
