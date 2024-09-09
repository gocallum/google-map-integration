'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { fetchNearbyRestaurants, VenueOption } from '@/app/actions/searchmap';
import GoogleMap from './map';
import { FaClock, FaMapMarkerAlt, FaChevronDown } from 'react-icons/fa';

export default function RestaurantSearch() {
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<VenueOption | null>(null);
  const [options, setOptions] = useState<VenueOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch user's location using the browser's geolocation API
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLon(position.coords.longitude);
      },
      (error) => {
        console.error('Error fetching location:', error);
      }
    );
  }, []);

  // Load restaurant options dynamically based on input
  const loadRestaurantOptions = async (inputValue: string) => {
    setSearchTerm(inputValue);
    if (!inputValue || inputValue.length < 2 || !lat || !lon) {
      setOptions([]);
      setIsDropdownOpen(false);
      return;
    }

    try {
      const location = `${lat},${lon}`;
      const results = await fetchNearbyRestaurants(inputValue, location);

      setOptions(results);
      setIsDropdownOpen(true);
    } catch (error) {
      console.error('Error fetching nearby restaurants:', error);
      setOptions([]);
      setIsDropdownOpen(false);
    }
  };

  const handleVenueSelect = (option: VenueOption) => {
    setSelectedVenue(option);
    setSearchTerm(option.name);
    setIsDropdownOpen(false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Search Nearby Restaurants</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="restaurant-search">Restaurant Search:</Label>
            <div className="relative">
              <Input
                id="restaurant-search"
                placeholder="Type restaurant name..."
                value={searchTerm}
                onChange={(e) => loadRestaurantOptions(e.target.value)}
                className="pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <FaChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          {isDropdownOpen && options.length > 0 && (
            <div className="absolute z-10 w-full max-w-2xl bg-white border border-gray-200 rounded-md shadow-lg">
              {options.map((option) => (
                <div
                  key={option.place_id}
                  className="flex items-center p-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleVenueSelect(option)}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div className="flex-shrink-0">
                      {option.distance > 10 ? (
                        <FaClock className="w-5 h-5 text-gray-400" />
                      ) : (
                        <FaMapMarkerAlt className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{option.name}</p>
                      <p className="text-sm text-gray-500 truncate">{option.vicinity}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="text-sm text-gray-500">{option.distance.toFixed(1)} km</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedVenue && (
          <div className="mt-6 space-y-4">
            <h2 className="text-lg font-semibold">Selected Venue</h2>
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="font-medium">{selectedVenue.name}</p>
              <p className="text-sm text-gray-600">{selectedVenue.vicinity}</p>
              <p className="text-sm text-gray-600">{selectedVenue.distance.toFixed(1)} km away</p>
            </div>
            <div className="aspect-video w-full">
              <GoogleMap lat={selectedVenue.geometry.location.lat} lng={selectedVenue.geometry.location.lng} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
