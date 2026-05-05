'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-200 flex items-center justify-center">Loading map...</div>
});

interface AISPosition {
  timestamp: string;
  mmsi: number | null;
  lat: number | null;
  lon: number | null;
  sog: number | null;
  cog: number | null;
  true_heading: number | null;
}

export default function AISTrackingMap() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [positions, setPositions] = useState<AISPosition[]>([]);
  const [selectedShip, setSelectedShip] = useState<AISPosition | null>(null);
  const [config, setConfig] = useState({
    min_lat: 34.0,
    max_lat: 71.0,
    min_lon: -25.0,
    max_lon: 45.0,
    mmsi_list: '',
    duration_sec: 15
  });
  
  const [center, setCenter] = useState<[number, number]>([52.5, 10.0]);
  const [zoom, setZoom] = useState(4);

  const wsRef = useRef<WebSocket | null>(null);

  const startStream = () => {
    setIsStreaming(true);
    setPositions([]);
    setSelectedShip(null);

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/api/ais/stream`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      
      const mmsiArray = config.mmsi_list
        ? config.mmsi_list.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      
      ws.send(JSON.stringify({
        min_lat: config.min_lat,
        max_lat: config.max_lat,
        min_lon: config.min_lon,
        max_lon: config.max_lon,
        mmsi_list: mmsiArray,
        duration_sec: config.duration_sec
      }));

      // Center map on bounding box
      setCenter([
        (config.min_lat + config.max_lat) / 2,
        (config.min_lon + config.max_lon) / 2
      ]);
      setZoom(4);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.status === 'complete') {
        setIsStreaming(false);
        ws.close();
      } else if (data.error) {
        console.error('Stream error:', data.error);
        setIsStreaming(false);
      } else {
        setPositions(prev => [...prev, data as AISPosition]);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsStreaming(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsStreaming(false);
    };
  };

  const stopStream = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsStreaming(false);
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Get latest position per ship
  const latestPositions = Array.from(
    positions.reduce((acc, pos) => {
      if (pos.mmsi && pos.lat !== null && pos.lon !== null) {
        acc.set(pos.mmsi, pos);
      }
      return acc;
    }, new Map<number, AISPosition>()).values()
  );

  // Bounding box coordinates for rectangle
  const bounds: [[number, number], [number, number]] = [
    [config.min_lat, config.min_lon],
    [config.max_lat, config.max_lon]
  ];

  return (
    <div className="max-w-full mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🚢 Live AIS Ship Tracking</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 border rounded-lg p-6 bg-white shadow-lg">
          <h3 className="text-xl font-semibold mb-4">⚙️ Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Min Latitude</label>
              <input
                type="number"
                step="0.1"
                value={config.min_lat}
                onChange={(e) => setConfig({...config, min_lat: parseFloat(e.target.value)})}
                className="w-full p-2 border rounded"
                disabled={isStreaming}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Max Latitude</label>
              <input
                type="number"
                step="0.1"
                value={config.max_lat}
                onChange={(e) => setConfig({...config, max_lat: parseFloat(e.target.value)})}
                className="w-full p-2 border rounded"
                disabled={isStreaming}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Min Longitude</label>
              <input
                type="number"
                step="0.1"
                value={config.min_lon}
                onChange={(e) => setConfig({...config, min_lon: parseFloat(e.target.value)})}
                className="w-full p-2 border rounded"
                disabled={isStreaming}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Max Longitude</label>
              <input
                type="number"
                step="0.1"
                value={config.max_lon}
                onChange={(e) => setConfig({...config, max_lon: parseFloat(e.target.value)})}
                className="w-full p-2 border rounded"
                disabled={isStreaming}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Filter MMSI (comma-separated)
              </label>
              <input
                type="text"
                value={config.mmsi_list}
                onChange={(e) => setConfig({...config, mmsi_list: e.target.value})}
                placeholder="e.g., 123456789"
                className="w-full p-2 border rounded"
                disabled={isStreaming}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Duration: {config.duration_sec}s
              </label>
              <input
                type="range"
                min="5"
                max="60"
                value={config.duration_sec}
                onChange={(e) => setConfig({...config, duration_sec: parseInt(e.target.value)})}
                className="w-full"
                disabled={isStreaming}
              />
            </div>

            <button
              onClick={isStreaming ? stopStream : startStream}
              className={`w-full px-6 py-3 rounded-lg font-semibold ${
                isStreaming 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white transition`}
            >
              {isStreaming ? '⏸ Stop Stream' : '▶️ Start Stream'}
            </button>
          </div>

          {/* Stats */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">📊 Statistics</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Total Positions:</span>
                <span className="font-bold">{positions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Unique Ships:</span>
                <span className="font-bold">{latestPositions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={`font-bold ${isStreaming ? 'text-green-600' : 'text-gray-600'}`}>
                  {isStreaming ? '🟢 Streaming' : '⚪ Idle'}
                </span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">🎨 Legend</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Fast ships (&gt;10 knots)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>Slow ships (≤10 knots)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="lg:col-span-2">
          <div className="border rounded-lg overflow-hidden shadow-lg relative" style={{ height: '700px', zIndex: 0 }}>
            <MapComponent
              center={center}
              zoom={zoom}
              positions={latestPositions}
              bounds={bounds}
              onSelectShip={setSelectedShip}
              onCenterChange={setCenter}
              onZoomChange={setZoom}
            />
          </div>
        </div>
      </div>

      {/* Ship List Table */}
      {latestPositions.length > 0 && (
        <div className="border rounded-lg overflow-hidden shadow-lg bg-white">
          <h3 className="text-xl font-semibold p-4 bg-gray-50 border-b">
            📋 Ship Details ({latestPositions.length} ships)
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">MMSI</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Latitude</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Longitude</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Speed</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Course</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Heading</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Last Update</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {latestPositions.map((pos) => (
                  <tr 
                    key={pos.mmsi} 
                    className="border-t hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => {
                      setSelectedShip(pos);
                      if (pos.lat && pos.lon) {
                        setCenter([pos.lat, pos.lon]);
                        setZoom(8);
                      }
                    }}
                  >
                    <td className="px-4 py-3 font-mono">{pos.mmsi}</td>
                    <td className="px-4 py-3">{pos.lat?.toFixed(4)}</td>
                    <td className="px-4 py-3">{pos.lon?.toFixed(4)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-white text-sm font-semibold ${
                        pos.sog && pos.sog > 10 ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {pos.sog?.toFixed(1)} kn
                      </span>
                    </td>
                    <td className="px-4 py-3">{pos.cog?.toFixed(1)}°</td>
                    <td className="px-4 py-3">{pos.true_heading}°</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(pos.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (pos.lat && pos.lon) {
                            setCenter([pos.lat, pos.lon]);
                            setZoom(10);
                            setSelectedShip(pos);
                          }
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        📍 Locate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}