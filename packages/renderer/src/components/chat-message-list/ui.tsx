import { ChevronDown } from '@gravity-ui/icons';
import { Button, Icon } from '@gravity-ui/uikit';
import React from 'react';

import { useAutoScroll } from '@/shared/hooks';

import styles from './styles.module.css';

interface ChatMessageListProps extends React.HTMLAttributes<HTMLDivElement> {
  smooth?: boolean;
}

const ChatMessageList = React.forwardRef<HTMLDivElement, ChatMessageListProps>(
  ({ className, children, smooth = false, ...props }, _ref) => {
    const { scrollRef, isAtBottom, scrollToBottom, disableAutoScroll } = useAutoScroll({
      smooth,
      content: children,
    });

    return (
      <div className={styles.container}>
        <div
          className={`${styles.messageList} ${className || ''}`}
          ref={scrollRef}
          onWheel={disableAutoScroll}
          onTouchMove={disableAutoScroll}
          {...props}
        >
          <div className={styles.messageContainer}>{children}</div>
        </div>

        {!isAtBottom && (
          <Button
            onClick={() => {
              scrollToBottom();
            }}
            size="s"
            view="outlined"
            className={styles.scrollButton}
          >
            <Icon data={ChevronDown} size={16} />
          </Button>
        )}
      </div>
    );
  },
);

ChatMessageList.displayName = 'ChatMessageList';

export { ChatMessageList };
