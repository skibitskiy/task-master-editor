import { TaskStatus } from '@app/shared';
import { createSelector } from '@reduxjs/toolkit';

import { statusTypeGuard } from '@/shared/lib';

import type { RootState } from './store';

export type TaskFiltersPreference = {
  status?: unknown;
};

export interface PreferencesShape {
  taskFilters?: Record<string, TaskFiltersPreference>;
  [key: string]: unknown;
}

export const isPreferencesShape = (value: unknown): value is PreferencesShape =>
  typeof value === 'object' && value !== null;

export const normalizeStoredStatuses = (value: unknown): TaskStatus[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is TaskStatus => typeof item === 'string' && statusTypeGuard(item));
  }

  if (typeof value === 'string' && statusTypeGuard(value)) {
    return [value];
  }

  return [];
};

const selectPreferences = (state: RootState) => state.settings.data.preferences;
const selectCurrentFilePath = (state: RootState) => state.data.filePath;

export const selectTaskStatusFilter = createSelector(
  [selectPreferences, selectCurrentFilePath],
  (preferences, filePath) => {
    if (!filePath) {
      return [] as TaskStatus[];
    }

    if (!isPreferencesShape(preferences)) {
      return [] as TaskStatus[];
    }

    const filters = preferences.taskFilters;
    if (!filters || typeof filters !== 'object') {
      return [] as TaskStatus[];
    }

    return normalizeStoredStatuses(filters[filePath]?.status);
  },
);

export const selectTaskFilters = createSelector([selectPreferences], (preferences) => {
  if (
    !isPreferencesShape(preferences) ||
    typeof preferences.taskFilters !== 'object' ||
    preferences.taskFilters === null
  ) {
    return {} as Record<string, TaskFiltersPreference>;
  }

  return preferences.taskFilters as Record<string, TaskFiltersPreference>;
});
