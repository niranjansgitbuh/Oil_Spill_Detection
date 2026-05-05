'use client';

import { useEffect, useRef } from 'react';
// @ts-ignore
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface AISPosition {
  timestamp: string;
  mmsi: number | null;
  lat: number | null;
  lon: number | null;
  sog: number | null;
  cog: number | null;
  true_heading: number | null;
}

interface MapViewProps {
  center: [number, number];
  zoom: number;
  positions: AISPosition[];
  bounds: [[number, number], [number, number]];
  onSelectShip: (pos: AISPosition) => void;
  onCenterChange: (center: [number, number]) => void;
  onZoomChange: (zoom: number) => void;
}

export default function MapView({
  center,
  zoom,
  positions,
  bounds,
  onSelectShip,
  onCenterChange,
  onZoomChange
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) {
      // Initialize map
      mapRef.current = L.map('map-container', {
        center: center,
        zoom: zoom,
      });

      // Add dark tile layer (CartoDB Dark)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap, &copy; CartoDB',
        maxZoom: 19,
      }).addTo(mapRef.current);

      // Add bounding box
      const rectangle = L.rectangle([bounds[0], bounds[1]], {
        color: '#3b82f6',
        weight: 2,
        dashArray: '5, 5',
        fill: true,
        fillOpacity: 0.1,
      }).addTo(mapRef.current);

      // Add move event listener
      mapRef.current.on('moveend', () => {
        if (mapRef.current) {
          const center = mapRef.current.getCenter();
          const zoom = mapRef.current.getZoom();
          onCenterChange([center.lat, center.lng]);
          onZoomChange(zoom);
        }
      });
    }

    return () => {
      // Cleanup
    };
  }, []);

  // Update markers when positions change
  useEffect(() => {
    if (mapRef.current) {
      // Remove old markers
      mapRef.current.eachLayer((layer: any) => {
        if (layer.options?.markerType === 'ship') {
          mapRef.current?.removeLayer(layer);
        }
      });

      // Add new markers
      positions.forEach((pos) => {
        if (pos.lat && pos.lon) {
          // Red dot for all ships
          const marker = L.circleMarker([pos.lat, pos.lon], {
            radius: 6,
            fillColor: '#ef4444',
            color: '#dc2626',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
          }).addTo(mapRef.current!);

          (marker.options as any).markerType = 'ship';

          marker.bindPopup(`
            <div class="p-2">
              <h3 class="font-bold mb-2">Ship ${pos.mmsi}</h3>
              <div class="text-sm space-y-1">
                <div><span class="text-gray-600">Speed:</span> <span>${pos.sog?.toFixed(1)} knots</span></div>
                <div><span class="text-gray-600">Course:</span> <span>${pos.cog?.toFixed(1)}°</span></div>
                <div><span class="text-gray-600">Position:</span> <span>${pos.lat.toFixed(4)}, ${pos.lon.toFixed(4)}</span></div>
                <div class="text-xs text-gray-500 mt-2">${new Date(pos.timestamp).toLocaleString()}</div>
              </div>
            </div>
          `);

          marker.on('click', () => {
            onSelectShip(pos);
          });
        }
      });
    }
  }, [positions, onSelectShip]);

  return <div id="map-container" style={{ width: '100%', height: '100%', zIndex: 0 }} />;
}
