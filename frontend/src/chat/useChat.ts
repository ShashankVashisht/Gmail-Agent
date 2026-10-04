import { useState, useEffect, useCallback } from 'react';
import { chatApi } from '../api/chat';
import type { Conversation, Message } from '../types';

export const useChat = (conversationId?: string) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const data = await chatApi.getConversations();
      setConversations(data);
    } catch (err: any) {
      setMessages([{
        id: `notice-${Date.now()}`,
        role: 'notice',
        content: "Couldn't load conversations.",
        created_at: new Date().toISOString(),
        errorType: 'retryable'
      }]);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (conversationId) {
      const fetchMessages = async () => {
        setLoadingMessages(true);
        setError(null);
        try {
          const data = await chatApi.getMessages(conversationId);
          setMessages(data);
        } catch (err: any) {
          setMessages([{
            id: `notice-${Date.now()}`,
            role: 'notice',
            content: "Couldn't load messages.",
            created_at: new Date().toISOString(),
            errorType: 'retryable'
          }]);
        } finally {
          setLoadingMessages(false);
        }
      };
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  const sendMessage = async (content: string, isAgent: boolean, existingId?: string) => {
    const tempId = existingId || `temp-${Date.now()}`;
    
    // Remove any existing notices
    setMessages(prev => prev.filter(m => m.role !== 'notice'));

    if (!existingId) {
      const userMsg: Message = {
        id: tempId,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
        status: 'sending'
      };
      setMessages(prev => [...prev, userMsg]);
    } else {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'sending' } : m));
    }
    
    try {
      const apiCall = isAgent ? chatApi.chatAgent : chatApi.chat;
      const response = await apiCall({
        message: content,
        conversation_id: conversationId || null
      });
      
      setMessages(prev => {
        const withoutFailed = prev.map(m => m.id === tempId ? { ...m, status: 'sent' as const } : m);
        return [...withoutFailed, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.reply,
          created_at: new Date().toISOString()
        }];
      });
      
      return response;
    } catch (err: any) {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
      
      let errorType: Message['errorType'] = 'general';
      let msgContent = err.message || 'An error occurred';

      if (err.status === 409 && isAgent) {
        errorType = 'gmail_409';
        msgContent = "Gmail isn't connected, so the email agent can't read your mail.";
      } else if (err.status === 502) {
        errorType = 'retryable';
        // Detail text is already in err.message due to client.ts handling
      } else if (err.status === 0 || err.message === "Can't reach the server.") {
        errorType = 'retryable';
        msgContent = "Can't reach the server.";
      } else {
        errorType = 'retryable';
      }

      setMessages(prev => [...prev, {
        id: `notice-${Date.now()}`,
        role: 'notice',
        content: msgContent,
        created_at: new Date().toISOString(),
        errorType
      }]);
      
      return null;
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      await chatApi.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setMessages(prev => [...prev, {
        id: `notice-${Date.now()}`,
        role: 'notice',
        content: "Couldn't delete conversation.",
        created_at: new Date().toISOString(),
        errorType: 'general'
      }]);
    }
  };

  return {
    conversations,
    messages,
    loadingConversations,
    loadingMessages,
    error,
    sendMessage,
    deleteConversation,
    refreshConversations: fetchConversations
  };
};
