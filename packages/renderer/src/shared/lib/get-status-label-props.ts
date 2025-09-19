import { TaskStatus } from '@app/shared';
import { LabelProps } from '@gravity-ui/uikit';

export const getStatusLabelProps = (status?: TaskStatus): { theme: LabelProps['theme']; text: string } => {
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
