export async function getLocationFromCoords(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'ICE-Site/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch location data');
    }

    const data = await response.json();
    
    // Try to get the most specific location name
    const address = data.address;
    return (
      address.neighbourhood ||
      address.suburb ||
      address.city_district ||
      address.town ||
      address.city ||
      address.village ||
      address.municipality ||
      address.county ||
      'Unknown Location'
    );
  } catch (error) {
    console.error('Error getting location from coordinates:', error);
    return 'Unknown Location';
  }
} 