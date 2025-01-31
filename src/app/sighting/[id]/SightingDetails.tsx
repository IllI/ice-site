'use client';

import Map from '@/components/Map';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Sighting } from '@/types/sighting';

interface SightingDetailsProps {
  sighting: Sighting | null;
}

export default function SightingDetails({ sighting }: SightingDetailsProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    console.log('SightingDetails mounted with sighting:', sighting);
    // Show panel after mount
    setIsVisible(true);
  }, [sighting]);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!sighting) {
    console.log('No sighting data provided to SightingDetails');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Sighting Not Found</h1>
          <p className="text-gray-600">The sighting you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  console.log('Rendering SightingDetails with isVisible:', isVisible);

  return (
    <div className="h-screen w-full relative">
      {/* Full-screen map */}
      <div className="absolute inset-0 z-0">
        <Map
          center={[sighting.lat, sighting.lng]}
          pins={[sighting]}
          onMapClick={() => {}}
          isPlacementMode={false}
        />
      </div>

      {/* Sliding panel with higher z-index */}
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-lg z-50 transition-transform duration-300 ease-in-out ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '70vh' }}
      >
        {/* Handle for dragging */}
        <div className="w-full flex justify-center py-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        <div className="sticky top-0 w-full bg-white px-4 py-3 border-b flex items-center justify-between">
          <h1 className="text-xl font-bold">Sighting Details</h1>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Close details"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-600"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 4rem)' }}>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h2 className="font-semibold mb-2">Description / Descripción</h2>
                <p className="text-gray-700">{sighting.description}</p>
              </div>
              {sighting.image_url && (
                <div>
                  <h2 className="font-semibold mb-2">Image / Imagen</h2>
                  <img
                    src={sighting.image_url}
                    alt="Sighting"
                    className="w-full rounded-lg"
                  />
                </div>
              )}
              <div>
                <h2 className="font-semibold mb-2">Size / Número de oficiales</h2>
                <p className="text-gray-700">{sighting.size}</p>
              </div>
              <div>
                <h2 className="font-semibold mb-2">Activity / Actividad</h2>
                <p className="text-gray-700">{sighting.activity}</p>
              </div>
              <div>
                <h2 className="font-semibold mb-2">Location / Ubicación</h2>
                <p className="text-gray-700">{sighting.location}</p>
              </div>
              <div>
                <h2 className="font-semibold mb-2">Uniform / Uniforme</h2>
                <p className="text-gray-700">{sighting.uniform}</p>
              </div>
              <div>
                <h2 className="font-semibold mb-2">Time/Date / Hora y Fecha</h2>
                <p className="text-gray-700">
                  {new Date(sighting.time_date).toLocaleString()}
                </p>
              </div>
              <div>
                <h2 className="font-semibold mb-2">Equipment / Equipo</h2>
                <p className="text-gray-700">{sighting.equipment}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 