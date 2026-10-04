import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import styles from './MessageList.module.css';
import type { Message } from '../types';

interface MessageListProps {
  messages: Message[];
  isWaiting: boolean;
  onRetry: (messageId: string, content: string) => void;
  onSendAsChat: (messageId: string, content: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isWaiting, onRetry, onSendAsChat }) => {
  // Find the last failed user message to attach actions to the notice
  const lastFailedUserMsg = messages.slice().reverse().find(m => m.role === 'user' && m.status === 'failed');

  return (
    <div className={styles.container} aria-live="polite">
      {messages.map((msg) => {
        if (msg.role === 'notice') {
          return (
            <div key={msg.id} className={`${styles.messageWrapper} ${styles.notice}`}>
              <div className={styles.noticeContent}>
                <p>{msg.content}</p>
                {msg.errorType === 'gmail_409' && (
                  <div className={styles.noticeActions}>
                    <Link to="/settings" className={styles.noticeLink}>Connect Gmail</Link>
                    {lastFailedUserMsg && (
                      <button 
                        className={styles.noticeBtn}
                        onClick={() => onSendAsChat(lastFailedUserMsg.id, lastFailedUserMsg.content)}
                      >
                        Send in Chat mode instead
                      </button>
                    )}
                  </div>
                )}
                {msg.errorType === 'retryable' && lastFailedUserMsg && (
                  <div className={styles.noticeActions}>
                    <button 
                      className={styles.noticeBtn}
                      onClick={() => onRetry(lastFailedUserMsg.id, lastFailedUserMsg.content)}
                    >
                      Retry
                    </button>
                  </div>
                )}
                {/* Generic retry for loading errors */}
                {msg.errorType === 'retryable' && !lastFailedUserMsg && msg.content.includes("Couldn't load") && (
                  <div className={styles.noticeActions}>
                    <button 
                      className={styles.noticeBtn}
                      onClick={() => window.location.reload()}
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        }

        return (
          <div key={msg.id} className={`${styles.messageWrapper} ${styles[msg.role]}`}>
            <div className={styles.messageContent}>
              {msg.role === 'assistant' ? (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              ) : (
                <p>{msg.content}</p>
              )}
              <div className={styles.metaRow}>
                <span className={styles.timestamp}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.status === 'failed' && <span className={styles.failedStatus}>Not sent</span>}
              </div>
            </div>
          </div>
        );
      })}
      
      {isWaiting && (
        <div className={`${styles.messageWrapper} ${styles.assistant}`}>
          <div className={styles.waitingIndicator}>
            <div className={styles.echoArc} />
            <div className={styles.echoArc} />
            <div className={styles.echoArc} />
          </div>
        </div>
      )}
    </div>
  );
};
