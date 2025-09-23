import { isNil, isTaskField, TaskField } from '@app/shared';
import { FaceRobot, PaperPlane } from '@gravity-ui/icons';
import { Button, Flex, Icon, Text } from '@gravity-ui/uikit';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useSelector, useStore } from 'react-redux';

import { findTask } from '@/redux/task/lib';
import { useOutsideClick } from '@/shared/hooks';
import { parseRichTextToPlain } from '@/shared/lib';

import {
  addMessageToChat,
  clearChats,
  createChat,
  loadChats,
  selectChatLoaded,
  selectCurrentChat,
} from '../../redux/chatSlice';
import { selectDataPath } from '../../redux/dataSlice';
import { RootState, useAppDispatch } from '../../redux/store';
import { ChatMessage, ChatRole, gptService } from '../../services/gpt-service';
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from '../chat-bubble';
import { ChatHistoryControls } from '../chat-history-controls';
import { ChatMessageList } from '../chat-message-list';
import { ExpandableChat, ExpandableChatBody, ExpandableChatFooter, ExpandableChatHeader } from '../expandable-chat';
import { GptSettingsModal } from '../gpt-settings';
import { MarkdownMessage } from '../markdown-message';
import { ModelSelector } from '../model-selector';
import { TiptapEditor, TiptapEditorRef } from '../tiptap-editor';
import styles from './styles.module.css';

const AiChat: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentChat = useSelector(selectCurrentChat);
  const chatLoaded = useSelector(selectChatLoaded);
  const projectPath = useSelector(selectDataPath);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gptSettingsOpen, setGptSettingsOpen] = useState(false);
  const tiptapEditorRef = useRef<TiptapEditorRef>(null);
  const store = useStore<RootState>();

  // Clear chats when project path changes
  useEffect(() => {
    dispatch(clearChats());
  }, [projectPath, dispatch]);

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

    const text = parseRichTextToPlain(messageText, resolveMention);

    setInput('');
    setIsLoading(true);

    try {
      if (gptService.isConfigured()) {
        // Формируем историю для GPT (БЕЗ нового сообщения - оно добавится в gpt-service)
        const chatHistory: ChatMessage[] = currentChat.messages.map((msg) => ({
          role: msg.sender === ChatRole.USER ? ChatRole.USER : ChatRole.ASSISTANT,
          content: msg.content,
        }));

        // Добавляем сообщение пользователя в чат
        await dispatch(
          addMessageToChat({
            chatId: currentChat.id,
            content: text,
            sender: 'user',
          }),
        );

        const response = await gptService.makeRequest({
          markup: text,
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

  const resolveMention = (id: string) => {
    if (!isTaskField(id)) {
      return id;
    }

    const task = findTask({
      taskId: store.getState().task.selectedTaskId,
      tasksFile: store.getState().data.tasksFile,
      currentBranch: store.getState().data.currentBranch,
    });

    console.log('resolveMention', id);

    const map = {
      [TaskField.TITLE]: task?.title,
      [TaskField.DESCRIPTION]: task?.description,
      [TaskField.DETAILS]: task?.details,
      [TaskField.DEPENDENCIES]: task?.dependencies,
      [TaskField.TEST_STRATEGY]: task?.testStrategy,
      [TaskField.PRIORITY]: task?.priority,
      [TaskField.ID]: task?.id,
      [TaskField.STATUS]: task?.status,
    };

    return isNil(map[id]) ? '' : String(map[id]);
  };

  const handleEnterPress = async (value: string) => {
    const text = parseRichTextToPlain(value, resolveMention);
    await sendMessage(text);
  };

  const handleNewChat = () => {
    // Chat creation is handled by ChatHistoryControls
    setInput('');
  };

  const chatHistorySelectRef = useRef<HTMLDivElement>(null);

  // expandable chat props
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsFullscreen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      tiptapEditorRef.current?.focus();
    }
  }, [isOpen]);

  const toggleChat = () => setIsOpen(!isOpen);
  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const suggestPopupRef = useRef<HTMLDivElement>(null);
  const modelSelectorPopupRef = useRef<HTMLDivElement>(null);

  useOutsideClick({
    refs: [containerRef, chatHistorySelectRef, suggestPopupRef, modelSelectorPopupRef],
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
      size={isFullscreen ? 'full' : 'lg'}
      position="bottom-right"
      icon={FaceRobot}
      isFullscreen={isFullscreen}
    >
      <ExpandableChatHeader className={styles.header}>
        <Flex width={'100%'} alignItems="center" justifyContent="space-between" gap={3}>
          <Text variant="header-2">Чат с AI ✨</Text>
          <ChatHistoryControls
            chatHistorySelectRef={chatHistorySelectRef}
            onNewChat={handleNewChat}
            toggleChat={toggleChat}
            toggleFullscreen={toggleFullscreen}
            onSettingsClick={() => setGptSettingsOpen(true)}
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
            <TiptapEditor
              value={input}
              onChange={setInput}
              onEnterPress={handleEnterPress}
              placeholder="Введите сообщение..."
              suggestPopupRef={suggestPopupRef}
              disabled={isLoading}
              ref={tiptapEditorRef}
            />
          </div>
          <Flex gap={4} alignItems="center" justifyContent={'space-between'}>
            <Flex basis={'250px'}>
              <ModelSelector size="l" popupRef={modelSelectorPopupRef} />
            </Flex>
            <Button type="submit" size="l" disabled={!input.trim() || isLoading}>
              <Icon data={PaperPlane} size={24} />
            </Button>
          </Flex>
        </form>
      </ExpandableChatFooter>

      <GptSettingsModal open={gptSettingsOpen} onClose={() => setGptSettingsOpen(false)} />
    </ExpandableChat>
  );
};

export { AiChat };
