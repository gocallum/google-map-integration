'use server'

const GOOGLE_MAP_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY;

export interface PlacePrediction {
  placePrediction?: {
    place: string;
    placeId: string;
    text: {
      text: string;
      matches: { endOffset: number }[];
    };
    structuredFormat?: {
      mainText: {
        text: string;
        matches: { endOffset: number }[];
      };
      secondaryText: {
        text: string;
      };
    };
    types?: string[];
    distanceMeters?: number;
  };
}

interface QueryPrediction {
  queryPrediction?: {
    text: {
      text: string;
      matches: { endOffset: number }[];
    };
  };
}

export type AutocompleteResult = PlacePrediction | QueryPrediction;


export async function fetchRestaurants(keyword: string, selectedLoc: string) {
  console.log("Input:", keyword);

  if (!GOOGLE_MAP_KEY) {
    throw new Error('Google Maps API key is missing');
  }

  //sample
  //https://maps.googleapis.com/maps/api/place/nearbysearch/json?keyword=chicken&location=-37.8064%2C144.963&radius=1500&type=restaurant&key=API_KEY
  const response = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?keyword=${keyword}&location=${selectedLoc}&radius=1500&type=restaurant&key=${GOOGLE_MAP_KEY}`, {
    method: 'GET',
    next: { revalidate: 60 },  // Revalidate the response every 60 seconds
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("Res:", data);
  return data.results;
}

// Function to fetch restaurant autocomplete suggestions
export async function fetchRestaurantAutocomplete(query: string, location: string): Promise<AutocompleteResult[]> {
  console.log('Fetching autocomplete for:"'+ query + '","location:"' + location + '"');
  if (!GOOGLE_MAP_KEY) {
    throw new Error('Google Maps API key is missing');
  }

  // Construct the API endpoint URL with query parameters
  // const endpoint = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${query}&location=${location}&radius=1500&types=restaurant&key=${GOOGLE_MAP_KEY}`;
  const endpoint = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?keyword=${query}&location=${location}&radius=1500&type=restaurant&key=${GOOGLE_MAP_KEY}`;
  console.log("endpoint:", endpoint);
  // Send GET request to Google Places Autocomplete API
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store', // Disable caching
  });

  if (!response.ok) {
    console.error('Error response:', response);
    throw new Error(`Failed to fetch autocomplete: ${response.statusText}`);
  }

  const data = await response.json();
 console.log('Autocomplete data received:', data); 
  return data.results as AutocompleteResult[];
}
