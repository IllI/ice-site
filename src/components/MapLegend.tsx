'use client';

import { useState } from 'react';
import Image from 'next/image';

interface MarkerType {
  id: string;
  name: {
    en: string;
    es: string;
  };
  icon: string;
  enabled: boolean;
}

interface MapLegendProps {
  onMarkerToggle: (markerId: string, enabled: boolean) => void;
  markerStates: Record<string, boolean>;
}

export default function MapLegend({ onMarkerToggle, markerStates }: MapLegendProps) {
  const [isOpen, setIsOpen] = useState(false);
  const markerTypes = [
    {
      id: 'red',
      name: {
        en: 'Recent Activity (< 4 hours)',
        es: 'Actividad Reciente (< 4 horas)'
      },
      icon: '/redHat.png'
    },
    {
      id: 'yellow',
      name: {
        en: 'Today\'s Activity (4-8 hours)',
        es: 'Actividad de Hoy (4-8 horas)'
      },
      icon: '/yellowHat.png'
    },
    {
      id: 'black',
      name: {
        en: 'Past Activity (> 8 hours)',
        es: 'Actividad Pasada (> 8 horas)'
      },
      icon: '/blackHat.png'
    }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white px-4 py-2 rounded-lg shadow-md w-full flex items-center justify-between min-w-[150px]"
      >
        <span className="text-sm">Legend / Leyenda</span>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 bottom-full mb-1 bg-white rounded-lg shadow-md p-3 space-y-2 w-full">
          {markerTypes.map(marker => (
            <div key={marker.id} className="flex items-center space-x-2">
              <label className="flex items-center cursor-pointer w-full">
                <input
                  type="checkbox"
                  checked={markerStates[marker.id]}
                  onChange={() => onMarkerToggle(marker.id, !markerStates[marker.id])}
                  className="mr-2"
                />
                <div className="w-5 h-5 relative mr-2">
                  <Image
                    src={marker.icon}
                    alt={marker.name.en}
                    width={20}
                    height={20}
                    className="object-contain"
                  />
                </div>
                <div className="text-sm">
                  <div>{marker.name.en}</div>
                  <div className="text-xs text-gray-600">{marker.name.es}</div>
                </div>
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 