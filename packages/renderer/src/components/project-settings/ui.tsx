import { Button, Card, Flex, Modal, Text } from '@gravity-ui/uikit';
import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { saveFile } from '../../redux/dataSlice';
import type { AppDispatch, RootState } from '../../redux/store';
import { notifyError } from '../../utils/notify';
import { CustomFieldsSettings } from '../custom-fields-settings';
import styles from './styles.module.css';

interface ProjectSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({ open, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const isDirty = useSelector((state: RootState) => state.data.dirty.file);

  const handleClose = useCallback(async () => {
    // Save file if there are unsaved changes (from custom fields)
    if (isDirty) {
      try {
        await dispatch(saveFile()).unwrap();
      } catch (error) {
        notifyError('Ошибка', 'Не удалось сохранить изменения');
      }
    }
    onClose();
  }, [dispatch, isDirty, onClose]);

  return (
    <Modal open={open} disableOutsideClick onClose={handleClose}>
      <Card className={styles.card} view="outlined" size="l">
        <Flex direction="column" gap={4}>
          <Text variant="header-2">Настройки проекта</Text>
          <Flex direction="column" gap={4}>
            <CustomFieldsSettings />
          </Flex>

          <Flex gap={3} justifyContent="flex-end" className={styles.buttonGroup}>
            <Button onClick={handleClose} view="normal" size="l">
              Закрыть
            </Button>
          </Flex>
        </Flex>
      </Card>
    </Modal>
  );
};
