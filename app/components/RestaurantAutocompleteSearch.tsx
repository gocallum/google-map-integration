'use client';

import React, { useEffect, useState } from 'react';
import AsyncSelect from 'react-select/async';
import { fetchRestaurantAutocomplete, PlacePrediction } from '@/app/actions/searchmap';
import { SingleValue } from 'react-select';
import GoogleMap from './map';

// Define the structure of a VenueOption
interface VenueOption {
  label: string;
  name: string;
  value: string;
  lat: number;
  lon: number;
  address: string;
  photos: string[];
}
type BasicOption = { label: string; name: string; value: string, lat: number, lon: number, address: string, photos: string[]; };

function RestaurantAutocompleteSearch() {
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postcode, setPostcode] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<VenueOption | null>(null);
  const [suggestions, setSuggestions] = useState<VenueOption[]>([]);
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

        const suggestions = await fetchRestaurantAutocomplete('', lat + ' ' + lon);
        console.log(">> Suggestions received:", suggestions);

        // Store the suggestions in state
        const venueOptions = suggestions.map((result: any) => ({
          label: result.name + " (" + result.vicinity + ")" || 'Unknown',
          name: result.name || 'unknown',
          value: result.place_id || 'unknown',
          lat: result.geometry.location.lat || 'unknown',
          lon: result.geometry.location.lng || 'unknown',
          address: result.vicinity || 'unknown',
          photos: result.photos ? result.photos.map((photo: any) => photo.photo_reference) : [],
        }));
        console.log('Venue Options:', venueOptions);
        setSuggestions(venueOptions);
      }
    } catch (error) {
      console.error('Error during reverse geocoding:', error);
    }
  };

  // Fetch location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);


  // load venue options...
  const loadRestaurantOptions = (inputValue: string): Promise<VenueOption[]> => {
    return new Promise((resolve) => {
      const filteredOptions = suggestions.filter(option => 
        option.name.toLowerCase().startsWith(inputValue.toLowerCase()) // Match if the label starts with the input
      );
      resolve(filteredOptions);
    });
  };

  // Handle venue selection from AsyncSelect
  const handleVenueSelect = (newValue: SingleValue<BasicOption>, actionMeta: any) => {
    if (newValue) {
      const venueOption = suggestions.find(option => option.name.toLowerCase() === newValue.name.toLowerCase());
      if (venueOption)
        setSelectedVenue(venueOption);
    } else {
      setSelectedVenue(null);
    }
  };

  const getPhotoUrl = (photoReference: string) => {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${GOOGLE_API_KEY}`;
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
          loadOptions={loadRestaurantOptions}
          defaultOptions
          onChange={handleVenueSelect} // Updated handler
          placeholder="Search for restaurants"
          value={selectedVenue ? { label: selectedVenue.label, name: selectedVenue.name, value: selectedVenue.value, lat: selectedVenue.lat, 
            lon: selectedVenue.lon, address: selectedVenue.address, photos: selectedVenue.photos } : null}
          isClearable
        />
      </div>

      {selectedVenue && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold">Selected Venue:</h2>
          <p>{selectedVenue.label}</p>
          <div className="flex flex-wrap mt-4">
            {selectedVenue.photos.length > 0 ? (
              selectedVenue.photos.map((photo, index) => (
                <img
                  key={index}
                  src={getPhotoUrl(photo)}
                  alt={`Restaurant ${index + 1}`}
                  className="w-64 h-64 object-cover mr-4 mb-4"
                />
              ))
            ) : (
              <p>No photos available</p>
            )}
          </div>
          <GoogleMap lat={selectedVenue.lat} lng={selectedVenue.lon} />
        </div>
      )}
    </div>
  );
}

export default RestaurantAutocompleteSearch;
