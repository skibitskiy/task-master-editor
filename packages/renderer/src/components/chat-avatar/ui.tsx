import React from 'react';

import styles from './styles.module.css';

interface ChatAvatarProps {
  src?: string;
  fallback?: string;
  className?: string;
}

const ChatAvatar: React.FC<ChatAvatarProps> = ({ src, fallback = 'AI', className }) => {
  return (
    <div className={`${styles.avatar} ${className || ''}`}>
      {src ? (
        <img src={src} alt={fallback} className={styles.image} />
      ) : (
        <span className={styles.fallback}>{fallback}</span>
      )}
    </div>
  );
};

export { ChatAvatar };
