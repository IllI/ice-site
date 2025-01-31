'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { uploadToMega } from '@/utils/megaUpload';
import { getLocationFromCoords } from '@/utils/geocoding';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SightingFormProps {
  position: { lat: number; lng: number };
  onSubmit: () => void;
  onCancel: () => void;
}

export default function SightingForm({ position, onSubmit, onCancel }: SightingFormProps) {
  const [formData, setFormData] = useState({
    description: '',
    size: '',
    activity: '',
    location: '',
    uniform: '',
    timeDate: 'now',
    equipment: '',
  });
  const [image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (!image) {
        throw new Error('No file selected');
      }

      // Convert file to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(image);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });

      // Upload to Imgur
      const uploadResponse = await fetch('/api/imgur/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ base64Data }),
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || 'Failed to upload image');
      }

      const { imageUrl } = await uploadResponse.json();

      // Get location name if not provided
      let locationName = formData.location;
      if (!locationName.trim()) {
        locationName = await getLocationFromCoords(position.lat, position.lng);
      }

      // Save to Supabase
      const { error: dbError } = await supabase
        .from('ice_reports')
        .insert([
          {
            lat: position.lat,
            lng: position.lng,
            description: formData.description,
            image_url: imageUrl,
            size: formData.size,
            activity: formData.activity,
            location: locationName,
            uniform: formData.uniform,
            time_date: formData.timeDate === 'now' 
              ? new Date().toISOString()
              : formData.timeDate === '1-8'
              ? new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
              : new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
            equipment: formData.equipment,
          },
        ]);

      if (dbError) throw dbError;

      setIsSubmitting(false);
      onSubmit();
    } catch (error) {
      console.error('Error submitting form:', error);
      setIsSubmitting(false);
      setError(error instanceof Error ? error.message : 'Failed to submit form');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[2000]">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Report Sighting</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">Description / Descripción</label>
            <textarea
              className="w-full border rounded p-2 min-h-[100px]"
              minLength={3}
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div>
            <label className="block mb-1">Upload Picture / Subir una foto</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setImage(e.target.files?.[0] || null)}
              className="w-full"
            />
          </div>

          <div>
            <label className="block mb-1">Size / Número de oficiales o camiones</label>
            <input
              type="number"
              className="w-full border rounded p-2"
              value={formData.size}
              onChange={e => setFormData(prev => ({ ...prev, size: e.target.value }))}
            />
          </div>

          <div>
            <label className="block mb-1">Activity / ¿Qué están haciendo?</label>
            <input
              type="text"
              className="w-full border rounded p-2"
              value={formData.activity}
              onChange={e => setFormData(prev => ({ ...prev, activity: e.target.value }))}
            />
          </div>

          <div>
            <label className="block mb-1">Location / Ubicación (business)</label>
            <input
              type="text"
              className="w-full border rounded p-2"
              value={formData.location}
              onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Optional - will use nearest neighborhood if empty"
            />
          </div>

          <div>
            <label className="block mb-1">Uniform/Clothing / ¿Qué llevaban puesto?</label>
            <input
              type="text"
              className="w-full border rounded p-2"
              value={formData.uniform}
              onChange={e => setFormData(prev => ({ ...prev, uniform: e.target.value }))}
            />
          </div>

          <div>
            <label className="block mb-1">Time/Date / Hora y Fecha</label>
            <select
              className="w-full border rounded p-2"
              value={formData.timeDate}
              onChange={e => setFormData(prev => ({ ...prev, timeDate: e.target.value }))}
            >
              <option value="now">Now / Ahora</option>
              <option value="1-8">1-8 hours ago / 1-8 horas atrás</option>
              <option value="8+">Longer than 8 hours ago / Más de 8 horas atrás</option>
            </select>
          </div>

          <div>
            <label className="block mb-1">Equipment / Equipo</label>
            <input
              type="text"
              className="w-full border rounded p-2"
              value={formData.equipment}
              onChange={e => setFormData(prev => ({ ...prev, equipment: e.target.value }))}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border rounded hover:bg-gray-100"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 