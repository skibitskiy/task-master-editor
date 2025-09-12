import { Button, Flex, Modal, Text } from '@gravity-ui/uikit';
import React from 'react';

import type { DeleteTaskModalProps } from './lib/types';

export const DeleteTaskModal: React.FC<DeleteTaskModalProps> = ({ open, onClose, onDelete, taskId, taskTitle }) => {
  const handleDelete = () => {
    onDelete();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Flex direction="column" gap={4} style={{ padding: '24px', minWidth: '400px' }}>
        <Text variant="header-1">Удалить задачу</Text>

        <Flex direction="column" gap={2}>
          <Text variant="body-1">Вы уверены, что хотите удалить задачу?</Text>
          <Text variant="body-2" color="secondary">
            <strong>#{taskId}</strong> {taskTitle}
          </Text>
          <Text variant="caption-2" color="danger">
            Это действие нельзя отменить.
          </Text>
        </Flex>

        <Flex gap={2} justifyContent="flex-end">
          <Button view="outlined" size="l" onClick={onClose}>
            Отмена
          </Button>
          <Button view="action" size="l" theme="danger" onClick={handleDelete}>
            Удалить
          </Button>
        </Flex>
      </Flex>
    </Modal>
  );
};
