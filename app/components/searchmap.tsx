'use client';
import { useEffect, useState } from 'react';
import { fetchRestaurants } from '@/app/actions/searchmap';
import GoogleMap from './map';

interface Restaurant {
  place_id: string;
  name: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}



function RestaurantSearch() {
  const [location, setLocation] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedLocation, setSelectedLocation] = useState({ lat: 0, lng: 0 });

  function handleLocationChange(event: React.ChangeEvent<HTMLInputElement>) {
    setLocation(event.target.value);
  }

  //load current location
  function loadcurrentlocation() {
    useEffect(() => {
      console.log("Page reloaded!");
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position: GeolocationPosition) => {
            setSelectedLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            console.log('Geolocation detected:', position.coords.latitude, position.coords.latitude);
          },
          (error: GeolocationPositionError) => {
            console.error('Error getting location:', error);
          }
        );
      } else {
        console.log('Geolocation is not supported by this browser.');
      }

    }, []);
  }

  // async function handleSearch() {
  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    console.log("Search:", location);
    const results: Restaurant[] = await fetchRestaurants(location, selectedLocation.lat + ' ' + selectedLocation.lng);
    console.log("results:", results);
    setRestaurants(results);
  }

  function handleRestaurantClick(lat: number, lng: number) {
    console.log("search lat:", lat, ",lng:", lng);
    setSelectedLocation({ lat, lng });
  }

  return (
    <div>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={location}
          onChange={handleLocationChange}
          placeholder="Enter a location"
          className="p-2 border"
        />
        <button type="submit" className="p-2 bg-blue-500 text-white">Search</button>
      </form>
      <ul>
        {restaurants.map(function (restaurant) {
          return (
            <li key={restaurant.place_id} onClick={function () { handleRestaurantClick(restaurant.geometry.location.lat, restaurant.geometry.location.lng); }}>
              {restaurant.name}
            </li>
          );
        })}
      </ul>
      <GoogleMap lat={selectedLocation.lat} lng={selectedLocation.lng} />
    </div>
  );
}

export default RestaurantSearch;
