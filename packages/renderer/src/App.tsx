import './App.css';

import { Flex, Loader, ThemeProvider, Toaster, ToasterComponent, ToasterProvider } from '@gravity-ui/uikit';
import React, { useEffect, useState } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';

import { EditorPanel } from './components/editor-panel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FileSelectionScreen } from './components/file-selection-screen';
import { MenuHandler } from './components/MenuHandler';
import { TaskList } from './components/task-list';
import { UnsavedChangesModal } from './components/unsaved-changes-modal';
import { loadFromPath, saveFile, setTaskDirty } from './redux/dataSlice';
import { initSettings, updateMRU } from './redux/settingsSlice';
import type { AppDispatch, RootState } from './redux/store';
import { store } from './redux/store';
import { setSelectedTaskId, useCurrentTask } from './redux/task';
import { EditorProvider, useEditorContext } from './shared/editor-context';
import { setupGlobalErrorHandlers } from './utils/globalErrorHandler';
import { withIPCErrorHandling } from './utils/ipcErrorMapper';
import { notifyError, notifySuccess, setToasterInstance } from './utils/notify';

const toaster = new Toaster();
setToasterInstance(toaster);

const AppContent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const dirtyState = useSelector((state: RootState) => state.data.dirty);
  const { taskId: selectedTaskId } = useCurrentTask();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(true);
  const [hasValidFile, setHasValidFile] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  const { updateCurrentTask } = useEditorContext();

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
                const errorMessage = typeof loadResult.payload === 'string' ? loadResult.payload : 'Неизвестная ошибка';

                if (errorMessage.includes('Invalid JSON') || errorMessage.includes('Invalid schema')) {
                  notifyError(
                    'Поврежденный файл задач',
                    'Последний файл tasks.json поврежден или имеет неверный формат. Выберите другой файл.',
                  );
                } else {
                  notifyError('Не удалось загрузить последний файл', 'Файл может быть перемещен, удален или поврежден');
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

  useEffect(() => {
    const darkThemeListener = (e: MediaQueryListEvent) => e.matches && setTheme('dark');
    const lightThemeListener = (e: MediaQueryListEvent) => e.matches && setTheme('light');
    const mdark = window.matchMedia('(prefers-color-scheme: dark)');
    const mlight = window.matchMedia('(prefers-color-scheme: light)');
    mdark.addEventListener('change', darkThemeListener);
    mlight.addEventListener('change', lightThemeListener);
    return () => {
      // cleanup event listeners
      mdark.removeEventListener('change', darkThemeListener);
      mlight.removeEventListener('change', lightThemeListener);
    };
  }, []);

  // Handle navigation with unsaved changes check
  const checkUnsavedChanges = (callback: () => void) => {
    const state = store.getState();
    const hasDirtyTasks = state.data.dirty.file;

    if (hasDirtyTasks) {
      setPendingNavigation(() => callback);
      setShowUnsavedModal(true);
    } else {
      callback();
    }
  };

  const handleSaveAndContinue = async () => {
    try {
      updateCurrentTask();
      const result = await store.dispatch(saveFile());
      if (saveFile.fulfilled.match(result)) {
        // Clear dirty state for currently opened task
        if (selectedTaskId) {
          store.dispatch(setTaskDirty({ taskId: selectedTaskId, isDirty: false }));
        }
        notifySuccess('Сохранено', 'Все изменения успешно сохранены');
        setShowUnsavedModal(false);
        if (pendingNavigation) {
          pendingNavigation();
          setPendingNavigation(null);
        }
      } else if (saveFile.rejected.match(result)) {
        const errorMessage = typeof result.payload === 'string' ? result.payload : 'Неизвестная ошибка';
        notifyError('Ошибка сохранения', errorMessage);
      }
    } catch (error) {
      notifyError('Ошибка сохранения', 'Произошла неожиданная ошибка при сохранении файла');
    }
  };

  const handleDiscardChanges = () => {
    // Clear dirty state for currently opened task
    if (selectedTaskId) {
      store.dispatch(setTaskDirty({ taskId: selectedTaskId, isDirty: false }));
    }
    setShowUnsavedModal(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  };

  const handleCancelNavigation = () => {
    setShowUnsavedModal(false);
    setPendingNavigation(null);
  };

  // Handle task selection with unsaved changes check
  const handleTaskSelect = (taskId: string | null) => {
    // Check if current task has unsaved changes
    const currentTaskDirty = selectedTaskId ? dirtyState.byTaskId[selectedTaskId] : false;

    if (currentTaskDirty) {
      setPendingNavigation(() => () => dispatch(setSelectedTaskId(taskId)));
      setShowUnsavedModal(true);
    } else {
      dispatch(setSelectedTaskId(taskId));
    }
  };

  const handleFileSelected = async (filePath: string) => {
    setIsLoading(true);
    try {
      const result = await withIPCErrorHandling(async () => {
        const loadResult = await store.dispatch(loadFromPath(filePath));
        if (loadResult.meta.requestStatus === 'fulfilled') {
          await store.dispatch(updateMRU(filePath));
          setHasValidFile(true);
          // Clear selected task when new file is loaded
          setSelectedTaskId(null);
          return true;
        } else if (loadResult.meta.requestStatus === 'rejected') {
          // Handle validation errors with more specific messages
          const errorMessage = typeof loadResult.payload === 'string' ? loadResult.payload : 'Неизвестная ошибка';

          if (errorMessage.includes('Invalid JSON')) {
            notifyError(
              'Неверный формат файла',
              'Файл содержит некорректный JSON. Пожалуйста, проверьте синтаксис файла.',
            );
          } else if (errorMessage.includes('Invalid schema')) {
            const details = errorMessage.replace('Invalid schema: ', '');
            notifyError('Неверная структура файла', `Файл не соответствует схеме tasks.json: ${details}`);
          } else if (errorMessage.includes('No preload API')) {
            notifyError('Ошибка системы', 'Нет доступа к файловой системе. Попробуйте перезапустить приложение.');
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
    <ThemeProvider theme={theme}>
      <ToasterProvider toaster={toaster}>
        <ErrorBoundary>
          <MenuHandler
            onFileSelected={(_path) => {
              setHasValidFile(true);
            }}
          />
          <div className="app">
            {isLoading ? (
              <Flex centerContent width="100%" height="100vh">
                <Loader size="l" />
              </Flex>
            ) : !hasValidFile ? (
              <FileSelectionScreen
                onFileSelected={(filePath) => checkUnsavedChanges(() => handleFileSelected(filePath))}
              />
            ) : (
              <Flex className="app-layout" grow>
                <div className="app-sidebar">
                  <ErrorBoundary>
                    <TaskList
                      selectedTaskId={selectedTaskId}
                      onSelectTask={handleTaskSelect}
                      onBackToProjects={() => checkUnsavedChanges(() => setHasValidFile(false))}
                    />
                  </ErrorBoundary>
                </div>
                <div className="app-content">
                  <ErrorBoundary>
                    <EditorPanel />
                  </ErrorBoundary>
                </div>
              </Flex>
            )}
            <ToasterComponent />
            <UnsavedChangesModal
              open={showUnsavedModal}
              onClose={handleCancelNavigation}
              onSave={handleSaveAndContinue}
              onDiscard={handleDiscardChanges}
            />
          </div>
        </ErrorBoundary>
      </ToasterProvider>
    </ThemeProvider>
  );
};

const MemoizedAppContent = React.memo(AppContent);

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <EditorProvider>
        <MemoizedAppContent />
      </EditorProvider>
    </Provider>
  );
};
