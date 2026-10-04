import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, Plus, Trash2, Settings, LogOut } from 'lucide-react';
import type { Conversation } from '../types';
import { useAuth } from '../auth/AuthContext';
import { Logo } from '../components/Logo';
import { Button } from '../components/Button';
import styles from './ConversationList.module.css';

interface ConversationListProps {
  conversations: Conversation[];
  onDelete: (id: string) => Promise<void>;
  onNew: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({ 
  conversations, onDelete, onNew, isOpen, onClose 
}) => {
  const { conversationId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(id);
    setDeleteConfirmId(null);
  };

  const getTimeAgo = (dateStr: string) => {
    const days = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / (1000 * 3600 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <div className={`${styles.overlay} ${isOpen ? styles.open : ''}`} onClick={onClose} />
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <Logo />
        </div>
        
        <div className={styles.newBtnContainer}>
          <Button variant="outline" fullWidth onClick={onNew} className={styles.newBtn}>
            <Plus size={16} strokeWidth={1.5} />
            New conversation
          </Button>
        </div>

        <div className={styles.list}>
          {conversations.length === 0 ? (
            <p className={styles.empty}>No conversations yet</p>
          ) : (
            conversations.map(conv => (
              <Link 
                key={conv.id} 
                to={`/chat/${conv.id}`}
                className={`${styles.item} ${conversationId === conv.id ? styles.active : ''}`}
                onClick={onClose}
              >
                <div className={styles.itemContent}>
                  <MessageSquare size={14} strokeWidth={1.5} className={styles.itemIcon} />
                  <div className={styles.itemText}>
                    <span className={styles.title}>{conv.title || 'New Conversation'}</span>
                    <span className={styles.date}>{getTimeAgo(conv.created_at)}</span>
                  </div>
                </div>
                
                <div className={styles.actions}>
                  {deleteConfirmId === conv.id ? (
                    <div className={styles.confirmDelete}>
                      Delete? 
                      <button onClick={(e) => handleDelete(e, conv.id)}>Yes</button> /
                      <button onClick={(e) => { e.preventDefault(); setDeleteConfirmId(null); }}>No</button>
                    </div>
                  ) : (
                    <button 
                      className={styles.deleteBtn}
                      onClick={(e) => { e.preventDefault(); setDeleteConfirmId(conv.id); }}
                      aria-label="Delete conversation"
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.userInfo}>
            <span className={styles.userEmail}>{user?.email}</span>
          </div>
          <div className={styles.footerLinks}>
            <Link to="/settings" className={styles.footerLink} onClick={onClose}>
              <Settings size={14} strokeWidth={1.5} />
              Settings
            </Link>
            <button className={styles.footerLink} onClick={handleLogout}>
              <LogOut size={14} strokeWidth={1.5} />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
