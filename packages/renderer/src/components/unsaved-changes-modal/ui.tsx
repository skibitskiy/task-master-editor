import { Button, Flex, Modal, Text } from '@gravity-ui/uikit';
import React from 'react';

import styles from './styles.module.css';

interface UnsavedChangesModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  onDiscard: () => void;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({ open, onClose, onSave, onDiscard }) => {
  return (
    <Modal open={open}>
      <Flex direction="column" gap={4} className={styles.content}>
        <Text variant="header-1">Несохранённые изменения</Text>
        <Text>У вас есть несохранённые изменения. Что вы хотите сделать?</Text>
        <Flex gap={2} justifyContent="flex-end">
          <Button view="action" size="l" onClick={onSave}>
            Сохранить
          </Button>
          <Button view="outlined-danger" size="l" onClick={onDiscard}>
            Не сохранять
          </Button>
          <Button view="normal" size="l" onClick={onClose}>
            Отмена
          </Button>
        </Flex>
      </Flex>
    </Modal>
  );
};
