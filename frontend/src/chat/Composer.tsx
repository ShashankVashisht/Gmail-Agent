import React, { useState } from 'react';
import styles from './Composer.module.css';
import { Button } from '../components/Button';
import { Send } from 'lucide-react';

interface ComposerProps {
  onSend: (message: string) => void;
  isSending: boolean;
  isNewConversation: boolean;
}

export const Composer: React.FC<ComposerProps> = ({ onSend, isSending, isNewConversation }) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim() && !isSending) {
      onSend(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptClick = (prompt: string) => {
    setText(prompt);
  };

  const emptyPrompts = [
    "Show my 5 latest emails",
    "Summarize my unread emails",
    "Draft a reply to the latest email"
  ];

  return (
    <div className={styles.composerWrapper}>
      {isNewConversation && (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>What would you like to do?</p>
          <div className={styles.prompts}>
            {emptyPrompts.map((prompt, i) => (
              <button key={i} className={styles.promptBtn} onClick={() => handlePromptClick(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className={styles.container}>
        <textarea
          className={styles.textarea}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Echo..."
          disabled={isSending}
          rows={Math.min(6, text.split('\n').length || 1)}
          maxLength={4000}
        />
        <div className={styles.controls}>
          <span className={styles.counter}>
            {text.length > 3500 ? `${text.length}/4000` : ''}
          </span>
          <Button 
            className={styles.sendBtn}
            onClick={handleSend} 
            disabled={!text.trim() || isSending}
            aria-label="Send message"
          >
            <Send size={18} strokeWidth={1.5} />
          </Button>
        </div>
      </div>
    </div>
  );
};
