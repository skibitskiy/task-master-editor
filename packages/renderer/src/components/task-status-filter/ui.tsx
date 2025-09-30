import { TaskStatus } from '@app/shared';
import {
  Flex,
  Label,
  Select,
  type SelectOption,
  SelectRenderControl,
  SelectRenderOption,
  Text,
} from '@gravity-ui/uikit';
import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectTaskStatusFilter } from '@/redux/settingsSelectors';
import { savePreferences } from '@/redux/settingsSlice';
import type { AppDispatch, RootState } from '@/redux/store';
import { getStatusLabelProps, statusTypeGuard } from '@/shared/lib';

import styles from './styles.module.css';

const ALL_OPTION_VALUE = 'all';

const haveSameStatuses = (a: TaskStatus[], b: TaskStatus[]): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  const set = new Set(a);
  return b.every((value) => set.has(value));
};

export const TaskStatusFilter: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const filePath = useSelector((state: RootState) => state.data.filePath);
  const statusFilter = useSelector(selectTaskStatusFilter);

  const options: SelectOption[] = useMemo(
    () =>
      Object.values(TaskStatus).map((status) => {
        const { text } = getStatusLabelProps(status);
        return {
          value: status,
          content: text,
        };
      }),
    [],
  );

  const handleStatusFilterChange = useCallback(
    (values: string[]) => {
      const containsAll = values.includes(ALL_OPTION_VALUE);
      const uniqueStatuses =
        containsAll && values.length === 1 ? [] : values.filter((value): value is TaskStatus => statusTypeGuard(value));

      if (!filePath) {
        return;
      }

      if (haveSameStatuses(statusFilter, uniqueStatuses)) {
        return;
      }

      const updatePayload: Record<string, unknown> = uniqueStatuses.length
        ? {
            taskFilters: {
              [filePath]: {
                status: uniqueStatuses,
              },
            },
          }
        : {
            taskFilters: {
              [filePath]: undefined,
            },
          };

      dispatch(savePreferences(updatePayload));
    },
    [dispatch, filePath, statusFilter],
  );

  const selectValue = useMemo(() => (statusFilter.length === 0 ? [ALL_OPTION_VALUE] : statusFilter), [statusFilter]);

  const renderControl: SelectRenderControl<HTMLDivElement> = useCallback(
    ({ ref, triggerProps: { onClick, onKeyDown } }) => {
      return (
        <div className={styles.control} ref={ref} onClick={onClick} onKeyDown={onKeyDown}>
          {selectValue.map((status) => {
            if (status === ALL_OPTION_VALUE) {
              return (
                <Label key={status} size="xs">
                  Все статусы
                </Label>
              );
            }

            if (!statusTypeGuard(status)) {
              return null;
            }

            const { text, theme } = getStatusLabelProps(status);
            return (
              <Label key={status} theme={theme} size="xs">
                {text}
              </Label>
            );
          })}
        </div>
      );
    },
    [selectValue],
  );

  const renderOption = useCallback<SelectRenderOption<TaskStatus>>((option) => {
    const { value } = option;

    if (value === ALL_OPTION_VALUE) {
      return <Text variant="body-2">Все статусы</Text>;
    }

    if (!statusTypeGuard(value)) {
      return <span />;
    }

    const { text, theme } = getStatusLabelProps(value);

    return (
      <Label theme={theme} size="xs">
        {text}
      </Label>
    );
  }, []);

  return (
    <div className={styles.container}>
      <Text variant="subheader-2">Фильтры</Text>
      <Flex gap={2}>
        <Text variant="body-2" color="secondary">
          Статус:
        </Text>
        <Select
          multiple
          size="s"
          popupClassName={styles.popup}
          value={selectValue}
          onUpdate={handleStatusFilterChange}
          renderControl={renderControl as SelectRenderControl<HTMLElement>}
          renderOption={renderOption}
          options={options}
        />
      </Flex>
    </div>
  );
};
