# Restaurant Search App

This is a Next.js 14 application that allows users to search for nearby restaurants using the Google Maps API. The app provides a user-friendly interface for searching and displaying restaurant information, with server-side actions to handle API requests.

## Features

- Search for nearby restaurants based on user input
- Display search results in a dropdown with restaurant details, including distance
- Show selected restaurant information including name, address, and distance
- Display the location of the selected restaurant on a Google Map
- Server-side actions for secure API calls
- Distance calculation using the Haversine formula

## Technologies Used

- Next.js 14 (App Router)
- React
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Google Maps API (Places API - Nearby Search)

## Server Actions

This application uses server actions to interact with the Google Maps API. The main server action implemented is:

`fetchNearbyRestaurants`: This action searches for nearby restaurants based on the user's input and current location. It uses the Google Maps Places API Nearby Search and includes the following functionality:
- Filters results to match restaurants whose names start with the user's query
- Calculates the distance between the user and each restaurant using the Haversine formula
- Sorts results by distance (ascending order)

The server action requires the `NEXT_PUBLIC_GOOGLE_MAP_KEY` environment variable to be set.

## Environment Setup

To run this application, you need to set up the following environment variable:

- `NEXT_PUBLIC_GOOGLE_MAP_KEY`: Your Google Maps API key

Create a `.env.local` file in the root of your project and add the following line:
