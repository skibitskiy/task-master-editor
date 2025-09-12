import { Button, Flex, Modal, Text, TextInput } from '@gravity-ui/uikit';
import React, { useState } from 'react';

import type { CreateBranchModalProps } from './lib/types';

export const CreateBranchModal: React.FC<CreateBranchModalProps> = ({ open, onClose, onCreate }) => {
  const [branchName, setBranchName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const trimmedName = branchName.trim();

    if (!trimmedName) {
      setError('Название ветки не может быть пустым');
      return;
    }

    if (trimmedName.length < 2) {
      setError('Название ветки должно содержать минимум 2 символа');
      return;
    }

    onCreate(trimmedName);
    handleClose();
  };

  const handleClose = () => {
    setBranchName('');
    setError('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Flex direction="column" gap={4} style={{ padding: '24px', minWidth: '400px' }}>
        <Text variant="header-1">Создать новую ветку</Text>

        <Flex direction="column" gap={2}>
          <Text variant="body-1">Введите название новой ветки:</Text>
          <TextInput
            value={branchName}
            onUpdate={setBranchName}
            onKeyDown={handleKeyDown}
            placeholder="Название ветки"
            size="l"
            autoFocus
            validationState={error ? 'invalid' : undefined}
          />
          {error && (
            <Text variant="caption-2" color="danger">
              {error}
            </Text>
          )}
        </Flex>

        <Flex gap={2} justifyContent="flex-end">
          <Button view="action" size="l" onClick={handleSubmit} disabled={!branchName.trim()}>
            Создать
          </Button>
          <Button view="normal" size="l" onClick={handleClose}>
            Отмена
          </Button>
        </Flex>
      </Flex>
    </Modal>
  );
};
