import DOMPurify from 'dompurify';
import { marked } from 'marked';
import React, { useMemo } from 'react';

import styles from './styles.module.css';

interface MarkdownMessageProps {
  children: string;
  className?: string;
}

const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ children, className }) => {
  const htmlContent = useMemo(() => {
    const markdownHtml = marked.parse(children, {
      breaks: true,
      gfm: true,
    }) as string;
    return DOMPurify.sanitize(markdownHtml);
  }, [children]);

  return <div className={`${styles.message} ${className || ''}`} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};

export { MarkdownMessage };
