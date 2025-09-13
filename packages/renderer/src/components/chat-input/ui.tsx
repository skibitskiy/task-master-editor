import { TextArea } from '@gravity-ui/uikit';
import React from 'react';

interface ChatInputProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onEnterPress?: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
}

const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({ onEnterPress, onKeyDown, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Отправка сообщения по Enter
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && onEnterPress) {
        e.preventDefault();
        onEnterPress((e.target as HTMLTextAreaElement).value);
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        // Перенос строки по Ctrl/Cmd + Enter
        e.preventDefault();
        const textarea = e.target as HTMLTextAreaElement;
        const { selectionStart, selectionEnd, value } = textarea;
        const newValue = value.substring(0, selectionStart) + '\n' + value.substring(selectionEnd);

        // Обновляем значение через onChange если оно передано
        if (props.onChange) {
          const syntheticEvent = {
            target: { value: newValue },
            currentTarget: { value: newValue },
          } as React.ChangeEvent<HTMLTextAreaElement>;
          props.onChange(syntheticEvent);
        }

        // Устанавливаем курсор после переноса строки
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
        }, 0);
      }
      onKeyDown?.(e);
    };

    return <TextArea view="clear" controlRef={ref} size="l" maxRows={10} onKeyDown={handleKeyDown} {...props} />;
  },
);

ChatInput.displayName = 'ChatInput';

export { ChatInput };
