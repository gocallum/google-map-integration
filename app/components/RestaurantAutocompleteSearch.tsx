'use client';

import React, { useEffect, useState } from 'react';
import AsyncSelect from 'react-select/async';
import { AutocompleteResult, fetchRestaurantAutocomplete, PlacePrediction } from '@/app/actions/searchmap';

// Define the structure of a VenueOption
interface VenueOption {
  label: string;
  value: string;
  location: string;
  placePrediction?: any; // Adjust based on your data structure
}

function RestaurantAutocompleteSearch() {
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postcode, setPostcode] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<VenueOption | null>(null);
  const [allVenue, setAllVenue] = useState<VenueOption[] | null>(null);
  const [selectedLocation, setSelectedLocation] = useState('');
  const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY;

  // Function to fetch user's current location and get city, state, postcode
  const getCurrentLocation = () => {
    console.log("getCurrentLocation...");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  };

  const showPosition = (position: { coords: { latitude: number; longitude: number; }; }) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    console.log("showposition:", lat, lon);
    // Call reverse geocoding API to get city, state, and postcode
    getCityFromCoordinates(lat, lon);
  };

  const showError = (error: GeolocationPositionError) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        console.log("User denied the request for Geolocation.");
        break;
      case error.POSITION_UNAVAILABLE:
        console.log("Location information is unavailable.");
        break;
      case error.TIMEOUT:
        console.log("The request to get user location timed out.");
        break;
      default:
        console.log("An unknown error occurred.");
        break;
    }
  };

  // Reverse Geocoding API call (e.g., Google Maps API) to get city, state, postcode
  const getCityFromCoordinates = async (lat: number, lon: number) => {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${GOOGLE_API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.results.length > 0) {
        const addressComponents = data.results[0].address_components;
        let city = "";
        let state = "";
        let postcode = "";

        addressComponents.forEach((component: { types: string[]; long_name: string; short_name: string; }) => {
          if (component.types.includes("locality")) {
            city = component.long_name;
          }
          if (component.types.includes("administrative_area_level_1")) {
            state = component.short_name;
          }
          if (component.types.includes("postal_code")) {
            postcode = component.long_name;
          }
        });

        // Populate the form fields
        setCity(city);
        setState(state);
        setPostcode(postcode);
        setSelectedLocation(lat + ' ' + lon);
        loadRestaurantOptions(lat + ' ' + lon);
      }
    } catch (error) {
      console.error('Error during reverse geocoding:', error);
    }
  };

  // Fetch location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // parameter needed is location which comes from the auto location
  const loadRestaurantOptions = async (location: string): Promise<VenueOption[]> => {
    try {
      // Debugging: Check if inputValue is correct
      console.log("Fetching restaurant suggestions for:", location);

      // Fetch suggestions based on input
      const suggestions = await fetchRestaurantAutocomplete('', location); //source of value?
      console.log("Suggestions received:", suggestions); // Inspect data

      return suggestions.map((result: any) => ({
        label: result.name || 'Unknown',  // Get the description from the API response
        value: result.place_id || 'unknown',     // Get the place_id from the API response
        location: result.geometry.location.lat + ' ' + result.geometry.location.lng || 'unknown',
      }));
    } catch (error) {
      console.error('Error fetching autocomplete suggestions:', error);
      return [];
    }
  };


  // Mock function to load venue options (replace with your API)
  const loadOptions = (inputValue: string): Promise<VenueOption[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const options: VenueOption[] = [
          { label: 'Venue 1', value: 'venue1', location: 'Location 1' },
          { label: 'Venue 2', value: 'venue2', location: 'Location 2' },
          { label: 'Venue 3', value: 'venue3', location: 'Location 3' },
        ].filter(option =>
          option.label.toLowerCase().includes(inputValue.toLowerCase())
        );
        resolve(options);
      }, 1000);
    });
  };


  // Handle venue selection from AsyncSelect
  const handleVenueSelect = (selectedOption: VenueOption | null) => {
    setSelectedVenue(selectedOption);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Restaurant Autocomplete Search</h1>

      <div className="mb-4">
        <label className="block text-gray-700">City:</label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Enter city"
          className="p-2 border w-full"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">State:</label>
        <input
          type="text"
          value={state}
          onChange={(e) => setState(e.target.value)}
          placeholder="Enter state"
          className="p-2 border w-full"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Postcode:</label>
        <input
          type="text"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          placeholder="Enter postcode"
          className="p-2 border w-full"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700">Restaurant Search:</label>
        <AsyncSelect
          cacheOptions
          loadOptions={loadOptions}
          defaultOptions
          onChange={handleVenueSelect}
          placeholder="Search for restaurants"
          isClearable
          value={selectedVenue}
        />
      </div>

      {selectedVenue && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold">Selected Venue:</h2>
          <p>{selectedVenue.label}</p>
        </div>
      )}
    </div>
  );
}

export default RestaurantAutocompleteSearch;
