'use client';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import type { LeafletMouseEvent } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';
import { useEffect, useState } from 'react';

// Fix leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/marker-icon-2x.png',
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
});

interface MapProps {
  center: [number, number];
  pins: Array<{ lat: number; lng: number }>;
  onMapClick: (latlng: { lat: number; lng: number }) => void;
}

function MapControls({ onMapClick }: { onMapClick: MapProps['onMapClick'] }) {
  const map = useMap();

  // Set up search control
  useEffect(() => {
    const provider = new OpenStreetMapProvider();
    const searchControl = new GeoSearchControl({
      provider,
      style: 'bar',
      showMarker: false,
      autoClose: true,
    });

    map.addControl(searchControl);
    return () => map.removeControl(searchControl);
  }, [map]);

  // Set up click handler
  useMapEvents({
    click: (e: LeafletMouseEvent) => onMapClick(e.latlng),
  });

  return null;
}

function MapContent({ center, pins, onMapClick }: MapProps) {
  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ width: '100%', height: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapControls onMapClick={onMapClick} />
      {pins.map((pin, index) => (
        <Marker key={index} position={[pin.lat, pin.lng]} />
      ))}
    </MapContainer>
  );
}

// Create a client-only wrapper component
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
}

export default function Map(props: MapProps) {
  return (
    <ClientOnly>
      <div className="w-full h-screen">
        <MapContent {...props} />
      </div>
    </ClientOnly>
  );
} 