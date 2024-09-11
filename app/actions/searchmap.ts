'use server';

const GOOGLE_MAP_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY;

// Interface for Nearby Search results, directly used as VenueOption
export interface VenueOption {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  distance: number; // Distance from the user's location
  photos: string[];
}

// Haversine formula to calculate the distance between two lat/lon points
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

// Fetch restaurants and return them as VenueOption directly
export async function fetchNearbyRestaurants(query: string, userLocation: string, requestId: string
): Promise<{ results: VenueOption[], requestId: string }> {
  if (!GOOGLE_MAP_KEY) {
    throw new Error('Google Maps API key is missing');
  }

  const [userLat, userLon] = userLocation.split(',').map(Number); // Extract user's latitude and longitude
  console.log('User Location:', userLat, userLon);
  console.log('Query:', query);

  // Use Nearby Search API
  const endpoint = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?keyword=${query}&location=${userLocation}&radius=1500&type=restaurant&key=${GOOGLE_MAP_KEY}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch nearby restaurants: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('Nearby Search Results:', data);

  // Filter and map the response to include only results that start with the query, and sort by distance
  const results = data.results
    .filter((result: any) => result.name.toLowerCase().startsWith(query.toLowerCase())) // Filter results based on name starting with the query
    .map((result: any) => {
      const distance = calculateDistance(userLat, userLon, result.geometry.location.lat, result.geometry.location.lng);
      return {
        place_id: result.place_id,
        name: result.name,
        vicinity: result.vicinity,
        geometry: {
          location: {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
          },
        },
        distance, // Add distance in kilometers
        photos: result.photos ? result.photos.map((photo: any) => photo.photo_reference) : [],
      };
    })
    .sort((a: { distance: number; }, b: { distance: number; }) => a.distance - b.distance); // Sort results by distance (ascending)

  return { results, requestId };
}

export async function getPhotoUrl(query: string): Promise<string> {
  if (!GOOGLE_MAP_KEY) {
    throw new Error('Google Maps API key is missing');
  }

  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${query}&key=${GOOGLE_MAP_KEY}`;
}

// Fetch cities/postcodes based on input type (post code or city or suburb)
export async function getCityList(query: string, searchType: 'city' | 'postcode'): Promise<any> {
  if (!GOOGLE_MAP_KEY) {
    throw new Error('Google Maps API key is missing');
  }

  // Use Google Place Autocomplete API
  const typeFilter = searchType === 'postcode' ? 'geocode' : '(cities)';

  const endpoint = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${query}&types=${typeFilter}&components=country:au&key=${GOOGLE_MAP_KEY}`;
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch cities/postcodes: ${response.statusText}`);
  }

  return await response.json();
}

//Using PlaceID, search for city after input of city or post code for geometry location
export async function getPlaceDetails(placeId: string): Promise<any> {
  if (!GOOGLE_MAP_KEY) {
    throw new Error('Google Maps API key is missing');
  }
  const endpoint = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAP_KEY}`;
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch cities/postcodes: ${response.statusText}`);
  }

  return await response.json();
};

//reverse geocoding request to get city details from latitude and longitude
export async function getCityFromCoordinates(lat: number, lon: number): Promise<any> {
  if (!GOOGLE_MAP_KEY) {
    throw new Error('Google Maps API key is missing');
  }
  const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${GOOGLE_MAP_KEY}`;
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch city from coords: ${response.statusText}`);
  }

  return await response.json();
};
