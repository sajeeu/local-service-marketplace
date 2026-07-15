'use client';

import { useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { getAccessToken } from '@/features/auth/session';

interface TrackServiceViewProps {
  serviceId: string;
}

export function TrackServiceView({ serviceId }: TrackServiceViewProps) {
  useEffect(() => {
    const trackView = async () => {
      const token = getAccessToken();
      if (token) {
        try {
          await apiClient.trackServiceView(serviceId);
        } catch (error) {
          console.error('Failed to track service view:', error);
        }
      }
    };

    trackView();
  }, [serviceId]);

  return null;
}
