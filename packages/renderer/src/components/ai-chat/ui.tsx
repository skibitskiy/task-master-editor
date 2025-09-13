import { FaceRobot, PaperPlane } from '@gravity-ui/icons';
import { Button, Flex, Icon, Text } from '@gravity-ui/uikit';
import { FormEvent, useState } from 'react';

import { ChatMessage, gptService } from '../../services/gpt-service';
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from '../chat-bubble';
import { ChatInput } from '../chat-input';
import { ChatMessageList } from '../chat-message-list';
import { ExpandableChat, ExpandableChatBody, ExpandableChatFooter, ExpandableChatHeader } from '../expandable-chat';
import { MarkdownMessage } from '../markdown-message';
import styles from './styles.module.css';

interface Message {
  id: number;
  content: string;
  sender: 'user' | 'ai';
}

const AiChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: 'Привет! Чем могу помочь?',
      sender: 'ai',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) {
      return;
    }

    const newMessage: Message = {
      id: messages.length + 1,
      content: messageText,
      sender: 'user',
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (gptService.isConfigured()) {
        // Преобразуем историю сообщений в формат для GPT
        const chatHistory: ChatMessage[] = messages.map((msg) => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content,
        }));

        const response = await gptService.makeRequest({
          markup: messageText,
          customPrompt: '',
          promptData: 'chat',
          messages: chatHistory,
        });

        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            content: response.rawText,
            sender: 'ai',
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            content: 'AI не настроен. Пожалуйста, настройте API ключ в настройках GPT.',
            sender: 'ai',
          },
        ]);
      }
    } catch (error) {
      console.error('AI Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          content: 'Произошла ошибка при получении ответа от AI. Попробуйте еще раз.',
          sender: 'ai',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
  };

  const handleEnterPress = async (value: string) => {
    await sendMessage(value);
  };

  return (
    <ExpandableChat size="lg" position="bottom-right" icon={FaceRobot}>
      <ExpandableChatHeader className={styles.header}>
        <Text variant="header-2">Чат с AI ✨</Text>
      </ExpandableChatHeader>

      <ExpandableChatBody>
        <ChatMessageList>
          {messages.map((message) => (
            <ChatBubble key={message.id} variant={message.sender === 'user' ? 'sent' : 'received'}>
              <ChatBubbleAvatar className={styles.avatar} fallback={message.sender === 'user' ? 'US' : 'AI'} />
              <ChatBubbleMessage variant={message.sender === 'user' ? 'sent' : 'received'}>
                {message.sender === 'ai' ? <MarkdownMessage>{message.content}</MarkdownMessage> : message.content}
              </ChatBubbleMessage>
            </ChatBubble>
          ))}

          {isLoading && (
            <ChatBubble variant="received">
              <ChatBubbleAvatar className={styles.avatar} fallback="AI" />
              <ChatBubbleMessage isLoading />
            </ChatBubble>
          )}
        </ChatMessageList>
      </ExpandableChatBody>

      <ExpandableChatFooter>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputWrapper}>
            <ChatInput
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onEnterPress={handleEnterPress}
              placeholder="Введите сообщение..."
            />
          </div>
          <Flex alignItems="center" justifyContent="flex-end">
            <Button type="submit" size="xl" disabled={!input.trim()}>
              <Icon data={PaperPlane} size={24} />
            </Button>
          </Flex>
        </form>
      </ExpandableChatFooter>
    </ExpandableChat>
  );
};

export { AiChat };
