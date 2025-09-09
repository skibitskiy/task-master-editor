import { Toaster, type ToastProps } from '@gravity-ui/uikit';

let toasterInstance: Toaster | null = null;

export function setToasterInstance(toaster: Toaster) {
  toasterInstance = toaster;
}

export type NotificationTheme = 'normal' | 'info' | 'success' | 'warning' | 'danger' | 'utility';

interface NotifyOptions {
  title: string;
  message?: string;
  theme?: NotificationTheme;
  autoHiding?: number | false;
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
}

export function notify(options: NotifyOptions): void {
  if (!toasterInstance) {
    console.error('Toaster instance not initialized. Call setToasterInstance first.');
    return;
  }

  const name = `notification-${Date.now()}-${Math.random()}`;

  const toastOptions: ToastProps = {
    name,
    title: options.title,
    content: options.message,
    theme: options.theme || 'normal',
    autoHiding: options.autoHiding !== undefined ? options.autoHiding : 5000,
    actions: options.actions?.map((action) => ({
      label: action.label,
      onClick: action.onClick,
      view: 'outlined' as const,
      removeAfterClick: true,
    })),
  };

  toasterInstance.add(toastOptions);
}

export const notifySuccess = (title: string, message?: string) =>
  notify({ title, message, theme: 'success', autoHiding: 3000 });

export const notifyError = (title: string, message?: string) =>
  notify({ title, message, theme: 'danger', autoHiding: false });

export const notifyWarning = (title: string, message?: string) =>
  notify({ title, message, theme: 'warning', autoHiding: 5000 });

export const notifyInfo = (title: string, message?: string) =>
  notify({ title, message, theme: 'info', autoHiding: 5000 });
