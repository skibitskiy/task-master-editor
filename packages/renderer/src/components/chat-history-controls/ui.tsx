import { ClockArrowRotateLeft, Pencil, Plus, TrashBin, Xmark } from '@gravity-ui/icons';
import { Button, DropdownMenu, Icon, TextInput } from '@gravity-ui/uikit';
import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { createChat, deleteChat, selectChats, setCurrentChat, updateChatName } from '../../redux/chatSlice';
import { selectDataPath } from '../../redux/dataSlice';
import { useAppDispatch } from '../../redux/store';
import styles from './styles.module.css';

interface ChatHistoryControlsProps {
  onNewChat?: () => void;
  chatHistorySelectRef?: React.RefObject<HTMLDivElement | null>;
  toggleChat: () => void;
}

export const ChatHistoryControls: React.FC<ChatHistoryControlsProps> = ({
  onNewChat,
  chatHistorySelectRef,
  toggleChat,
}) => {
  const dispatch = useAppDispatch();
  const chats = useSelector(selectChats);
  const projectPath = useSelector(selectDataPath);

  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [originalName, setOriginalName] = useState('');

  const handleCreateChat = async () => {
    if (projectPath) {
      const result = await dispatch(createChat({ projectPath }));
      if (result.meta.requestStatus === 'fulfilled') {
        onNewChat?.();
      }
    }
  };

  const handleSelectChat = useCallback(
    (chatId: string) => {
      dispatch(setCurrentChat(chatId));
    },
    [dispatch],
  );

  const handleStartEdit = (chatId: string, currentName: string) => {
    setEditingChatId(chatId);
    setEditName(currentName);
    setOriginalName(currentName);
  };

  const handleFinishEdit = useCallback(() => {
    if (editingChatId) {
      const trimmedName = editName.trim();
      if (trimmedName && trimmedName !== originalName) {
        dispatch(updateChatName({ chatId: editingChatId, name: trimmedName }));
      } else if (!trimmedName) {
        // Если имя пустое, восстанавливаем оригинальное имя
        setEditName(originalName);
        dispatch(updateChatName({ chatId: editingChatId, name: originalName }));
      }
    }
    setEditingChatId(null);
    setEditName('');
    setOriginalName('');
  }, [dispatch, editingChatId, editName, originalName]);

  const handleCancelEdit = useCallback(() => {
    setEditingChatId(null);
    setEditName('');
    setOriginalName('');
  }, []);

  const handleNameChange = useCallback((value: string) => {
    setEditName(value);
  }, []);

  const handleDeleteChat = useCallback(
    (chatId: string) => {
      dispatch(deleteChat(chatId));
    },
    [dispatch],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleFinishEdit();
      } else if (e.key === 'Escape') {
        handleCancelEdit();
      }
    },
    [handleFinishEdit, handleCancelEdit],
  );

  const dropdownItems = useMemo(() => {
    if (chats.length === 0) {
      return [
        {
          text: <div className={styles.emptyState}>Нет сохранённых чатов</div>,
          disabled: true,
          action: () => {},
        },
      ];
    }

    return chats.map((chat) => ({
      text: (
        <div key={chat.id} className={styles.chatItem} onClick={() => handleSelectChat(chat.id)}>
          {editingChatId === chat.id ? (
            <TextInput
              className={styles.editInput}
              value={editName}
              onUpdate={handleNameChange}
              onKeyDown={handleKeyDown}
              onBlur={handleFinishEdit}
              autoFocus
              size="s"
            />
          ) : (
            <span className={styles.chatName} title={chat.name}>
              {chat.name}
            </span>
          )}

          {editingChatId !== chat.id && (
            <div className={styles.chatActions}>
              <Button
                view="flat"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartEdit(chat.id, chat.name);
                }}
              >
                <Icon data={Pencil} size={14} />
              </Button>
              <Button
                view="flat"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteChat(chat.id);
                }}
              >
                <Icon data={TrashBin} size={14} />
              </Button>
            </div>
          )}
        </div>
      ),
      action: () => {
        if (editingChatId !== chat.id) {
          handleSelectChat(chat.id);
        }
      },
    }));
  }, [
    chats,
    editingChatId,
    editName,
    handleNameChange,
    handleKeyDown,
    handleFinishEdit,
    handleSelectChat,
    handleDeleteChat,
  ]);

  return (
    <div className={styles.controls}>
      <Button view="flat" size="m" onClick={handleCreateChat} title="Создать новый чат">
        <Icon data={Plus} size={16} />
      </Button>

      <DropdownMenu
        size="m"
        items={dropdownItems}
        popupProps={{
          className: styles.dropdown,
          floatingRef: chatHistorySelectRef,
        }}
        renderSwitcher={({ onClick, onKeyDown }) => (
          <Button view="flat" size="m" onClick={onClick} onKeyDown={onKeyDown} title="История чатов">
            <Icon data={ClockArrowRotateLeft} size={16} />
          </Button>
        )}
      />
      <Button view="flat" size="m" className={styles.mobileCloseButton} onClick={toggleChat}>
        <Icon data={Xmark} size={16} />
      </Button>
    </div>
  );
};
