import { TaskField } from './model.js';

export const TaskFieldWords = {
  [TaskField.DEPENDENCIES]: 'Зависимости',
  [TaskField.DESCRIPTION]: 'Описание',
  [TaskField.DETAILS]: 'Детали',
  [TaskField.STATUS]: 'Статус',
  [TaskField.TEST_STRATEGY]: 'Стратегия тестирования',
  [TaskField.PRIORITY]: 'Приоритет',
  [TaskField.TITLE]: 'Заголовок',
  [TaskField.ID]: 'ID',
  [TaskField.SUBTASKS]: 'Подзадачи',
} as const;
