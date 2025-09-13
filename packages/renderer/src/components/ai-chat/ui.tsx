import { FaceRobot, PaperPlane } from '@gravity-ui/icons';
import { Button, Flex, Icon, Text } from '@gravity-ui/uikit';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { useOutsideClick } from '@/shared/hooks';

import { addMessageToChat, createChat, loadChats, selectChatLoaded, selectCurrentChat } from '../../redux/chatSlice';
import { selectDataPath } from '../../redux/dataSlice';
import { useAppDispatch } from '../../redux/store';
import { ChatMessage, gptService } from '../../services/gpt-service';
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from '../chat-bubble';
import { ChatHistoryControls } from '../chat-history-controls';
import { ChatInput } from '../chat-input';
import { ChatMessageList } from '../chat-message-list';
import { ExpandableChat, ExpandableChatBody, ExpandableChatFooter, ExpandableChatHeader } from '../expandable-chat';
import { MarkdownMessage } from '../markdown-message';
import styles from './styles.module.css';

const AiChat: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentChat = useSelector(selectCurrentChat);
  const chatLoaded = useSelector(selectChatLoaded);
  const projectPath = useSelector(selectDataPath);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load chats when project path changes
  useEffect(() => {
    if (projectPath && !chatLoaded) {
      dispatch(loadChats(projectPath));
    }
  }, [projectPath, chatLoaded, dispatch]);

  // Create first chat if none exists
  useEffect(() => {
    if (chatLoaded && projectPath && !currentChat) {
      dispatch(createChat({ projectPath, name: 'New Chat' }));
    }
  }, [chatLoaded, projectPath, currentChat, dispatch]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || !currentChat) {
      return;
    }

    setInput('');
    setIsLoading(true);

    // Add user message to current chat
    await dispatch(
      addMessageToChat({
        chatId: currentChat.id,
        content: messageText,
        sender: 'user',
      }),
    );

    try {
      if (gptService.isConfigured()) {
        // Преобразуем историю сообщений в формат для GPT
        const chatHistory: ChatMessage[] = currentChat.messages.map((msg) => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content,
        }));

        // Add current user message to history
        chatHistory.push({
          role: 'user',
          content: messageText,
        });

        const response = await gptService.makeRequest({
          markup: messageText,
          customPrompt: '',
          promptData: 'chat',
          messages: chatHistory,
        });

        // Add AI response to current chat
        await dispatch(
          addMessageToChat({
            chatId: currentChat.id,
            content: response.rawText,
            sender: 'ai',
          }),
        );
      } else {
        // Add error message
        await dispatch(
          addMessageToChat({
            chatId: currentChat.id,
            content: 'AI не настроен. Пожалуйста, настройте API ключ в настройках GPT.',
            sender: 'ai',
          }),
        );
      }
    } catch (error) {
      console.error('AI Chat error:', error);
      // Add error message to chat
      await dispatch(
        addMessageToChat({
          chatId: currentChat.id,
          content: 'Произошла ошибка при получении ответа от AI. Попробуйте еще раз.',
          sender: 'ai',
        }),
      );
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

  const handleNewChat = () => {
    // Chat creation is handled by ChatHistoryControls
    setInput('');
  };

  const chatHistorySelectRef = useRef<HTMLDivElement>(null);

  // expandable chat props
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => setIsOpen(!isOpen);

  useOutsideClick({
    refs: [containerRef, chatHistorySelectRef],
    handler: () => {
      if (isOpen) {
        setIsOpen(false);
      }
    },
  });

  // Don't render if no project is loaded
  if (!projectPath) {
    return null;
  }

  const messages = currentChat?.messages || [];

  return (
    <ExpandableChat
      isOpen={isOpen}
      toggleChat={toggleChat}
      containerRef={containerRef}
      size="lg"
      position="bottom-right"
      icon={FaceRobot}
    >
      <ExpandableChatHeader className={styles.header}>
        <Flex width={'100%'} alignItems="center" justifyContent="space-between" gap={3}>
          <Text variant="header-2">Чат с AI ✨</Text>
          <ChatHistoryControls
            chatHistorySelectRef={chatHistorySelectRef}
            onNewChat={handleNewChat}
            toggleChat={toggleChat}
          />
        </Flex>
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
            <Button type="submit" size="xl" disabled={!input.trim() || isLoading}>
              <Icon data={PaperPlane} size={24} />
            </Button>
          </Flex>
        </form>
      </ExpandableChatFooter>
    </ExpandableChat>
  );
};

export { AiChat };
