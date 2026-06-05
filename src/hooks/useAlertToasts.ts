import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { AlertEvent, AlertMetric } from '@/types/deviceHealth';

const METRIC_LABELS: Record<AlertMetric, string> = {
  cpu: 'CPU',
  temp: 'Temperature',
  memory: 'Memory',
  network: 'Network',
  offline: 'Offline',
};

function formatValue(alert: AlertEvent): string {
  if (alert.value === null) return '';
  switch (alert.metric) {
    case 'temp':
      return `${alert.value.toFixed(1)}°C`;
    case 'memory':
      return `${alert.value.toFixed(1)} GB`;
    case 'offline':
      return '';
    default:
      return `${alert.value.toFixed(1)}%`;
  }
}

export function useAlertToasts(alerts: AlertEvent[]) {
  const prevAlertsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentIds = new Set(alerts.map(a => a.id));
    
    alerts.forEach(alert => {
      if (!prevAlertsRef.current.has(alert.id)) {
        const metricLabel = METRIC_LABELS[alert.metric] || alert.metric;
        const value = formatValue(alert);
        const description = value
          ? `${alert.server_name} - ${metricLabel}: ${value}`
          : `${alert.server_name} - ${metricLabel}`;

        toast.error('Critical Alert', {
          description,
          duration: 5000,
        });
      }
    });

    prevAlertsRef.current = currentIds;
  }, [alerts]);
}
