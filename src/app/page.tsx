'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import Map from '@/components/Map';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [pins, setPins] = useState<Array<{ lat: number; lng: number }>>([]);
  const [userLocation, setUserLocation] = useState<[number, number]>([40.7128, -74.0060]); // Default NYC
  const [isLoading, setIsLoading] = useState(true);

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

  const handleMapClick = useCallback(async (latlng: { lat: number; lng: number }) => {
    const { data, error } = await supabase
      .from('ice_reports')
      .insert([{ lat: latlng.lat, lng: latlng.lng }])
      .select();
    if (data) setPins(prev => [...prev, ...data]);
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="text-lg">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen">
      <div className="absolute top-4 left-4 z-10 bg-white p-4 shadow-lg rounded-lg">
        <h1 className="text-2xl font-bold mb-2">I.C.E. Site</h1>
        <p className="text-sm text-gray-600">
          Click anywhere on the map to report an ICE sighting
        </p>
      </div>
      <Map center={userLocation} pins={pins} onMapClick={handleMapClick} />
    </div>
  );
}
