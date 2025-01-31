'use client';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Image from 'next/image';

interface MapProps {
  center: [number, number];
  pins: Array<any>;
  onMapClick: (latlng: { lat: number; lng: number }) => void;
  isPlacementMode: boolean;
}

const MAP_LAYERS = {
  simple: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    name: 'Simple'
  },
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    name: 'Street'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    name: 'Satellite'
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    name: 'Dark'
  }
};

export default function Map({ center, pins, onMapClick, isPlacementMode }: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [tempMarker, setTempMarker] = useState<L.Marker | null>(null);
  const [activeLayer, setActiveLayer] = useState<keyof typeof MAP_LAYERS>('simple');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!mapRef.current) {
      const map = L.map('map', {
        zoomControl: true  // Enable default zoom control
      }).setView(center, 13);

      // Move zoom control to top left
      map.zoomControl?.setPosition('topleft');
      
      mapRef.current = map;

      // Custom icons with proper sizing
      const redHatIcon = L.icon({
        iconUrl: '/redHat.png',
        iconSize: [40, 40],     // Width and height maintaining square aspect ratio
        iconAnchor: [20, 40],   // Point of the icon which corresponds to marker's location
        popupAnchor: [0, -40],  // Point from which the popup should open relative to the iconAnchor
        className: 'marker-icon' // Add a class for potential CSS adjustments
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

      // Add existing pins
      pins.forEach(pin => {
        const timeDiff = Date.now() - new Date(pin.time_date).getTime();
        const hoursAgo = timeDiff / (1000 * 60 * 60);
        
        let icon;
        if (hoursAgo < 4) {
          icon = redHatIcon;
        } else if (hoursAgo < 24) {
          icon = yellowHatIcon;
        } else {
          icon = blackHatIcon;
        }

        const marker = L.marker([pin.lat, pin.lng], { icon }).addTo(map);
        
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
      });

      // Handle clicks
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
      L.tileLayer(MAP_LAYERS[activeLayer].url, {
        attribution: MAP_LAYERS[activeLayer].attribution
      }).addTo(map);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center, pins, isPlacementMode, onMapClick, activeLayer]);

  return (
    <div className="relative w-full h-full">
      <div id="map" className="w-full h-full" />
      
      {/* Search bar and logo container */}
      <div className="absolute top-4 left-[80px] right-[80px] z-[1000]">
        <div className="flex items-center bg-white rounded-lg shadow-lg max-w-[500px] mx-auto">
          <div className="flex-grow p-2">
            <input
              type="text"
              placeholder="Search for location.."
              className="w-full p-2 rounded border border-gray-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="p-2">
            <Image 
              src="/logo.jpg"
              alt="Logo"
              width={40}
              height={40}
              className="rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Controls Container - Groups Add Sighting and Layer Controls */}
      <div className="absolute bottom-8 right-4 z-[1000] flex flex-col gap-3">
        {/* Add Sighting Button */}
        <div className="bg-white rounded-full shadow-lg self-end w-[80px] h-[80px] flex items-center justify-center">
          <button
            onClick={() => {
              if (tempMarker) {
                tempMarker.remove();
                setTempMarker(null);
              }
              // Toggle placement mode by triggering a map click at the center
              if (!isPlacementMode) {
                onMapClick({ lat: center[0], lng: center[1] });
              }
            }}
            className={`w-full h-full rounded-full transition-all duration-200 flex items-center justify-center ${
              isPlacementMode
                ? 'bg-blue-600'
                : 'hover:bg-gray-100'
            }`}
            title="Add Sighting"
          >
            <div className="w-[56px] h-[56px] relative">
              <Image
                src="/addSiting.png"
                alt="Add Sighting"
                fill
                className="object-contain"
              />
            </div>
          </button>
        </div>

        {/* Layer Controls - More compact design */}
        <div className="bg-white bg-opacity-90 rounded-lg shadow-sm p-1 text-sm">
          <div className="flex flex-col">
            {(Object.keys(MAP_LAYERS) as Array<keyof typeof MAP_LAYERS>).map((layer) => (
              <button
                key={layer}
                onClick={() => setActiveLayer(layer)}
                className={`px-3 py-1.5 rounded transition-colors ${
                  activeLayer === layer
                    ? 'bg-blue-500 bg-opacity-20 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {MAP_LAYERS[layer].name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 