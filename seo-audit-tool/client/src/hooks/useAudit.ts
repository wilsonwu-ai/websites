import { useState, useCallback } from 'react';
import { AuditResults, AuditProgress } from '../types/audit';

const API_BASE = '/api';

interface UseAuditReturn {
  audit: AuditResults | null;
  progress: AuditProgress | null;
  loading: boolean;
  error: string | null;
  startAudit: (url: string) => Promise<string | null>;
  fetchAudit: (id: string) => Promise<void>;
  subscribeToProgress: (id: string) => () => void;
}

export function useAudit(): UseAuditReturn {
  const [audit, setAudit] = useState<AuditResults | null>(null);
  const [progress, setProgress] = useState<AuditProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startAudit = useCallback(async (url: string): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to start audit');
        return null;
      }

      return data.id;
    } catch (e: any) {
      setError(e.message || 'Failed to start audit');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAudit = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/audit/${id}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch audit');
        return;
      }

      setAudit(data.audit);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch audit');
    } finally {
      setLoading(false);
    }
  }, []);

  const subscribeToProgress = useCallback((id: string): (() => void) => {
    const eventSource = new EventSource(`${API_BASE}/audit/${id}/progress`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as AuditProgress;
        setProgress(data);

        if (data.status === 'complete' || data.status === 'failed') {
          eventSource.close();
        }
      } catch (e) {
        console.error('Failed to parse progress:', e);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return {
    audit,
    progress,
    loading,
    error,
    startAudit,
    fetchAudit,
    subscribeToProgress,
  };
}
