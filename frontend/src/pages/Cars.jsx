import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import CarCard from '../components/CarCard';
import SearchBar from '../components/SearchBar';
import { formatCurrency } from '../utils/formatCurrency';

const Cars = () => {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    priceRange: '',
    carType: '',
    transmission: '',
    fuelType: '',
    seats: '',
    features: []
  });
  const [sortBy, setSortBy] = useState('recommended');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch cars based on search parameters
  useEffect(() => {
    const fetchCars = async () => {
      try {
        setLoading(true);
        setError(null);

        const city = searchParams.get('city');
        
        // Construct the URL - if city is provided use it as parameter, otherwise fetch all cars
        const url = city 
          ? `http://localhost:3000/vehicles?city=${encodeURIComponent(city)}`
          : 'http://localhost:3000/vehicles';
        console.log('Fetching cars from:', url);

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch cars');
        }

        const result = await response.json();
        console.log('API Response:', result);

        if (!result.success) {
          throw new Error(result.message || 'Error fetching cars');
        }

        const vehicles = Array.isArray(result.data?.vehicles) 
          ? result.data.vehicles 
          : result.data || [];

        if (vehicles.length === 0) {
          setError(city ? `No cars available in ${city}` : 'No cars available');
          setCars([]);
        } else {
          // Process and validate each vehicle
          const validVehicles = vehicles.filter(vehicle => {
            if (!vehicle || typeof vehicle !== 'object') return false;
            if (!vehicle._id) return false;

            // Ensure required fields have default values
            vehicle.brand = vehicle.brand || 'Unknown Brand';
            vehicle.name = vehicle.name || 'Unnamed Vehicle';
            vehicle.rentalPricePerDay = vehicle.rentalPricePerDay || vehicle.price || 0;
            vehicle.status = vehicle.status || 'Available';
            
            // Normalize location data
            if (typeof vehicle.location === 'string') {
              vehicle.location = { city: vehicle.location };
            } else if (!vehicle.location || typeof vehicle.location !== 'object') {
              vehicle.location = { city: city || 'Location not specified' };
            }

            return true;
          });

          console.log('Valid vehicles:', validVehicles);
          setCars(validVehicles);
        }
      } catch (err) {
        console.error('Error fetching cars:', err);
        setError(err.message);
        setCars([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, [searchParams]);

  // Filter cars based on applied filters
  const filteredCars = React.useMemo(() => {
    if (!Array.isArray(cars)) {
      return [];
    }

    return cars.filter(car => {
      if (!car) return false;

      // Price Range Filter
      if (filters.priceRange) {
        const [min, max] = filters.priceRange.split('-').map(Number);
        const price = car.rentalPricePerDay || car.price || 0;
        if (price < min || (max && price > max)) {
          return false;
        }
      }

      // Car Type Filter
      if (filters.carType && car.carType !== filters.carType) {
        return false;
      }

      // Transmission Filter
      if (filters.transmission && car.transmission !== filters.transmission) {
        return false;
      }

      // Fuel Type Filter
      if (filters.fuelType && car.fuelType !== filters.fuelType) {
        return false;
      }

      // Seats Filter
      if (filters.seats) {
        const seatCount = parseInt(car.seats) || 0;
        const filterSeats = parseInt(filters.seats);
        if (filters.seats === '7') {
          if (seatCount < 7) return false;
        } else if (seatCount !== filterSeats) {
          return false;
        }
      }

      // Features Filter
      if (filters.features.length > 0) {
        const carFeatures = Array.isArray(car.features) ? car.features : [];
        if (!filters.features.every(f => carFeatures.includes(f))) {
          return false;
        }
      }

      return true;
    });
  }, [cars, filters]);

  // Sort filtered cars
  const sortedCars = React.useMemo(() => {
    return [...filteredCars].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.rentalPricePerDay || 0) - (b.rentalPricePerDay || 0);
        case 'price-high':
          return (b.rentalPricePerDay || 0) - (a.rentalPricePerDay || 0);
        case 'newest':
          return (b.modelYear || 0) - (a.modelYear || 0);
        default:
          return 0;
      }
    });
  }, [filteredCars, sortBy]);

  // Lọc chỉ các xe Available
  const availableCars = sortedCars.filter(car => car.status === 'Available');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;
  const totalPages = Math.ceil(availableCars.length / pageSize);
  const paginatedCars = availableCars.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Reset to page 1 when filters or sort changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy, searchParams]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFeatureToggle = (feature) => {
    setFilters(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  // Count active filters
  const activeFilterCount = Object.entries(filters).reduce((count, [key, value]) => {
    if (key === 'features') {
      return count + value.length;
    }
    return value ? count + 1 : count;
  }, 0);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Search Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <SearchBar />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Mobile Filter Toggle Button */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-lg shadow-sm text-primary font-medium hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-white">
                  {activeFilterCount}
                </span>
              )}
            </span>
            <svg 
              className={`h-5 w-5 transform transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filter Panel */}
          <div className={`lg:w-1/4 ${isFilterOpen ? 'block' : 'hidden'} lg:block transition-all duration-300 ease-in-out`}>
            <div className="bg-white rounded-lg shadow-sm p-5 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => setFilters({
                      priceRange: '',
                      carType: '',
                      transmission: '',
                      fuelType: '',
                      seats: '',
                      features: []
                    })}
                    className="text-sm text-primary hover:text-secondary"
                  >
                    Clear all
                  </button>
                )}
              </div>
              
              {/* Filter groups */}
              <div className="space-y-5">
                {/* Price Range Filter */}
                <div className="pb-4 border-b border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
                    value={filters.priceRange}
                    onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                  >
                    <option value="">Any Price</option>
                    <option value="0-1000000">Under {formatCurrency(1000000)}</option>
                    <option value="1000000-2000000">{formatCurrency(1000000)} - {formatCurrency(2000000)}</option>
                    <option value="2000000-3000000">{formatCurrency(2000000)} - {formatCurrency(3000000)}</option>
                    <option value="3000000-5000000">{formatCurrency(3000000)}+</option>
                  </select>
                </div>

                {/* Car Type Filter */}
                <div className="pb-4 border-b border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Car Type</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
                    value={filters.carType}
                    onChange={(e) => handleFilterChange('carType', e.target.value)}
                  >
                    <option value="">All Types</option>
                    <option value="Sedan">Sedan</option>
                    <option value="SUV">SUV</option>
                    <option value="Convertible">Convertible</option>
                    <option value="Coupe">Coupe</option>
                    <option value="Hatchback">Hatchback</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Transmission Filter */}
                <div className="pb-4 border-b border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transmission</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Automatic', 'Manual'].map((type) => (
                      <label key={type} className={`flex items-center justify-center px-3 py-2 rounded-md cursor-pointer border ${filters.transmission === type ? 'border-primary bg-blue-50 text-primary' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                        <input
                          type="radio"
                          name="transmission"
                          value={type}
                          checked={filters.transmission === type}
                          onChange={(e) => handleFilterChange('transmission', e.target.value)}
                          className="sr-only"
                        />
                        <span className="text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Fuel Type Filter */}
                <div className="pb-4 border-b border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Type</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
                    value={filters.fuelType}
                    onChange={(e) => handleFilterChange('fuelType', e.target.value)}
                  >
                    <option value="">Any Fuel Type</option>
                    <option value="Gasoline">Gasoline</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                {/* Seats Filter */}
                <div className="pb-4 border-b border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Seats</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['2', '4', '5', '7+'].map((seats) => (
                      <label 
                        key={seats} 
                        className={`flex items-center justify-center px-3 py-2 rounded-md cursor-pointer border text-center ${filters.seats === seats.replace('+', '') ? 'border-primary bg-blue-50 text-primary' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                      >
                        <input
                          type="radio"
                          name="seats"
                          value={seats.replace('+', '')}
                          checked={filters.seats === seats.replace('+', '')}
                          onChange={(e) => handleFilterChange('seats', e.target.value)}
                          className="sr-only"
                        />
                        <span className="text-sm">{seats}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Features Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'Entertainment',
                      'Tire Pressure Monitoring System',
                      'Spare Tire',
                      'Navigation',
                      'ETC',
                      'Head Up Display',
                      'Impact Sensor',
                      '360 Camera',
                      'Airbags',
                      'Reverse Camera',
                      'USB Port',
                      'GPS',
                      'Bluetooth',
                      'Sunroof'
                    ].map((feature) => (
                      <label 
                        key={feature} 
                        className={`flex items-center px-3 py-2 rounded-md cursor-pointer border ${filters.features.includes(feature) ? 'border-primary bg-blue-50 text-primary' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded mr-2"
                          checked={filters.features.includes(feature)}
                          onChange={() => handleFeatureToggle(feature)}
                        />
                        <span className="text-sm">{feature}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Apply Filters Button - Mobile Only */}
              <button
                onClick={() => setIsFilterOpen(false)}
                className="w-full mt-6 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-secondary transition-colors duration-150 lg:hidden"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:w-3/4">
            {/* Sort and Results Count */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-center">
                <p className="text-gray-600 mb-4 sm:mb-0">
                  {availableCars.length} cars found
                </p>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Sort by:</span>
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="recommended">Recommended</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="newest">Newest First</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Cars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-600">Loading cars...</p>
                </div>
              ) : error ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-red-600">{error}</p>
                </div>
              ) : paginatedCars.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-white rounded-lg shadow-sm">
                  <h3 className="text-xl font-medium text-gray-900">No cars found</h3>
                  <p className="mt-2 text-gray-600">Try adjusting your filters</p>
                </div>
              ) : (
                paginatedCars.map(car => (
                  <CarCard key={car._id || car.id} car={car} />
                ))
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8 space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded border bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Trang trước
                </button>
                {[...Array(totalPages)].map((_, idx) => (
                  <button
                    key={idx + 1}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`px-3 py-1 rounded border ${currentPage === idx + 1 ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded border bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Trang sau
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cars;