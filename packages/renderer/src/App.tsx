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
          const result = await withIPCErrorHandling(
            async () => {
              await store.dispatch(loadFromPath(last));
              if (last) await store.dispatch(updateMRU(last));
              return true;
            },
            'Загрузка последнего файла',
            true // Show warning only, don't block app startup
          );
          
          if (!result) {
            notifyError('Не удалось загрузить последний файл', 'Файл может быть перемещен или удален');
          }
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
              ) : (
                <Flex className="app-layout" grow>
                  <div className="app-sidebar">
                    <ErrorBoundary>
                      <TaskList 
                        selectedTaskId={selectedTaskId}
                        onSelectTask={setSelectedTaskId}
                      />
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