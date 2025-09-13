import { Button, Icon } from '@gravity-ui/uikit';
import React from 'react';

import { ChatAvatar } from '../chat-avatar';
import { MessageLoading } from '../message-loading';
import styles from './styles.module.css';

interface ChatBubbleProps {
  variant?: 'sent' | 'received';
  className?: string;
  children: React.ReactNode;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ variant = 'received', className, children }) => {
  return (
    <div className={`${styles.bubble} ${variant === 'sent' ? styles.sent : styles.received} ${className || ''}`}>
      {children}
    </div>
  );
};

interface ChatBubbleMessageProps {
  variant?: 'sent' | 'received';
  isLoading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const ChatBubbleMessage: React.FC<ChatBubbleMessageProps> = ({
  variant = 'received',
  isLoading,
  className,
  children,
}) => {
  return (
    <div
      className={`${styles.message} ${variant === 'sent' ? styles.sentMessage : styles.receivedMessage} ${
        className || ''
      }`}
    >
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <MessageLoading />
        </div>
      ) : (
        children
      )}
    </div>
  );
};

interface ChatBubbleAvatarProps {
  src?: string;
  fallback?: string;
  className?: string;
}

const ChatBubbleAvatar: React.FC<ChatBubbleAvatarProps> = ({ src, fallback = 'AI', className }) => {
  return <ChatAvatar src={src} fallback={fallback} className={className} />;
};

interface ChatBubbleActionProps {
  icon?: (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element;
  onClick?: () => void;
  className?: string;
}

const ChatBubbleAction: React.FC<ChatBubbleActionProps> = ({ icon, onClick, className }) => {
  return (
    <Button view="flat" size="xs" className={`${styles.action} ${className || ''}`} onClick={onClick}>
      {icon && <Icon data={icon} size={12} />}
    </Button>
  );
};

const ChatBubbleActionWrapper: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className, children }) => {
  return <div className={`${styles.actionWrapper} ${className || ''}`}>{children}</div>;
};

export { ChatBubble, ChatBubbleAction, ChatBubbleActionWrapper, ChatBubbleAvatar, ChatBubbleMessage };
