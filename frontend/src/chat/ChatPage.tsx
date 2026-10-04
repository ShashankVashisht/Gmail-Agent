import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useChat } from './useChat';
import { ConversationList } from './ConversationList';
import { MessageList } from './MessageList';
import { Composer } from './Composer';
import { gmailApi } from '../api/gmail';
import styles from './ChatPage.module.css';

export const ChatPage: React.FC = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [agentMode, setAgentMode] = useState<'chat' | 'agent'>('chat');
  const [gmailActive, setGmailActive] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const {
    conversations,
    messages,
    loadingMessages,
    error,
    sendMessage,
    deleteConversation,
    refreshConversations
  } = useChat(conversationId);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check Gmail status on load
    gmailApi.getStatus().then(res => {
      const isActive = res.status === 'active';
      setGmailActive(isActive);
      
      const savedMode = localStorage.getItem('echo_agent_mode');
      if (savedMode === 'agent' && !isActive) {
        setAgentMode('chat');
        localStorage.setItem('echo_agent_mode', 'chat');
      } else if (savedMode === 'chat' || savedMode === 'agent') {
        setAgentMode(savedMode);
      } else {
        setAgentMode(isActive ? 'agent' : 'chat');
      }
    }).catch(() => {
      // If status check fails, fallback to chat
      setAgentMode('chat');
    });
  }, []);

  const handleModeChange = (mode: 'chat' | 'agent') => {
    setAgentMode(mode);
    localStorage.setItem('echo_agent_mode', mode);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSend = async (content: string) => {
    setIsSending(true);
    try {
      const response = await sendMessage(content, agentMode === 'agent');
      if (!conversationId && response?.conversation_id) {
        navigate(`/chat/${response.conversation_id}`);
        refreshConversations();
      }
    } catch (err: any) {
      // Errors are handled in useChat (mapped to notices)
    } finally {
      setIsSending(false);
    }
  };

  const handleNewConversation = () => {
    navigate('/chat');
    setSidebarOpen(false);
  };

  const activeConversation = conversations.find(c => c.id === conversationId);

  return (
    <div className={styles.container}>
      <ConversationList 
        conversations={conversations}
        onDelete={deleteConversation}
        onNew={handleNewConversation}
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <main className={styles.main}>
        <header className={styles.header}>
          <button 
            className={styles.menuBtn}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} strokeWidth={1.5} />
          </button>
          
          <div className={styles.headerTitle}>
            {activeConversation?.title || 'New Conversation'}
          </div>
          
          <div className={styles.segmentWrapper}>
            <div className={styles.segmentControl}>
              <button 
                className={`${styles.segmentBtn} ${agentMode === 'chat' ? styles.active : ''}`}
                onClick={() => handleModeChange('chat')}
              >
                Chat
              </button>
              <button 
                className={`${styles.segmentBtn} ${agentMode === 'agent' ? styles.active : ''}`}
                onClick={() => handleModeChange('agent')}
              >
                Email agent
              </button>
            </div>
            {!gmailActive && (
              <div className={styles.gmailHint}>
                Gmail not connected. <Link to="/settings" className={styles.hintLink}>Connect</Link>
              </div>
            )}
          </div>
        </header>
        
        <div className={styles.messagesArea}>
          {error && <div className={styles.errorBanner}>{error}</div>}
          
          {loadingMessages ? (
            <div className={styles.loadingState}>Loading messages...</div>
          ) : (
            <>
              <MessageList 
                messages={messages} 
                isWaiting={isSending} 
                onRetry={(id, content) => sendMessage(content, agentMode === 'agent', id)}
                onSendAsChat={(id, content) => {
                  setAgentMode('chat');
                  sendMessage(content, false, id);
                }}
              />
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        <div className={styles.composerArea}>
          <Composer 
            onSend={handleSend} 
            isSending={isSending} 
            isNewConversation={!conversationId && messages.length === 0}
          />
        </div>
      </main>
    </div>
  );
};
