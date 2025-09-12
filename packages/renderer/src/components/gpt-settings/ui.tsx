import React, { useState, useEffect } from 'react';
import { Modal, Card, TextInput, Button, Text, Alert, Select, Flex } from '@gravity-ui/uikit';
import { gptService, type GptConfig } from '../../services/gpt-service';
import { notifySuccess, notifyError } from '../../utils/notify';

interface GptSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const MODELS = [
  { value: 'anthropic/claude-3.5-sonnet', content: 'Claude 3.5 Sonnet' },
  { value: 'anthropic/claude-3.5-haiku', content: 'Claude 3.5 Haiku' },
  { value: 'openai/gpt-4o', content: 'GPT-4o' },
  { value: 'openai/gpt-4o-mini', content: 'GPT-4o Mini' },
  { value: 'openai/gpt-4-turbo', content: 'GPT-4 Turbo' },
  { value: 'google/gemini-pro-1.5', content: 'Gemini Pro 1.5' },
  { value: 'meta-llama/llama-3.1-405b-instruct', content: 'Llama 3.1 405B' },
  { value: 'meta-llama/llama-3.1-70b-instruct', content: 'Llama 3.1 70B' },
];

export const GptSettingsModal: React.FC<GptSettingsModalProps> = ({ open, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('anthropic/claude-3.5-sonnet');
  const [baseUrl, setBaseUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load existing configuration on mount
  useEffect(() => {
    if (open) {
      const config = gptService.getConfig();
      if (config) {
        setApiKey(config.apiKey);
        setModel(config.model);
        setBaseUrl(config.baseUrl || '');
      }
      setTestResult(null);
    }
  }, [open]);

  const handleSave = () => {
    if (!apiKey.trim()) {
      notifyError('Ошибка', 'API ключ не может быть пустым');
      return;
    }

    const config: GptConfig = {
      apiKey: apiKey.trim(),
      model,
      baseUrl: baseUrl.trim() || undefined,
    };

    try {
      gptService.setConfig(config);

      // Store configuration in localStorage for persistence
      localStorage.setItem('gptConfig', JSON.stringify(config));

      notifySuccess('Настройки сохранены', 'Конфигурация GPT успешно сохранена');
      onClose();
    } catch (error) {
      notifyError('Ошибка сохранения', 'Не удалось сохранить настройки GPT');
    }
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'API ключ не может быть пустым' });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const tempConfig: GptConfig = {
        apiKey: apiKey.trim(),
        model,
        baseUrl: baseUrl.trim() || undefined,
      };

      // Temporarily set config for test
      const originalConfig = gptService.getConfig();
      gptService.setConfig(tempConfig);

      await gptService.makeRequest({
        markup: 'Test message',
        promptData: 'test',
      });

      setTestResult({ success: true, message: 'Соединение успешно!' });

      // Restore original config if test was successful
      if (originalConfig) {
        gptService.setConfig(originalConfig);
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Ошибка соединения',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    gptService.setConfig({ apiKey: '', model: 'anthropic/claude-3.5-sonnet' });
    localStorage.removeItem('gptConfig');
    setApiKey('');
    setModel('anthropic/claude-3.5-sonnet');
    setBaseUrl('');
    setTestResult(null);
    notifySuccess('Настройки очищены', 'Конфигурация была удалена');
  };

  const isConfigured = gptService.isConfigured();

  return (
    <Modal open={open} onClose={onClose}>
      <Card style={{ padding: '24px' }} view="outlined" size="l">
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
              style={{ marginBottom: '16px' }}
              message="Ассистент готов к использованию"
            />
          )}

          <Flex direction="column" gap={4}>
            <div>
              <Text variant="subheader-1" style={{ marginBottom: '8px' }}>
                API ключ *
              </Text>
              <TextInput
                placeholder="sk-or-v1-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                type="password"
                size="l"
                style={{ width: '100%' }}
              />
              <Text variant="caption-1" color="secondary" style={{ marginTop: '4px' }}>
                Ваш OpenRouter API ключ. Данные хранятся локально и не передаются на сервер.
              </Text>
            </div>

            <div>
              <Text variant="subheader-1" style={{ marginBottom: '8px' }}>
                Модель
              </Text>
              <Select
                placeholder="Выберите модель"
                value={[model]}
                onUpdate={(values) => setModel(values[0])}
                options={MODELS}
                size="l"
                width="max"
              />
            </div>

            <div>
              <Text variant="subheader-1" style={{ marginBottom: '8px' }}>
                Base URL (опционально)
              </Text>
              <TextInput
                placeholder="https://openrouter.ai/api/v1"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                size="l"
                style={{ width: '100%' }}
              />
              <Text variant="caption-1" color="secondary" style={{ marginTop: '4px' }}>
                Оставьте пустым для использования стандартного OpenRouter API
              </Text>
            </div>

            {testResult && (
              <Alert
                theme={testResult.success ? 'success' : 'danger'}
                title={testResult.success ? 'Тест пройден' : 'Ошибка теста'}
                style={{ marginTop: '8px' }}
                message={testResult.message}
              />
            )}

            <Flex gap={3} style={{ marginTop: '16px' }}>
              <Button onClick={handleTest} loading={isLoading} disabled={!apiKey.trim()} view="outlined" size="l">
                Тестировать
              </Button>

              <Button onClick={handleSave} disabled={!apiKey.trim()} view="action" size="l">
                Сохранить
              </Button>

              <Button onClick={handleClear} view="outlined-danger" size="l">
                Очистить
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
