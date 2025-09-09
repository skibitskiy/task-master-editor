import { notifyError, notifyWarning } from './notify';
import { logError } from './globalErrorHandler';

export interface IPCError {
  code: string;
  message: string;
  details?: unknown;
}

const ERROR_MESSAGES: Record<string, string> = {
  FILE_NOT_FOUND: 'Файл не найден. Проверьте путь к файлу.',
  FILE_ACCESS_DENIED: 'Нет доступа к файлу. Проверьте права доступа.',
  FILE_READ_ERROR: 'Ошибка при чтении файла. Файл может быть поврежден.',
  FILE_WRITE_ERROR: 'Ошибка при записи файла. Проверьте доступное место на диске.',
  INVALID_JSON: 'Неверный формат файла. Файл должен быть в формате JSON.',
  NETWORK_ERROR: 'Ошибка сети. Проверьте подключение к интернету.',
  TIMEOUT: 'Превышено время ожидания операции. Попробуйте еще раз.',
  VALIDATION_ERROR: 'Данные не прошли проверку. Проверьте корректность введенных данных.',
  PERMISSION_DENIED: 'Недостаточно прав для выполнения операции.',
  UNKNOWN_ERROR: 'Произошла неизвестная ошибка. Попробуйте еще раз.',
  IPC_CHANNEL_ERROR: 'Ошибка связи с основным процессом.',
  SETTINGS_LOAD_ERROR: 'Не удалось загрузить настройки.',
  SETTINGS_SAVE_ERROR: 'Не удалось сохранить настройки.',
  TASK_NOT_FOUND: 'Задача не найдена.',
  TASK_VALIDATION_ERROR: 'Некорректные данные задачи.',
  TASK_SAVE_ERROR: 'Не удалось сохранить задачу.',
  TASK_DELETE_ERROR: 'Не удалось удалить задачу.',
};

export function mapIPCError(error: IPCError | Error | unknown): string {
  if (!error) {
    return ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    const code = (error as Error & { code?: string }).code;
    if (code && ERROR_MESSAGES[code]) {
      return ERROR_MESSAGES[code];
    }
    return error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  if (typeof error === 'object' && error !== null) {
    const ipcError = error as IPCError;

    if (ipcError.code && ERROR_MESSAGES[ipcError.code]) {
      return ERROR_MESSAGES[ipcError.code];
    }

    if (ipcError.message) {
      return ipcError.message;
    }
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

export function handleIPCError(error: IPCError | Error | unknown, context?: string): void {
  const userMessage = mapIPCError(error);
  const errorTitle = context ? `Ошибка: ${context}` : 'Ошибка операции';

  notifyError(errorTitle, userMessage);

  logError(error instanceof Error ? error : new Error(userMessage), {
    context,
    originalError: error,
  });
}

export function createIPCErrorHandler(context: string) {
  return (error: IPCError | Error | unknown) => {
    handleIPCError(error, context);
  };
}

export async function withIPCErrorHandling<T>(
  operation: () => Promise<T>,
  context: string,
  showWarningOnly = false,
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    const userMessage = mapIPCError(error);

    if (showWarningOnly) {
      notifyWarning(context, userMessage);
    } else {
      handleIPCError(error, context);
    }

    return null;
  }
}
