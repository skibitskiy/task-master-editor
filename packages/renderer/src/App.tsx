import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  Toaster,
  ToasterComponent,
  ToasterProvider,
  Flex,
  Loader,
} from '@gravity-ui/uikit';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { initSettings, updateMRU } from './redux/settingsSlice';
import { loadFromPath } from './redux/dataSlice';
import { TaskList } from './components/TaskList';
import { EditorPanel } from './components/EditorPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FileSelectionScreen } from './components/FileSelectionScreen';
import { setToasterInstance, notifySuccess, notifyError } from './utils/notify';
import { setupGlobalErrorHandlers } from './utils/globalErrorHandler';
import { withIPCErrorHandling } from './utils/ipcErrorMapper';
import './App.css';

const toaster = new Toaster();
setToasterInstance(toaster);

export const App: React.FC = () => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(true);
  const [hasValidFile, setHasValidFile] = useState(false);

  useEffect(() => {
    // Setup global error handlers
    setupGlobalErrorHandlers();

    // Initialize settings and load last file with error handling
    const initializeApp = async () => {
      try {
        await store.dispatch(initSettings());
        const state = store.getState();
        const prefs = state.settings.data.preferences as Record<string, unknown> | undefined;
        const mruEnabled = prefs?.mruEnabled ?? true;
        const last = state.settings.data.recentPaths[0];

        if (mruEnabled && typeof last === 'string' && last.length > 0) {
          await withIPCErrorHandling(
            async () => {
              const loadResult = await store.dispatch(loadFromPath(last));
              if (loadResult.meta.requestStatus === 'fulfilled') {
                await store.dispatch(updateMRU(last));
                setHasValidFile(true);
                return true;
              } else if (loadResult.meta.requestStatus === 'rejected') {
                // Handle validation errors during app startup
                const errorMessage =
                  typeof loadResult.payload === 'string'
                    ? loadResult.payload
                    : 'Неизвестная ошибка';

                if (
                  errorMessage.includes('Invalid JSON') ||
                  errorMessage.includes('Invalid schema')
                ) {
                  notifyError(
                    'Поврежденный файл задач',
                    'Последний файл tasks.json поврежден или имеет неверный формат. Выберите другой файл.',
                  );
                } else {
                  notifyError(
                    'Не удалось загрузить последний файл',
                    'Файл может быть перемещен, удален или поврежден',
                  );
                }
              }
              return false;
            },
            'Загрузка последнего файла',
            true, // Show warning only, don't block app startup
          );
        }
      } catch (error) {
        notifyError('Ошибка инициализации', 'Не удалось загрузить настройки приложения');
        console.error('App initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();

    // Check system theme preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  }, []);

  const handleFileSelected = async (filePath: string) => {
    setIsLoading(true);
    try {
      const result = await withIPCErrorHandling(async () => {
        const loadResult = await store.dispatch(loadFromPath(filePath));
        if (loadResult.meta.requestStatus === 'fulfilled') {
          await store.dispatch(updateMRU(filePath));
          setHasValidFile(true);
          notifySuccess('Файл загружен', `Открыт файл: ${filePath.split('/').pop()}`);
          return true;
        } else if (loadResult.meta.requestStatus === 'rejected') {
          // Handle validation errors with more specific messages
          const errorMessage =
            typeof loadResult.payload === 'string' ? loadResult.payload : 'Неизвестная ошибка';

          if (errorMessage.includes('Invalid JSON')) {
            notifyError(
              'Неверный формат файла',
              'Файл содержит некорректный JSON. Пожалуйста, проверьте синтаксис файла.',
            );
          } else if (errorMessage.includes('Invalid schema')) {
            const details = errorMessage.replace('Invalid schema: ', '');
            notifyError(
              'Неверная структура файла',
              `Файл не соответствует схеме tasks.json: ${details}`,
            );
          } else if (errorMessage.includes('No preload API')) {
            notifyError(
              'Ошибка системы',
              'Нет доступа к файловой системе. Попробуйте перезапустить приложение.',
            );
          } else {
            notifyError('Ошибка загрузки файла', errorMessage);
          }
        }
        return false;
      }, 'Загрузка файла задач');

      if (!result) {
        // Additional generic error if withIPCErrorHandling didn't catch specific errors
        // This should rarely be reached now with better error handling above
      }
    } catch (error) {
      notifyError('Критическая ошибка', 'Произошла неожиданная ошибка при загрузке файла');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <ToasterProvider toaster={toaster}>
          <ErrorBoundary>
            <div className="app">
              {isLoading ? (
                <Flex centerContent width="100%" height="100vh">
                  <Loader size="l" />
                </Flex>
              ) : !hasValidFile ? (
                <FileSelectionScreen onFileSelected={handleFileSelected} />
              ) : (
                <Flex className="app-layout" grow>
                  <div className="app-sidebar">
                    <ErrorBoundary>
                      <TaskList selectedTaskId={selectedTaskId} onSelectTask={setSelectedTaskId} />
                    </ErrorBoundary>
                  </div>
                  <div className="app-content">
                    <ErrorBoundary>
                      <EditorPanel
                        taskId={selectedTaskId}
                        onSave={() => {
                          notifySuccess('Сохранено', 'Изменения успешно сохранены');
                        }}
                      />
                    </ErrorBoundary>
                  </div>
                </Flex>
              )}
              <ToasterComponent />
            </div>
          </ErrorBoundary>
        </ToasterProvider>
      </ThemeProvider>
    </Provider>
  );
};
