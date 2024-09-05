import RestaurantSearch from '@/app/components/searchmap';
import RestaurantAutocompleteSearch from './components/RestaurantAutocompleteSearch';

function HomePage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Restaurant Finder</h1>
      <RestaurantAutocompleteSearch />
      <RestaurantSearch />
    </div>
  );
}

export default HomePage;
