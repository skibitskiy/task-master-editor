import React, { useState } from 'react';
import { Flex, Card, Button, Text, Icon, Loader } from '@gravity-ui/uikit';
import { withIPCErrorHandling } from '../utils/ipcErrorMapper';
import { notifyError } from '../utils/notify';

interface FileSelectionScreenProps {
  onFileSelected: (filePath: string) => void;
}

// File icon SVG - simple document icon
const FileIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="m14,2 l0,6 l6,0"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

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
        <Flex direction="column" centerContent space="6">
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
          <Text
            variant="body-2"
            color="secondary"
            style={{ textAlign: 'center', maxWidth: '360px' }}
          >
            Для начала работы выберите существующий файл tasks.json или создайте новый проект с
            помощью Task Master CLI
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
              <Flex alignItems="center" space="2">
                <Loader size="s" />
                <Text>Выбор файла...</Text>
              </Flex>
            ) : (
              <>
                <Icon data={FileIcon} size={18} />
                Выбрать файл
              </>
            )}
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
