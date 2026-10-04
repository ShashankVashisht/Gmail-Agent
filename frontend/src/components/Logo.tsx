import React from 'react';
import styles from './Logo.module.css';

export const Logo: React.FC = () => {
  return (
    <div className={styles.logo}>
      <span className={styles.text}>Echo</span>
      <div className={styles.mark}>
        <div className={styles.arc1} />
        <div className={styles.arc2} />
      </div>
    </div>
  );
};
