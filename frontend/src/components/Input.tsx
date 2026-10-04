import React from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, fullWidth, id, ...props }, ref) => {
    const inputId = id || label.replace(/\s+/g, '-').toLowerCase();

    return (
      <div className={`${styles.container} ${fullWidth ? styles.fullWidth : ''} ${className}`}>
        <label htmlFor={inputId} className={styles.label}>{label}</label>
        <input
          id={inputId}
          ref={ref}
          className={`${styles.input} ${error ? styles.hasError : ''}`}
          {...props}
        />
        {error && <span className={styles.error} role="alert">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';
