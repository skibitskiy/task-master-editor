import { CircleXmarkFill, Clock, File as FileIcon } from '@gravity-ui/icons';
import { Button, Card, Flex, Icon, List, Spin, Text } from '@gravity-ui/uikit';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { removeFromMRU } from '../../redux/settingsSlice';
import type { AppDispatch, RootState } from '../../redux/store';
import { withIPCErrorHandling } from '../../utils/ipcErrorMapper';
import { notifyError } from '../../utils/notify';
import styles from './styles.module.css';

interface FileSelectionScreenProps {
  onFileSelected: (filePath: string) => void;
}

export const FileSelectionScreen: React.FC<FileSelectionScreenProps> = ({ onFileSelected }) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const settingsState = useSelector((state: RootState) => state.settings);
  const recentPaths = settingsState.loaded ? settingsState.data.recentPaths : [];
  const prefs = settingsState.loaded
    ? (settingsState.data.preferences as Record<string, unknown> | undefined)
    : undefined;
  const mruEnabled = prefs?.mruEnabled ?? true;

  console.log('🔍 FileSelectionScreen state:', {
    settingsLoaded: settingsState.loaded,
    recentPaths,
    mruEnabled,
    prefs,
  });

  const getProjectName = (filePath: string) => {
    const parts = filePath.split(/[/\\]/);
    const tasksIndex = parts.findIndex((part) => part === 'tasks.json');
    if (tasksIndex > 0) {
      return parts[tasksIndex - 1];
    }
    return parts[parts.length - 2] || 'Проект';
  };

  const handleSelectFile = async () => {
    setIsSelecting(true);

    try {
      const result = await withIPCErrorHandling(async () => {
        const response = await window.api?.workspace.select({
          type: 'file',
          multiple: false,
        });

        if (!response || response.paths.length === 0) {
          return null; // User cancelled
        }

        return response.paths[0];
      }, 'Выбор файла задач');

      if (result) {
        onFileSelected(result);
      }
    } catch (error) {
      notifyError('Ошибка выбора файла', 'Не удалось открыть диалог выбора файла');
    } finally {
      setIsSelecting(false);
    }
  };

  const handleRecentFileSelect = (filePath: string) => {
    onFileSelected(filePath);
  };

  const handleDeleteRecentPath = async (pathToDelete: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent file selection when clicking delete
    console.log('🗑️ Trying to delete path:', pathToDelete);
    try {
      const result = await dispatch(removeFromMRU(pathToDelete));
      console.log('🗑️ Delete result:', result);
    } catch (error) {
      console.error('🗑️ Delete error:', error);
      notifyError('Ошибка удаления', 'Не удалось удалить проект из недавних');
    }
  };

  return (
    <Flex centerContent width="100%" height="100vh" direction="column" className={styles.container}>
      <Card view="outlined" type="container" size="l" className={styles.card}>
        <Flex direction="column" centerContent gap={6}>
          {/* Icon */}
          <div className={styles.iconContainer}>
            <FileIcon />
          </div>

          {/* Title */}
          <Text variant="header-2" className={styles.title}>
            Выберите файл задач
          </Text>

          {/* Description */}
          <Text variant="body-2" color="secondary" className={styles.description}>
            Для начала работы выберите существующий файл tasks.json или создайте новый проект с помощью Task Master CLI
          </Text>

          {/* Recent Projects */}
          {recentPaths.length > 0 && (
            <div className={styles.recentSection}>
              <Flex direction="row" alignItems="center" gap={2} className={styles.recentHeader}>
                <Icon data={Clock} size={16} />
                <Text variant="subheader-1">Недавние проекты</Text>
              </Flex>
              <Card view="outlined" className={styles.recentList}>
                <List
                  filterable={false}
                  itemHeight={60}
                  itemsHeight={160}
                  items={recentPaths.slice(0, 5).map((path, index) => ({
                    id: index.toString(),
                    path,
                  }))}
                  renderItem={({ path }) => (
                    <Flex
                      direction="row"
                      alignItems="center"
                      gap={3}
                      className={styles.recentItem}
                      onClick={() => handleRecentFileSelect(path)}
                    >
                      <Icon data={FileIcon} size={16} />
                      <Flex direction="column" grow>
                        <Text variant="body-2">{getProjectName(path)}</Text>
                        <Text variant="caption-2" color="secondary">
                          {path}
                        </Text>
                      </Flex>
                      <div onClick={(event) => handleDeleteRecentPath(path, event)} className={styles.deleteButton}>
                        <Icon data={CircleXmarkFill} size={16} className={styles.deleteIcon} />
                      </div>
                    </Flex>
                  )}
                />
              </Card>
            </div>
          )}

          {/* Select button */}
          <Button
            view="action"
            size="l"
            onClick={handleSelectFile}
            disabled={isSelecting}
            className={styles.selectButton}
          >
            {isSelecting ? (
              <Flex className={styles.loadingContainer} justifyContent="center" alignItems="center">
                <Spin size="xs" />
              </Flex>
            ) : (
              <Icon data={FileIcon} size={18} />
            )}
            {isSelecting ? <Text>Выбор файла...</Text> : <Text>Выбрать другой файл</Text>}
          </Button>

          {/* Help text */}
          <Text variant="caption-2" color="hint" className={styles.helpText}>
            Поддерживаются файлы tasks.json, созданные с помощью Task Master CLI
          </Text>
        </Flex>
      </Card>
    </Flex>
  );
};
