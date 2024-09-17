'use client';

import React, { useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import AsyncSelect from 'react-select/async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { fetchNearbyRestaurants, VenueOption, getPhotoUrl, getCityList, getPlaceDetails, getCityFromCoordinates } from '@/app/actions/searchmap'; // Import getPhotoUrl
import GoogleMap from './map';
import { FaClock, FaMapMarkerAlt, FaChevronDown } from 'react-icons/fa';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';

interface VenueSearchProps {
  onCitySelected: (city: any) => void;
}

export default function RestaurantSearch() {
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<VenueOption | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]); // New state for photo URLs
  const [options, setOptions] = useState<VenueOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<any | null>(null); // Selected city
  const [useCurrentLocation, setUseCurrentLocation] = useState(false); // New state for disabling city select
  const latestRequestIdRef = useRef<string | null>(null);

  // Fetch user's location using the browser's geolocation API
  const getCurrentLocation = () => {
    setSelectedVenue(null);
    setSelectedCity(null);
    setSearchTerm("");
    setIsDropdownOpen(false);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLat(position.coords.latitude);
        setLon(position.coords.longitude);

        const placeDetails = await getCityFromCoordinates(position.coords.latitude, position.coords.longitude); // Fetch details using place_id
        const addressComponents = placeDetails.results[0].address_components;
        const placeId = placeDetails.results[0].place_id;
        let city = "", state = "", country = "", post_code = "";
        addressComponents.forEach((component: { types: string[]; long_name: string; short_name: string; }) => {
          if (component.types.includes("locality"))
            city = component.long_name;
          if (component.types.includes("administrative_area_level_1")) {
            state = component.short_name;
          }
          if (component.types.includes("country")) {
            country = component.long_name;
          }
          if (component.types.includes("post_code")) {
            post_code = component.long_name;
          }
        });

        //return this data to dashboard
        const selectedCityData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          postcode: post_code,
          cityPreference: city,
        };

        setSelectedCity({
          label: city + " " + state + ", " + country,
          value: placeId,
        });

        // onCitySelected(selectedCityData); //TODO on lunch buddy app
        setUseCurrentLocation(true); // Disable city select when location is used
        console.log('Current Location:', selectedCity, " -- ", city + " " + state + ", " + country);
      },
      (error) => {
        console.error('Error fetching location:', error);
      }
    );
  };

  // Detect if the input is a postcode (numeric) or a city (text)
  const isPostcode = (input: string) => {
    return /^\d+$/.test(input); // Returns true if the input is numeric (postcode)
  };

  // Load restaurant options dynamically based on input
  const loadRestaurantOptions = async (inputValue: string) => {
    setSearchTerm(inputValue);

    console.log('inputValue:', inputValue);
    console.log("lat:", lat, ",lon:", lon);
    if (!inputValue || inputValue.length < 2 || !lat || !lon) {
      setOptions([]);
      setIsDropdownOpen(false);
      return;
    }

    const requestId = uuidv4();
    latestRequestIdRef.current = requestId;

    try {
      const location = `${lat},${lon}`;
      const { results, requestId: responseId } = await fetchNearbyRestaurants(inputValue, location, requestId);
      console.log('Restaurants Results:', results);

      // Only update state if this is still the latest request
      if (responseId === latestRequestIdRef.current) {
        console.log('Results:', results);
        setOptions(results);
        setIsDropdownOpen(true);
      } else {
        console.log('Ignoring outdated response');
      }
    } catch (error) {
      console.error('Error fetching nearby restaurants:', error);
      setOptions([]);
      setIsDropdownOpen(false);
    }
  };

  // Load city/postcode options dynamically based on input
  const loadCityList = async (inputValue: string) => {
    setIsDropdownOpen(false);
    try {
      // Check if input is a postcode or city
      const searchType = isPostcode(inputValue) ? 'postcode' : 'city';
      const data = await getCityList(inputValue, searchType); // Pass searchType to the API

      return data.predictions.map((prediction: any) => ({
        label: prediction.description,
        value: prediction.place_id,
      }));

    } catch (error) {
      console.error('Error fetching cities/postcodes:', error);
    }
  };

  // Fetch photo URLs when a venue is selected
  const handleVenueSelect = async (option: VenueOption) => {
    setSelectedVenue(option);
    setSearchTerm(option.name);
    setIsDropdownOpen(false);
    console.log('Photo >> :', option.photos);

    // const optionTest =
    // {
    //   "photos": [
    //     "AXCi2Q42VA0p4aSo74rmlTzZYIhZ8XMdS20D5Jw7_4llMZfw3NkuvR4DcQ_o2jy2Ngbo92fGQqBHUYnD5s8fcKdXt9Jnwh-V7noInuA6T0kNSVPSSjkDR6ckFGmaFlycJNtWybHMEbXC39B1DBnTQMlSImAl3Rcn5Yv9Ymp0mC5KywzjUIAF",
    //     "AXCi2Q5of7dJsKCkANQl44IS1Z6wLQ1IFkCfJAy7UzWUnAWlbI_bGy7SCCS672rgfqyyUy07y92Odng6kwLyQkgyIx2EF5eQpqTpGK0ExXU0CuV_1FtZwVSl6Vv-AsnOz-s3hMnRuaHXtcTj1Tm5WFxyJ4hcngZ5HBPXzuj0FwbBSW_6ZBtu",
    //     "AXCi2Q5I-sESFKcc3N6tFEFAkMqoRGJhUo_a4TmVzgWGDG0H2TyMtkn7LzSYbkMJnGSDfNY5gPZARZJZpsloymRCtbsUUH0_PdSjSOOR9HuMj-3fNGI7erCDXpx1RF15qU-H274ExqgEZDS3L_UY4zuu2fMQCpzBD-Cyz6KLaifLxdLdWS6p",
    //     "AXCi2Q7rJpbMF8rZCd1om3a-jBQAI1tlrkoOIuBfYbpxuhD-9TvEVCKj_p8y0EKjodd0okl_HZ7km2RM7APEj0Xpaw0_37HE0m9FrYAn2SKZicUD51GbsAgSEgPas7yoPWHf0BLSH4WDK8UVRv_f8rW_nj3w48-XYdpzPobC-NEp_HjWOcfY"
    //   ],
    // };

    if (option.photos.length > 0) {
      // Fetch URLs for the photos
      const urls = await Promise.all(option.photos.map((photo) => getPhotoUrl(photo)));
      console.log('Photo URLs:', urls);
      setPhotoUrls(urls); // Update the state with the resolved photo URLs
    } else {
      setPhotoUrls([]);
    }
  };

  // Load postcodes when a city is selected
  const handleCitySelect = async (selCity: any) => {
    setSelectedCity(selCity);
    console.log("Selected:", selCity);

    if (selCity?.value) {
      try {
        const placeDetails = await getPlaceDetails(selCity.value); // Fetch details using place_id
        console.log("placeDetails:", placeDetails);

        if (placeDetails) {
          setLat(placeDetails.result.geometry.location.lat);
          setLon(placeDetails.result.geometry.location.lng);
          setSearchTerm(""); //clear the restaurant list below
          setSelectedVenue(null);
          setIsDropdownOpen(false);

          //return this data to dashboard
          const selectedCityData = {
            latitude: placeDetails.result.geometry.location.lat,
            longitude: placeDetails.result.geometry.location.lat,
            postcode: placeDetails.result.address_components[4].long_name,
            cityPreference: placeDetails.result.address_components[0].long_name,
          };
          // onCitySelected(selectedCityData); //TODO on lunch buddy app
        }
      } catch (error) {
        console.error('Error fetching place details:', error);
      }
    }
  };


  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Search Nearby Restaurants</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">

          <div className="space-y-2">
            <Button
              id="useCurrentLocBtn"
              onClick={() => {
                if (!useCurrentLocation) {
                  getCurrentLocation(); // Call the function to get current location
                } else {
                  // Optionally handle disabling the current location if needed
                  setUseCurrentLocation(false);
                  setLat(null);
                  setLon(null);
                  setSelectedVenue(null);
                  setSelectedCity(null);
                  setSearchTerm("");
                  setIsDropdownOpen(false);
                }
              }}
              className="w-full bg-blue-500 text-white"
            >
              {useCurrentLocation ? 'Disable Current Location' : 'Use Current Location'}
            </Button>
          </div>

          {/* AsyncSelect for cities */}
          <div className="space-y-2">
            <Label htmlFor="city-select">Select City/Suburb or Postcode:</Label>
            <AsyncSelect
              id="city-select"
              loadOptions={loadCityList}
              onChange={handleCitySelect}
              placeholder="Select a city or postcode..."
              cacheOptions
              defaultOptions
              value={selectedCity}
              isDisabled={useCurrentLocation}
            />
          </div>

          {/* Restaurant search input */}
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
              <div className="mt-4">
                {photoUrls.length > 0 ? (
                  <Carousel>
                    <CarouselContent>
                      {photoUrls.map((url, index) => (
                        <CarouselItem className="md:basis-1/2 lg:basis-1/3" key={index}>
                          <img
                            src={url}
                            alt={`Restaurant ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                ) : (
                  <p>No photos available</p>
                )}
              </div>
            </div>
            {/* <div className="aspect-video w-full">
              <GoogleMap lat={selectedVenue.geometry.location.lat} lng={selectedVenue.geometry.location.lng} />
            </div> */}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
