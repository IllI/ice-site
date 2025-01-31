'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import dynamic from 'next/dynamic';
import SightingForm from '@/components/SightingForm';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function Home() {
  const [pins, setPins] = useState<Array<any>>([]);
  const [userLocation, setUserLocation] = useState<[number, number]>([41.8781, -87.6298]); // Default to Chicago
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacementMode, setIsPlacementMode] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Get user location
        if (navigator.geolocation) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        }

        // Load existing pins
        const { data } = await supabase.from('ice_reports').select('*');
        if (data) setPins(data);
      } catch (error) {
        console.error('Error initializing:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  const handleMapClick = useCallback((latlng: { lat: number; lng: number }) => {
    if (!isPlacementMode) {
      setIsPlacementMode(true);
      return;
    }
    
    setSelectedPosition(latlng);
    setShowForm(true);
    setIsPlacementMode(false);
  }, [isPlacementMode]);

  const handleFormSubmit = async () => {
    setShowForm(false);
    // Refresh pins after submission
    const { data } = await supabase.from('ice_reports').select('*');
    if (data) setPins(data);
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="text-lg">Loading map...</div>
      </div>
    );
  }

  return (
    <main className="relative w-full h-screen">
      <Map
        center={userLocation}
        pins={pins}
        onMapClick={handleMapClick}
        isPlacementMode={isPlacementMode}
      />

      {showForm && selectedPosition && (
        <SightingForm
          position={selectedPosition}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setIsPlacementMode(false);
          }}
        />
      )}
    </main>
  );
}
