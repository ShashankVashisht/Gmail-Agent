import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { gmailApi } from '../api/gmail';
import type { GmailStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import styles from './SettingsPage.module.css';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [status, setStatus] = useState<GmailStatus['status']>('not_connected');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const checkStatus = async () => {
    try {
      const res = await gmailApi.getStatus();
      setStatus(res.status);
      
      // If we just redirected back and it's active, show success
      const searchParams = new URLSearchParams(location.search);
      if (res.status === 'active' && searchParams.toString().length > 0) {
        setSuccess(true);
        // Clear URL params without reloading
        window.history.replaceState({}, document.title, location.pathname);
      }
      
      return res.status;
    } catch (err: any) {
      setError(err.message);
      return 'not_connected';
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [location]);

  // Auto-poll if pending
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let pollCount = 0;
    const maxPolls = 10; // 20 seconds total (2s * 10)

    const poll = async () => {
      if (status === 'pending' && pollCount < maxPolls) {
        const newStatus = await checkStatus();
        if (newStatus === 'pending') {
          pollCount++;
          timeoutId = setTimeout(poll, 2000);
        }
      }
    };

    if (status === 'pending') {
      timeoutId = setTimeout(poll, 2000);
    }

    return () => clearTimeout(timeoutId);
  }, [status]);

  const handleConnect = async () => {
    setError(null);
    try {
      const res = await gmailApi.connect();
      window.location.href = res.redirect_url;
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/chat" className={styles.backBtn}>
            <ArrowLeft size={16} strokeWidth={1.5} />
            Back to Chat
          </Link>
          <h1 className={styles.title}>Settings</h1>
        </div>
      </header>

      <main className={styles.main}>
        {success && (
          <div className={styles.successBanner}>
            Gmail connected successfully.
          </div>
        )}
        
        {error && (
          <div className={styles.errorBanner}>{error}</div>
        )}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Account</h2>
          <div className={styles.card}>
            <div className={styles.row}>
              <div>
                <div className={styles.label}>Email address</div>
                <div className={styles.value}>{user?.email}</div>
              </div>
              <Button variant="outline" onClick={logout}>Sign out</Button>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Gmail Integration</h2>
          <div className={styles.card}>
            <div className={styles.gmailHeader}>
              <div className={styles.gmailTitleRow}>
                <h3 className={styles.gmailTitle}>Connect your inbox</h3>
                {!loading && <StatusBadge status={status} />}
              </div>
            </div>
            
            <div className={styles.gmailContent}>
              {loading ? (
                <p className={styles.description}>Checking status...</p>
              ) : status === 'active' ? (
                <p className={styles.description}>
                  Gmail is connected. Echo can read your mail and create drafts. It never sends mail on its own.
                </p>
              ) : status === 'pending' ? (
                <>
                  <p className={styles.description}>
                    Finish connecting in the Google window, then check again.
                  </p>
                  <Button onClick={checkStatus}>Check status</Button>
                </>
              ) : (
                <>
                  <p className={styles.description}>
                    Echo asks for access through Composio. Drafts are created in your Gmail Drafts folder for you to review and send yourself.
                  </p>
                  <Button onClick={handleConnect}>Connect Gmail</Button>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
