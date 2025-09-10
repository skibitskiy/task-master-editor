import React, { useState } from 'react';
import { Flex, Card, Button, Text, Icon, Spin } from '@gravity-ui/uikit';
import { File as FileIcon } from '@gravity-ui/icons';
import { withIPCErrorHandling } from '../../utils/ipcErrorMapper';
import { notifyError } from '../../utils/notify';
import styles from './styles.module.css';

interface FileSelectionScreenProps {
  onFileSelected: (filePath: string) => void;
}

export const FileSelectionScreen: React.FC<FileSelectionScreenProps> = ({ onFileSelected }) => {
  const [isSelecting, setIsSelecting] = useState(false);

  // Debug: Log API availability
  React.useEffect(() => {
    console.log('🔍 FileSelectionScreen mounted');
    console.log('🔍 window.api available:', !!window.api);
    console.log('🔍 window.api.workspace available:', !!window.api?.workspace);
    console.log('🔍 window.api.workspace.select available:', !!window.api?.workspace?.select);
  }, []);

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
            {isSelecting ? <Text>Выбор файла...</Text> : <Text>Выбрать файл</Text>}
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
