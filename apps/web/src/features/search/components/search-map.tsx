'use client';

import { useEffect } from 'react';
import type { ServiceSearchHitDto } from '@local-service-marketplace/shared-types';
import 'leaflet/dist/leaflet.css';

interface SearchMapProps {
  services: ServiceSearchHitDto[];
  center?: [number, number];
}

export function SearchMap({ services, center = [51.505, -0.09] }: SearchMapProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;
    let map: { remove: () => void } | null = null;

    void (async () => {
      const leaflet = await import('leaflet');
      const L = leaflet.default;

      if (cancelled) return;

      map = L.map('search-map').setView(center, 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      const customIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      services.forEach((service) => {
        if (service.latitude && service.longitude) {
          const marker = L.marker([service.latitude, service.longitude], {
            icon: customIcon,
          }).addTo(map!);

          marker.bindPopup(
            `<div>
            <h4 style="font-weight: 600; margin-bottom: 4px;">${service.title}</h4>
            <p style="font-size: 0.875rem; color: #666;">${service.providerDisplayName}</p>
            ${service.basePrice ? `<p style="font-size: 0.875rem; margin-top: 4px;"><strong>${service.currency} ${service.basePrice.toFixed(2)}</strong></p>` : ''}
            <a href="/service/${service.id}" style="color: #0284c7; text-decoration: underline; font-size: 0.875rem;">View details</a>
          </div>`,
          );
        }
      });
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [services, center]);

  return <div id="search-map" className="h-full w-full rounded-lg" />;
}
