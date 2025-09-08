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
import './App.css';

const toaster = new Toaster();

export const App: React.FC = () => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize settings and load last file
    store.dispatch(initSettings()).then(() => {
      const state = store.getState();
      const prefs = state.settings.data.preferences as Record<string, unknown> | undefined;
      const mruEnabled = prefs?.mruEnabled ?? true;
      const last = state.settings.data.recentPaths[0];
      
      if (mruEnabled && typeof last === 'string' && last.length > 0) {
        store.dispatch(loadFromPath(last)).then(() => {
          if (last) store.dispatch(updateMRU(last));
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    // Check system theme preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  }, []);

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <ToasterProvider toaster={toaster}>
          <div className="app">
            {isLoading ? (
              <Flex centerContent width="100%" height="100vh">
                <Loader size="l" />
              </Flex>
            ) : (
              <Flex className="app-layout" grow>
                <div className="app-sidebar">
                  <TaskList 
                    selectedTaskId={selectedTaskId}
                    onSelectTask={setSelectedTaskId}
                  />
                </div>
                <div className="app-content">
                  <EditorPanel 
                    taskId={selectedTaskId}
                    onSave={() => {
                      toaster.add({
                        name: 'save-success',
                        title: 'Сохранено',
                        theme: 'success',
                        autoHiding: 2000,
                      });
                    }}
                  />
                </div>
              </Flex>
            )}
            <ToasterComponent />
          </div>
        </ToasterProvider>
      </ThemeProvider>
    </Provider>
  );
};