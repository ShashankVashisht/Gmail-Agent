import React from 'react';
import styles from './StatusBadge.module.css';
import type { GmailStatus } from '../types';

interface StatusBadgeProps {
  status: GmailStatus['status'];
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getDisplay = () => {
    switch (status) {
      case 'active':
        return { label: 'Connected', className: styles.active };
      case 'pending':
        return { label: 'Pending', className: styles.pending };
      case 'not_connected':
      default:
        return { label: 'Not connected', className: styles.notConnected };
    }
  };

  const display = getDisplay();

  return (
    <div className={`${styles.badge} ${display.className}`}>
      {status === 'active' && <span className={styles.dot} />}
      {display.label}
    </div>
  );
};
