import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';

export interface GptConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
}

export interface GptResponse {
  rawText: string;
}

export interface GptRequest {
  markup: string;
  customPrompt?: string;
  promptData: unknown;
  messages?: ChatMessage[];
}

type ConfigListener = (config: GptConfig) => void;

const DEFAULT_GPT_MODEL = 'anthropic/claude-3.5-sonnet';
const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';

interface SetConfigOptions {
  notify?: boolean;
  persist?: boolean;
}

export enum ChatRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

class GptService {
  private _config: GptConfig | null = null;
  private listeners = new Set<ConfigListener>();

  constructor() {
    this.loadConfigFromStorage();
  }

  private loadConfigFromStorage() {
    try {
      const stored = localStorage.getItem('gptConfig');
      if (stored) {
        const parsed: GptConfig = JSON.parse(stored);
        this.setConfig(parsed, { persist: false });
      }
    } catch (error) {
      console.warn('Failed to load GPT config from localStorage:', error);
    }
  }

  setConfig(config: GptConfig | null, options?: SetConfigOptions) {
    this.config = config;

    const shouldPersist = options?.persist ?? true;
    if (shouldPersist) {
      if (config) {
        localStorage.setItem('gptConfig', JSON.stringify(config));
      } else {
        localStorage.removeItem('gptConfig');
      }
    }

    const shouldNotify = options?.notify ?? true;
    if (shouldNotify) {
      this.notifyListeners();
    }
  }

  setModel(model: string) {
    this.config = {
      ...this.config,
      model,
    };
  }

  get config(): GptConfig {
    const model = this._config?.model || DEFAULT_GPT_MODEL;
    const apiKey = this._config?.apiKey || '';
    const baseUrl = this._config?.baseUrl || DEFAULT_BASE_URL;

    return {
      apiKey,
      model,
      baseUrl,
    };
  }

  set config(config: GptConfig | null) {
    this._config = config;
  }

  subscribe(listener: ConfigListener): () => void {
    this.listeners.add(listener);

    try {
      listener(this.config);
    } catch (error) {
      console.error('GPT config listener failed:', error);
    }

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.config);
      } catch (error) {
        console.error('GPT config listener failed:', error);
      }
    });
  }

  async makeRequest({ markup, customPrompt, promptData, messages }: GptRequest): Promise<GptResponse> {
    if (!this.config?.apiKey) {
      throw new Error('API ключ не настроен');
    }

    try {
      if (messages && messages.length > 0) {
        return await this.makeOpenRouterChatRequest(messages, markup);
      } else {
        const prompt = this.buildPrompt(markup, customPrompt, promptData);
        return await this.makeOpenRouterRequest(prompt);
      }
    } catch (error) {
      console.error('OpenRouter request failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Ошибка при обращении к OpenRouter API');
    }
  }

  private buildPrompt(markup: string, customPrompt?: string, promptData?: unknown): string {
    if (customPrompt) {
      return `${customPrompt}\n\nТекст для обработки:\n${markup}`;
    }

    let systemPrompt = '';
    switch (promptData) {
      case 'summarize':
        systemPrompt = 'Сократи следующий текст, сохранив основную суть и ключевые моменты:';
        break;
      case 'expand':
        systemPrompt = 'Расширь следующий текст, добавив дополнительные детали, контекст и объяснения:';
        break;
      case 'improve':
        systemPrompt = 'Улучши следующий текст, сделав его более ясным, структурированным и читаемым:';
        break;
      case 'translate':
        systemPrompt = 'Переведи следующий текст на английский язык:';
        break;
      default:
        systemPrompt = 'Обработай следующий текст:';
    }

    return `${systemPrompt}\n\n${markup}`;
  }

  private async makeOpenRouterRequest(prompt: string): Promise<GptResponse> {
    const openrouter = createOpenRouter({ apiKey: this.config!.apiKey });

    const result = streamText({
      model: openrouter.chat(this.config!.model),
      prompt,
      temperature: 0.7,
    });

    let output = '';
    for await (const chunk of result.textStream) {
      output += chunk;
    }

    if (!output.trim()) {
      throw new Error('GPT вернул пустой ответ');
    }

    return { rawText: output.trim() };
  }

  private async makeOpenRouterChatRequest(messages: ChatMessage[], newMessage: string): Promise<GptResponse> {
    const openrouter = createOpenRouter({ apiKey: this.config!.apiKey });

    const chatMessages = [
      {
        role: 'system' as const,
        content: 'Ты полезный ассистент, который помогает пользователям с их задачами. Отвечай на русском языке.',
      },
      ...messages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: newMessage },
    ];

    const result = streamText({
      model: openrouter.chat(this.config!.model),
      messages: chatMessages,
      temperature: 0.7,
    });

    let output = '';
    for await (const chunk of result.textStream) {
      output += chunk;
    }

    if (!output.trim()) {
      throw new Error('GPT вернул пустой ответ');
    }

    return { rawText: output.trim() };
  }

  isConfigured(): boolean {
    return this.config !== null && this.config.apiKey.length > 0;
  }
}

export const gptService = new GptService();
