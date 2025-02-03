import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const syncToken = process.env.SYNC_TOKEN || '123';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration
const DAYS_TO_KEEP = 3;
const BATCH_SIZE = 50; // Process records in smaller batches
const PADLET_CONFIG = {
  baseUrl: 'https://padlet.com/api/10/wishes',
  wallHashId: 'board_YjMXnWQK1VbayND5'
} as const;

async function fetchPadletData(pageStart?: string): Promise<any[]> {
  try {
    const url = pageStart 
      ? `${PADLET_CONFIG.baseUrl}?wall_hashid=${PADLET_CONFIG.wallHashId}&page_start=${pageStart}`
      : `${PADLET_CONFIG.baseUrl}?wall_hashid=${PADLET_CONFIG.wallHashId}`;

    console.log('Fetching from URL:', url);
    const response = await fetch(url, { 
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 0 } // Disable cache
    });
    
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
  } catch (error) {
    console.error('Error fetching Padlet data:', error);
    throw error;
  }
}

async function processPadletData(rawData: any[]) {
  if (!Array.isArray(rawData)) {
    console.error('Raw data is not an array:', typeof rawData);
    throw new Error('Invalid data format from Padlet');
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - DAYS_TO_KEEP);

  return rawData
    .filter(item => {
      const reportDate = new Date(item.attributes.created_at);
      return reportDate >= cutoffDate;
    })
    .map(item => ({
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
    }));
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

async function processInBatches(items: any[]) {
  let insertedCount = 0;
  const batches = [];
  
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    batches.push(items.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`Processing ${batches.length} batches of ${BATCH_SIZE} items each`);
  
  for (const batch of batches) {
    const newItems = [];
    
    for (const item of batch) {
      // Check for duplicates
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
        newItems.push(item);
      }
    }
    
    if (newItems.length > 0) {
      const { error: insertError } = await supabase
        .from('ice_reports')
        .insert(newItems);

      if (insertError) {
        console.error('Error inserting batch:', insertError);
        continue;
      }

      insertedCount += newItems.length;
      console.log(`Inserted ${newItems.length} items from current batch`);
    }
  }
  
  return insertedCount;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  console.log('Starting sync process...');
  const startTime = Date.now();
  
  try {
    // Verify auth token
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${syncToken}`) {
      console.log('Auth failed. Received:', authHeader);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clean old records
    await cleanOldRecords();
    console.log('Cleaned old records');

    // Fetch data from Padlet
    const rawData = await fetchPadletData();
    console.log(`Fetched ${rawData.length} items from Padlet`);
    
    // Process and filter data
    const processedData = await processPadletData(rawData);
    console.log(`Processed ${processedData.length} items within the ${DAYS_TO_KEEP}-day window`);

    // Insert data in batches
    const insertedCount = await processInBatches(processedData);
    
    const duration = (Date.now() - startTime) / 1000;
    console.log(`Sync completed in ${duration} seconds`);

    return NextResponse.json({ 
      success: true, 
      message: `Synced ${insertedCount} new sightings in ${duration}s` 
    });
  } catch (error) {
    console.error('Sync error:', error instanceof Error ? error.stack : error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to sync data',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
