import { useCallback, useEffect, useState } from 'react';
import * as dashboardApi from '../../api/dashboard';

/**
 * Loads the parent's children and the selected child's dashboard.
 *
 * status: 'loading' | 'ready' | 'error'
 * dashboardStatus: 'loading' | 'ready' | 'idle' (idle = no child selected)
 */
export function useDashboard(user) {
  const [status, setStatus] = useState('loading');
  const [children, setChildren] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [dashboardStatus, setDashboardStatus] = useState('idle');

  useEffect(() => {
    let cancelled = false;
    dashboardApi
      .listChildren(user)
      .then((list) => {
        if (cancelled) return;
        setChildren(list);
        setSelectedId(list[0]?.id ?? null);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!selectedId) {
      setDashboard(null);
      setDashboardStatus('idle');
      return undefined;
    }
    let cancelled = false;
    setDashboardStatus('loading');
    dashboardApi
      .getDashboard(selectedId)
      .then((data) => {
        if (cancelled) return;
        setDashboard(data);
        setDashboardStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const addChild = useCallback(
    async (details) => {
      const child = await dashboardApi.addChild(user, details);
      setChildren((current) => [...current, child]);
      setSelectedId(child.id);
      return child;
    },
    [user],
  );

  const selectedChild = children.find((child) => child.id === selectedId) ?? null;

  return {
    status,
    childList: children,
    selectedChild,
    selectChild: setSelectedId,
    addChild,
    dashboard,
    dashboardStatus,
  };
}
