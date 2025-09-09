import React, { useState } from 'react';
import { Flex, Card, Button, Text, Icon, Spin } from '@gravity-ui/uikit';
import { withIPCErrorHandling } from '../utils/ipcErrorMapper';
import { notifyError } from '../utils/notify';
import { File as FileIcon } from '@gravity-ui/icons';
interface FileSelectionScreenProps {
  onFileSelected: (filePath: string) => void;
}

export const FileSelectionScreen: React.FC<FileSelectionScreenProps> = ({ onFileSelected }) => {
  const [isSelecting, setIsSelecting] = useState(false);

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
    <Flex
      centerContent
      width="100%"
      height="100vh"
      direction="column"
      style={{
        background: 'var(--g-color-base-background)',
      }}
    >
      <Card
        view="outlined"
        type="container"
        size="l"
        style={{
          padding: '40px',
          maxWidth: '480px',
          width: '100%',
          margin: '0 20px',
        }}
      >
        <Flex direction="column" centerContent gap={6}>
          {/* Icon */}
          <div
            style={{
              padding: '20px',
              borderRadius: '50%',
              backgroundColor: 'var(--g-color-base-info-light)',
              color: 'var(--g-color-text-info)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileIcon />
          </div>

          {/* Title */}
          <Text variant="header-2" style={{ textAlign: 'center' }}>
            Выберите файл задач
          </Text>

          {/* Description */}
          <Text variant="body-2" color="secondary" style={{ textAlign: 'center', maxWidth: '360px' }}>
            Для начала работы выберите существующий файл tasks.json или создайте новый проект с помощью Task Master CLI
          </Text>

          {/* Select button */}
          <Button
            view="action"
            size="l"
            onClick={handleSelectFile}
            disabled={isSelecting}
            style={{ minWidth: '160px' }}
          >
            {isSelecting ? (
              <Flex
                style={{
                  position: 'relative',
                  bottom: '-2px',
                  display: 'inline-flex',
                  paddingRight: '8px',
                }}
                justifyContent="center"
                alignItems="center"
              >
                <Spin size="xs" />
              </Flex>
            ) : (
              <Icon data={FileIcon} size={18} />
            )}
            {isSelecting ? <Text>Выбор файла...</Text> : <Text>Выбрать файл</Text>}
          </Button>

          {/* Help text */}
          <Text variant="caption-2" color="hint" style={{ textAlign: 'center', maxWidth: '360px' }}>
            Поддерживаются файлы tasks.json, созданные с помощью Task Master CLI
          </Text>
        </Flex>
      </Card>
    </Flex>
  );
};
