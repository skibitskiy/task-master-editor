import type { CustomModel } from '@app/shared';
import { Alert, Button, Card, Flex, Label, Modal, Text, TextInput } from '@gravity-ui/uikit';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { addCustomModel, removeCustomModel } from '../../redux/settingsSlice';
import { type AppDispatch, type RootState } from '../../redux/store';
import { type GptConfig, gptService } from '../../services/gpt-service';
import { notifyError, notifySuccess } from '../../utils/notify';
import { ModelSelector } from '../model-selector';
import styles from './styles.module.css';

interface GptSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export const GptSettingsModal: React.FC<GptSettingsModalProps> = ({ open, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const customModels = useSelector((state: RootState) => state.settings.data.customModels || []);

  const [apiKey, setApiKey] = useState(() => gptService.config.apiKey);
  const [model, setModel] = useState(() => gptService.config.model);
  const [baseUrl, setBaseUrl] = useState(() => gptService.config.baseUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [customModelValue, setCustomModelValue] = useState('');
  const isDirtyRef = useRef(false);

  useEffect(() => {
    if (!open) {
      isDirtyRef.current = false;
      return;
    }

    setTestResult(null);
    isDirtyRef.current = false;

    const unsubscribe = gptService.subscribe((config) => {
      if (isDirtyRef.current) {
        return;
      }

      setApiKey(config.apiKey);
      setModel(config.model);
      if (config) {
        setBaseUrl(config.baseUrl);
      } else {
        setBaseUrl('');
      }
    });

    return unsubscribe;
  }, [open]);

  const handleSave = () => {
    if (!apiKey.trim()) {
      notifyError('Ошибка', 'API ключ не может быть пустым');
      return;
    }

    const config: GptConfig = {
      apiKey: apiKey.trim(),
      model,
      baseUrl: baseUrl.trim(),
    };

    try {
      gptService.setConfig(config);

      notifySuccess('Настройки сохранены', 'Конфигурация GPT успешно сохранена');
      onClose();
    } catch (error) {
      notifyError('Ошибка сохранения', 'Не удалось сохранить настройки GPT');
    }
  };

  const handleApiKeyChange = (value: string) => {
    isDirtyRef.current = true;
    setApiKey(value);
  };

  const handleModelChange = (value: string) => {
    isDirtyRef.current = true;
    setModel(value);
  };

  const handleBaseUrlChange = (value: string) => {
    isDirtyRef.current = true;
    setBaseUrl(value);
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'API ключ не может быть пустым' });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    const tempConfig: GptConfig = {
      apiKey: apiKey.trim(),
      model,
      baseUrl: baseUrl.trim() || '',
    };

    const originalConfig = gptService.config;
    gptService.setConfig(tempConfig, { notify: false, persist: false });

    try {
      await gptService.makeRequest({
        markup: 'Test message',
        promptData: 'test',
      });

      setTestResult({ success: true, message: 'Соединение успешно!' });
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Ошибка соединения',
      });
    } finally {
      gptService.setConfig(originalConfig, { notify: false, persist: false });
      setIsLoading(false);
    }
  };

  const handleAddCustomModel = async () => {
    if (!customModelValue.trim()) {
      notifyError('Ошибка', 'Идентификатор модели не может быть пустым');
      return;
    }

    const newModel: CustomModel = {
      id: Date.now().toString(),
      name: customModelValue.trim(),
      value: customModelValue.trim(),
    };

    try {
      await dispatch(addCustomModel(newModel)).unwrap();
      setCustomModelValue('');
      notifySuccess('Модель добавлена', `Модель "${newModel.name}" успешно добавлена`);
    } catch (error) {
      notifyError('Ошибка', 'Не удалось добавить модель');
      console.error('Failed to add custom model:', error);
    }
  };

  const handleRemoveCustomModel = async (modelId: string) => {
    try {
      await dispatch(removeCustomModel(modelId)).unwrap();
      notifySuccess('Модель удалена', 'Пользовательская модель удалена');
    } catch (error) {
      notifyError('Ошибка', 'Не удалось удалить модель');
      console.error('Failed to remove custom model:', error);
    }
  };

  const isConfigured = gptService.isConfigured();

  return (
    <Modal open={open} onClose={onClose}>
      <Card className={styles.card} view="outlined" size="l">
        <Flex direction="column" gap={4}>
          <Flex direction="column" gap={2}>
            <Text variant="header-2">Настройки OpenRouter</Text>
            <Text variant="body-1" color="secondary">
              OpenRouter предоставляет доступ к различным ИИ моделям через единый API. Получите ключ на
              https://openrouter.ai/keys
            </Text>
          </Flex>

          {isConfigured && (
            <Alert
              theme="success"
              title="OpenRouter настроен"
              className={styles.alert}
              message="Ассистент готов к использованию"
            />
          )}

          <Flex direction="column" gap={4}>
            <Flex direction="column" gap={2}>
              <Text variant="subheader-1">API ключ *</Text>
              <TextInput
                placeholder="sk-or-v1-..."
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                type="password"
                size="l"
              />
            </Flex>

            <Flex direction="column" gap={2}>
              <Text variant="subheader-1">Модель</Text>
              <ModelSelector value={model} onUpdate={handleModelChange} size="l" width="max" />
            </Flex>

            <Flex direction="column" gap={2}>
              <Text variant="subheader-1">Base URL (опционально)</Text>
              <TextInput
                placeholder="https://openrouter.ai/api/v1"
                value={baseUrl}
                onChange={(e) => handleBaseUrlChange(e.target.value)}
                size="l"
              />
            </Flex>

            {/* Custom Models Section */}
            <Flex direction="column" gap={2} className={styles.customModelsSection}>
              <Text variant="subheader-1">Пользовательские модели</Text>
              <Flex direction="column" gap={4}>
                <TextInput
                  placeholder="Идентификатор модели"
                  value={customModelValue}
                  onChange={(e) => setCustomModelValue(e.target.value)}
                  size="l"
                  endContent={
                    <Button onClick={handleAddCustomModel} view="action" size="m" disabled={!customModelValue.trim()}>
                      Добавить модель
                    </Button>
                  }
                />
                {customModels.length > 0 && (
                  <Flex wrap>
                    {customModels.map((customModel) => (
                      <Label
                        key={customModel.id}
                        size="s"
                        type="close"
                        className={styles.modelLabel}
                        onCloseClick={() => handleRemoveCustomModel(customModel.id)}
                      >
                        {customModel.name}
                      </Label>
                    ))}
                  </Flex>
                )}
              </Flex>
            </Flex>

            {testResult && (
              <Alert
                theme={testResult.success ? 'success' : 'danger'}
                title={testResult.success ? 'Тест пройден' : 'Ошибка теста'}
                className={styles.testAlert}
                message={testResult.message}
              />
            )}

            <Flex gap={3} className={styles.buttonGroup}>
              <Button onClick={handleTest} loading={isLoading} disabled={!apiKey.trim()} view="outlined" size="l">
                Тестировать
              </Button>

              <Button onClick={handleSave} disabled={!apiKey.trim()} view="action" size="l">
                Сохранить
              </Button>

              <Button onClick={onClose} view="normal" size="l">
                Отмена
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </Card>
    </Modal>
  );
};
