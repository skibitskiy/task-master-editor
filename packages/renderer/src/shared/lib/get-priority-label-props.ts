import { TaskPriority } from '@app/shared';
import { LabelProps } from '@gravity-ui/uikit';

export const getPriorityLabelProps = (priority?: TaskPriority): { theme: LabelProps['theme']; text: string } => {
  switch (priority) {
    case TaskPriority.HIGH:
      return { theme: 'danger', text: 'Высокий' };
    case TaskPriority.MEDIUM:
      return { theme: 'warning', text: 'Средний' };
    case TaskPriority.LOW:
      return { theme: 'utility', text: 'Низкий' };
    default:
      return { theme: 'normal', text: 'Не задан' };
  }
};
