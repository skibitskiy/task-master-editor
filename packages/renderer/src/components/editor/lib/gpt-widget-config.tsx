import type { GptWidgetOptions } from '@gravity-ui/markdown-editor';
import { gptService, type GptRequest } from '../../../services/gpt-service';
import { notifyError, notifySuccess } from '../../../utils/notify';

interface GptAnswer {
  rawText: string;
}

interface GptRequestData<T = unknown> {
  markup: string;
  customPrompt?: string;
  promptData?: T;
}

const gptRequestHandler = async ({ markup, customPrompt, promptData }: GptRequestData): Promise<GptAnswer> => {
  try {
    if (!gptService.isConfigured()) {
      throw new Error('GPT не настроен. Пожалуйста, добавьте API ключ в настройках.');
    }

    const gptRequest: GptRequest = {
      markup,
      customPrompt,
      promptData: promptData ?? 'default',
    };

    const response = await gptService.makeRequest(gptRequest);
    return { rawText: response.rawText };
  } catch (error) {
    console.error('GPT request failed:', error);
    throw new Error(error instanceof Error ? error.message : 'Ошибка при обращении к GPT');
  }
};

const renderAnswer = (data: GptAnswer) => {
  return (
    <div style={{ padding: '8px', borderRadius: '4px', backgroundColor: 'var(--g-color-base-float)' }}>
      <div style={{ whiteSpace: 'pre-wrap' }}>{data.rawText}</div>
    </div>
  );
};

export const gptWidgetOptions: GptWidgetOptions<GptAnswer, string> = {
  answerRender: renderAnswer,
  customPromptPlaceholder: 'Введите ваш запрос для GPT...',
  disabledPromptPlaceholder: 'GPT недоступен - настройте API ключ',
  gptAlertProps: {
    showedGptAlert: true,
    onCloseGptAlert: () => {
      // Handle GPT alert close
    },
  },
  promptPresets: [
    {
      hotKey: 'mod+shift+s',
      data: 'summarize',
      display: 'Сократить текст',
      key: 'summarize',
    },
    {
      hotKey: 'mod+shift+e',
      data: 'expand',
      display: 'Расширить текст',
      key: 'expand',
    },
    {
      hotKey: 'mod+shift+i',
      data: 'improve',
      display: 'Улучшить текст',
      key: 'improve',
    },
    {
      hotKey: 'mod+shift+t',
      data: 'translate',
      display: 'Перевести',
      key: 'translate',
    },
  ],
  onCustomPromptApply: async (params) => {
    try {
      return await gptRequestHandler(params);
    } catch (error) {
      notifyError('Ошибка GPT', error instanceof Error ? error.message : 'Неизвестная ошибка');
      throw error;
    }
  },
  onPromptPresetClick: async (params) => {
    try {
      return await gptRequestHandler(params);
    } catch (error) {
      notifyError('Ошибка GPT', error instanceof Error ? error.message : 'Неизвестная ошибка');
      throw error;
    }
  },
  onTryAgain: async (params) => {
    try {
      return await gptRequestHandler(params);
    } catch (error) {
      notifyError('Ошибка GPT', error instanceof Error ? error.message : 'Неизвестная ошибка');
      throw error;
    }
  },
  onApplyResult: (_markup) => {
    notifySuccess('GPT результат применен', 'Текст был обновлен с помощью GPT');
  },
  onUpdate: (event) => {
    if (event?.rawText) {
      // Handle text updates if needed
      console.log('GPT text updated:', event.rawText.length, 'characters');
    }
  },
  // onLike: async () => {
  //   notifySuccess('Спасибо за отзыв', 'Ваша оценка поможет улучшить GPT');
  // },
  // onDislike: async () => {
  //   notifySuccess('Спасибо за отзыв', 'Ваша оценка поможет улучшить GPT');
  // },
  // onClose: () => {
  //   // Handle GPT widget close
  // },
};
