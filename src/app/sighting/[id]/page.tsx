import { createClient } from '@supabase/supabase-js';
import SightingDetails from './SightingDetails';
import { Sighting } from '@/types/sighting';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function SightingPage({ params }: { params: { id: string } }) {
  console.log('Fetching sighting with ID:', params.id);

  try {
    const { data: sighting, error } = await supabase
      .from('ice_reports')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching sighting:', error);
      return <div>Error loading sighting</div>;
    }

    if (!sighting) {
      console.log('No sighting found with ID:', params.id);
      return <SightingDetails sighting={null} />;
    }

    console.log('Successfully fetched sighting:', sighting);
    return <SightingDetails sighting={sighting as Sighting} />;
  } catch (error) {
    console.error('Unexpected error:', error);
    return <div>An unexpected error occurred</div>;
  }
} 