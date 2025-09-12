import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { loadFromPath, saveFile } from '../redux/dataSlice';
import { updateMRU } from '../redux/settingsSlice';
import { RootState, store, useAppDispatch } from '../redux/store';
import { useEditorContext } from '../shared/editor-context';
import { withIPCErrorHandling } from '../utils/ipcErrorMapper';
import { notifyError, notifySuccess } from '../utils/notify';

interface MenuHandlerProps {
  onFileSelected: (filePath: string) => void;
}

export const MenuHandler: React.FC<MenuHandlerProps> = ({ onFileSelected }) => {
  const dispatch = useAppDispatch();
  const { updateCurrentTask } = useEditorContext();
  const isDirty = useSelector((state: RootState) => state.data.dirty.file);

  // Sync dirty state with main process
  useEffect(() => {
    window.electron?.menu.setDirtyState(isDirty);
  }, [isDirty]);

  // Handle menu events - register only once on mount
  useEffect(() => {
    const handleOpenFile = async (newFilePath: string) => {
      const result = await withIPCErrorHandling(async () => {
        const loadResult = await dispatch(loadFromPath(newFilePath));
        if (loadResult.meta.requestStatus === 'fulfilled') {
          await dispatch(updateMRU(newFilePath));
          onFileSelected(newFilePath);
          notifySuccess('Файл загружен', `Открыт файл: ${newFilePath.split('/').pop()}`);
          return true;
        } else if (loadResult.meta.requestStatus === 'rejected') {
          const errorMessage = typeof loadResult.payload === 'string' ? loadResult.payload : 'Неизвестная ошибка';

          if (errorMessage.includes('Invalid JSON')) {
            notifyError(
              'Неверный формат файла',
              'Файл содержит некорректный JSON. Пожалуйста, проверьте синтаксис файла.',
            );
          } else if (errorMessage.includes('Invalid schema')) {
            const details = errorMessage.replace('Invalid schema: ', '');
            notifyError('Неверная структура файла', `Файл не соответствует схеме tasks.json: ${details}`);
          } else {
            notifyError('Ошибка загрузки файла', errorMessage);
          }
        }
        return false;
      }, 'Загрузка файла задач');

      return result;
    };

    const handleSave = async () => {
      // Get current values from Redux store instead of relying on closure
      const state = store.getState();
      const currentIsDirty = state.data.dirty.file;
      const currentFilePath = state.data.filePath;

      if (!currentIsDirty || !currentFilePath) {
        return;
      }

      const result = await withIPCErrorHandling(async () => {
        updateCurrentTask();
        const saveResult = await dispatch(saveFile());
        if (saveResult.meta.requestStatus === 'fulfilled') {
          notifySuccess('Файл сохранен', `Изменения сохранены в ${currentFilePath.split('/').pop()}`);
          return true;
        } else if (saveResult.meta.requestStatus === 'rejected') {
          const errorMessage = typeof saveResult.payload === 'string' ? saveResult.payload : 'Неизвестная ошибка';
          notifyError('Ошибка сохранения', errorMessage);
        }
        return false;
      }, 'Сохранение файла');

      return result;
    };

    // Register both menu event listeners only once on mount
    window.electron?.menu.onOpenFile(handleOpenFile);
    window.electron?.menu.onSave(handleSave);

    // Cleanup on unmount
    return () => {
      // Listeners will be cleaned up by preload removeAllListeners when new ones are registered
    };
  }, [dispatch, onFileSelected]); // Only depend on dispatch and onFileSelected

  return null;
};
