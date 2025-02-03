import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const syncToken = process.env.SYNC_TOKEN || '123'; // Default to '123' if not set
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration
const DAYS_TO_KEEP = 3;
const PADLET_CONFIG = {
  baseUrl: 'https://padlet.com/api/10/wishes',
  wallHashId: 'board_YjMXnWQK1VbayND5'
} as const;

async function fetchPadletData(pageStart?: string): Promise<any[]> {
  const url = pageStart 
    ? `${PADLET_CONFIG.baseUrl}?wall_hashid=${PADLET_CONFIG.wallHashId}&page_start=${pageStart}`
    : `${PADLET_CONFIG.baseUrl}?wall_hashid=${PADLET_CONFIG.wallHashId}`;

  console.log('Fetching from URL:', url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch from Padlet: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  console.log('Padlet response status:', response.status);
  
  let allData = data.data || [];
  console.log('Fetched data count:', allData.length);
  
  // If there's a next page, fetch it recursively
  if (data.meta?.next) {
    const nextPageData = await fetchPadletData(data.meta.next);
    allData = [...allData, ...nextPageData];
  }
  
  return allData;
}

async function processPadletData(rawData: any[]) {
  if (!Array.isArray(rawData)) {
    console.error('Raw data is not an array:', typeof rawData);
    throw new Error('Invalid data format from Padlet');
  }

  if (rawData.length === 0) {
    console.warn('No data to process');
    return [];
  }

  // Calculate the cutoff date (3 days ago)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - DAYS_TO_KEEP);

  return rawData
    .filter(item => {
      const reportDate = new Date(item.attributes.created_at);
      return reportDate >= cutoffDate;
    })
    .map(item => {
      try {
        return {
          lat: item.attributes.location_point.latitude,
          lng: item.attributes.location_point.longitude,
          location: item.attributes.location_name,
          description: item.attributes.body,
          size: item.attributes.custom_properties?.Fvkpy4pI || '',
          activity: item.attributes.custom_properties?.['4LxsfXZo'] || '',
          uniform: item.attributes.custom_properties?.h36hJnEo || '',
          equipment: item.attributes.custom_properties?.nnVFYm1Q || '',
          time_date: item.attributes.created_at,
          image_url: item.attributes.attachment || ''
        };
      } catch (err) {
        console.error('Error processing item:', JSON.stringify(item, null, 2));
        throw err;
      }
    });
}

async function cleanOldRecords() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - DAYS_TO_KEEP);

  const { error } = await supabase
    .from('ice_reports')
    .delete()
    .lt('time_date', cutoffDate.toISOString());

  if (error) {
    console.error('Error cleaning old records:', error);
    throw new Error(`Failed to clean old records: ${error.message}`);
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization');
  console.log('Auth header:', authHeader);
  console.log('Expected:', `Bearer ${syncToken}`);
  
  if (authHeader !== `Bearer ${syncToken}`) {
    return NextResponse.json({ 
      error: 'Unauthorized',
      received: authHeader,
      expected: `Bearer ${syncToken}`
    }, { status: 401 });
  }

  try {
    console.log('Starting sync process...');
    
    // Clean old records first
    await cleanOldRecords();
    console.log('Cleaned old records');

    // Fetch all data from Padlet
    const rawData = await fetchPadletData();
    console.log(`Fetched ${rawData.length} items from Padlet`);
    
    // Process and filter data
    const processedData = await processPadletData(rawData);
    console.log(`Processed ${processedData.length} items within the ${DAYS_TO_KEEP}-day window`);

    // Insert new data in batches to avoid duplicates
    let insertedCount = 0;
    for (const item of processedData) {
      // Check if a similar record exists (same location within 1 minute)
      const { data: existingData, error: selectError } = await supabase
        .from('ice_reports')
        .select('id')
        .eq('lat', item.lat)
        .eq('lng', item.lng)
        .gte('time_date', new Date(new Date(item.time_date).getTime() - 60000).toISOString())
        .lte('time_date', new Date(new Date(item.time_date).getTime() + 60000).toISOString())
        .maybeSingle();

      if (selectError) {
        console.error('Error checking for duplicate:', selectError);
        continue;
      }

      if (!existingData) {
        const { error: insertError } = await supabase
          .from('ice_reports')
          .insert([item]);

        if (insertError) {
          console.error('Error inserting item:', insertError);
          continue;
        }

        insertedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Synced ${insertedCount} new sightings, keeping data from last ${DAYS_TO_KEEP} days` 
    });
  } catch (error) {
    console.error('Sync error:', error instanceof Error ? error.stack : error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to sync data',
      details: error instanceof Error ? error.message : JSON.stringify(error)
    }, { status: 500 });
  }
}
