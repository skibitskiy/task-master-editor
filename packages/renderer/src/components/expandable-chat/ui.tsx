import { Comment, Xmark } from '@gravity-ui/icons';
import { Button, Icon, useOutsideClick } from '@gravity-ui/uikit';
import React, { useRef, useState } from 'react';

import styles from './styles.module.css';

export type ChatPosition = 'bottom-right' | 'bottom-left';
export type ChatSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ExpandableChatProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: ChatPosition;
  size?: ChatSize;
  icon?: (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element;
}

const ExpandableChat: React.FC<ExpandableChatProps> = ({
  className,
  position = 'bottom-right',
  size = 'md',
  icon,
  children,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => setIsOpen(!isOpen);

  // Закрывать чат при клике вне его области
  useOutsideClick({
    ref: containerRef as React.RefObject<HTMLElement>,
    handler: () => {
      if (isOpen) {
        setIsOpen(false);
      }
    },
  });

  return (
    <div ref={containerRef} className={`${styles.container} ${styles[position]} ${className || ''}`} {...props}>
      <div
        ref={chatRef}
        className={`${styles.chat} ${styles[size]} ${styles[`chat-${position}`]} ${
          isOpen ? styles.open : styles.closed
        }`}
      >
        {children}
        <Button view="flat" size="m" className={styles.mobileCloseButton} onClick={toggleChat}>
          <Icon data={Xmark} size={16} />
        </Button>
      </div>
      <Button view="action" onClick={toggleChat} className={`${styles.toggle} ${className || ''}`}>
        <Icon data={isOpen ? Xmark : icon || Comment} size={20} />
      </Button>
    </div>
  );
};

ExpandableChat.displayName = 'ExpandableChat';

const ExpandableChatHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={`${styles.header} ${className || ''}`} {...props} />
);

ExpandableChatHeader.displayName = 'ExpandableChatHeader';

const ExpandableChatBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={`${styles.body} ${className || ''}`} {...props} />
);

ExpandableChatBody.displayName = 'ExpandableChatBody';

const ExpandableChatFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={`${styles.footer} ${className || ''}`} {...props} />
);

ExpandableChatFooter.displayName = 'ExpandableChatFooter';

export { ExpandableChat, ExpandableChatBody, ExpandableChatFooter, ExpandableChatHeader };
