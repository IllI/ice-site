'use client';

import { useState } from 'react';

interface LayerType {
  id: string;
  name: {
    en: string;
    es: string;
  };
  value: string;
}

interface LayerControlProps {
  onLayerChange: (layer: string) => void;
}

export default function LayerControl({ onLayerChange }: LayerControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState('Simple');
  
  const layers: LayerType[] = [
    {
      id: 'simple',
      name: {
        en: 'Simple',
        es: 'Simple'
      },
      value: 'Simple'
    },
    {
      id: 'street',
      name: {
        en: 'Street',
        es: 'Calle'
      },
      value: 'Street'
    },
    {
      id: 'satellite',
      name: {
        en: 'Satellite',
        es: 'Satélite'
      },
      value: 'Satellite'
    },
    {
      id: 'dark',
      name: {
        en: 'Dark',
        es: 'Oscuro'
      },
      value: 'Dark'
    }
  ];

  const handleLayerChange = (layer: LayerType) => {
    setSelectedLayer(layer.value);
    onLayerChange(layer.value);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white bg-opacity-90 hover:bg-opacity-100 px-3 py-1.5 rounded-md shadow-sm w-full flex items-center justify-between text-gray-600 hover:text-gray-800 transition-all"
      >
        <span className="text-sm">Layers / Capas</span>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''} text-xs ml-2`}>▼</span>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 bottom-full mb-1 bg-white rounded-lg shadow-md overflow-hidden w-full">
          {layers.map(layer => (
            <button
              key={layer.id}
              onClick={() => handleLayerChange(layer)}
              className={`w-full px-3 py-1.5 text-left hover:bg-gray-100 text-sm ${
                selectedLayer === layer.value ? 'bg-gray-100' : ''
              }`}
            >
              <div>{layer.name.en}</div>
              <div className="text-xs text-gray-500">{layer.name.es}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 