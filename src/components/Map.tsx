'use client';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Image from 'next/image';
import MapLegend from './MapLegend';
import LayerControl from './LayerControl';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';
import ReactDOM from 'react-dom/client';

// Add custom CSS to style the search bar and logo
const searchBarStyles = `
  .leaflet-control-geosearch.leaflet-bar {
    position: absolute !important;
    top: 10px !important;
    right: 10px !important;
    left: auto !important;
    transform: none !important;
    z-index: 1000;
    display: flex;
    align-items: center;
    background: white;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    padding: 4px;
  }
  .leaflet-control-geosearch form {
    display: flex;
    align-items: center;
    margin: 0;
  }
  .leaflet-control-geosearch form input {
    padding: 8px 12px;
    border: none;
    border-radius: 4px;
    outline: none;
    width: 200px;
  }
  .leaflet-control-geosearch form .results {
    margin-top: 4px;
  }
  .leaflet-control-geosearch .search-logo {
    width: 30px;
    height: 30px;
    margin-left: 8px;
    border-radius: 4px;
    object-fit: contain;
  }
`;

interface MapProps {
  center: [number, number];
  pins: Array<any>;
  onMapClick: (latlng: { lat: number; lng: number }) => void;
  isPlacementMode: boolean;
}

export default function Map({ center, pins, onMapClick, isPlacementMode }: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [tempMarker, setTempMarker] = useState<L.Marker | null>(null);
  const [mapStyle, setMapStyle] = useState<string>('Simple');
  const [enabledMarkers, setEnabledMarkers] = useState<Record<'red' | 'yellow' | 'black', boolean>>({
    red: true,
    yellow: true,
    black: true
  });

  // Custom icons with proper sizing
  const redHatIcon = L.icon({
    iconUrl: '/redHat.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
    className: 'marker-icon'
  });

  const yellowHatIcon = L.icon({
    iconUrl: '/yellowHat.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
    className: 'marker-icon'
  });

  const blackHatIcon = L.icon({
    iconUrl: '/blackHat.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
    className: 'marker-icon'
  });

  useEffect(() => {
    if (!mapRef.current) {
      // Add custom styles
      const style = document.createElement('style');
      style.textContent = searchBarStyles;
      document.head.appendChild(style);

      const map = L.map('map', {
        zoomControl: true
      }).setView(center, 13);

      map.zoomControl?.setPosition('topleft');
      
      mapRef.current = map;

      // Add search control
      const provider = new OpenStreetMapProvider();
      const searchControl = new GeoSearchControl({
        provider,
        style: 'bar',
        searchLabel: 'Enter address',
        autoComplete: true,
        autoCompleteDelay: 250,
        showMarker: false,
        showPopup: false,
        position: 'topright'
      });
      map.addControl(searchControl);

      map.on('click', (e) => {
        if (isPlacementMode) {
          if (tempMarker) {
            tempMarker.setLatLng(e.latlng);
          } else {
            const newMarker = L.marker(e.latlng, {
              icon: redHatIcon,
              draggable: true,
            }).addTo(map);
            setTempMarker(newMarker);
            
            newMarker.on('dragend', () => {
              const pos = newMarker.getLatLng();
              onMapClick({ lat: pos.lat, lng: pos.lng });
            });
          }
          onMapClick(e.latlng);
        }
      });

      // Update the map layer
      L.tileLayer(getTileLayer(mapStyle)).addTo(map);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center, isPlacementMode, onMapClick, mapStyle]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        layer.remove();
      }
    });

    // Add markers based on enabled state
    pins.forEach(pin => {
      const timeDiff = Date.now() - new Date(pin.time_date).getTime();
      const hoursAgo = timeDiff / (1000 * 60 * 60);
      
      let icon;
      let markerId: 'red' | 'yellow' | 'black';
      if (hoursAgo < 4) {
        icon = redHatIcon;
        markerId = 'red';
      } else if (hoursAgo < 8) {
        icon = yellowHatIcon;
        markerId = 'yellow';
      } else {
        icon = blackHatIcon;
        markerId = 'black';
      }

      if (enabledMarkers[markerId]) {
        const marker = L.marker([pin.lat, pin.lng], { icon }).addTo(mapRef.current!);
        
        // Create popup content
        const popupContent = `
          <div class="popup-content p-4">
            <h3 class="font-bold text-lg mb-2">${pin.location || 'Unknown Location'}</h3>
            <p class="mb-2">${pin.description || ''}</p>
            ${pin.size ? `<p class="mb-1"><strong>Size:</strong> ${pin.size}</p>` : ''}
            ${pin.activity ? `<p class="mb-1"><strong>Activity:</strong> ${pin.activity}</p>` : ''}
            ${pin.uniform ? `<p class="mb-1"><strong>Uniform:</strong> ${pin.uniform}</p>` : ''}
            ${pin.equipment ? `<p class="mb-1"><strong>Equipment:</strong> ${pin.equipment}</p>` : ''}
            <p class="mb-1"><strong>Time:</strong> ${new Date(pin.time_date).toLocaleString()}</p>
            ${pin.image_url ? `<img src="${pin.image_url}" alt="Sighting" class="mt-2 max-w-[200px] rounded"/>` : ''}
            <a href="/sighting/${pin.id}" class="text-blue-500 hover:underline block mt-2">View Details</a>
          </div>
        `;
        
        marker.bindPopup(popupContent);
      }
    });
  }, [pins, enabledMarkers]);

  useEffect(() => {
    if (!mapRef.current) return;
    
    // Update tile layer when style changes
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        layer.remove();
      }
    });
    
    L.tileLayer(getTileLayer(mapStyle)).addTo(mapRef.current);
  }, [mapStyle]);

  const getTileLayer = (style: string) => {
    switch (style) {
      case 'Street':
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      case 'Satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'Dark':
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      default:
        return 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    }
  };

  return (
    <div className="relative w-full h-full">
      <div id="map" className="w-full h-full" />

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2">
        <img src="/logo.jpg" alt="Logo" className="w-[30px] h-[30px] object-contain" />
      </div>

      {/* Other Controls */}
      <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2 min-w-[200px]">
        {/* Add Sighting Button */}
        <div className="self-end mb-2">
          <button
            onClick={() => {
              if (tempMarker) {
                tempMarker.remove();
                setTempMarker(null);
              }
              onMapClick({ lat: center[0], lng: center[1] });
            }}
            className={`bg-white rounded-full shadow-lg w-[64px] h-[64px] flex items-center justify-center hover:bg-gray-50 transition-colors ${
              isPlacementMode ? 'bg-blue-500 text-white' : ''
            }`}
            title="Add Sighting / Agregar Avistamiento"
          >
            <Image
              src="/addSiting.png"
              alt="Add Sighting"
              width={40}
              height={40}
              className="object-contain"
            />
          </button>
        </div>

        {/* Legend */}
        <div className="w-full">
          <MapLegend 
            markerStates={enabledMarkers}
            onMarkerToggle={(markerId, enabled) => {
              setEnabledMarkers(prev => ({
                ...prev,
                [markerId]: enabled
              }));
            }} 
          />
        </div>

        {/* Layer Control - More subtle styling */}
        <div className="w-full opacity-80 hover:opacity-100 transition-opacity">
          <LayerControl onLayerChange={setMapStyle} />
        </div>
      </div>
    </div>
  );
} 