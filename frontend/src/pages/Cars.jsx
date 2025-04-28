import React, { useState } from 'react';
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

  // Sample car data based on the vehicle model schema
  const sampleCars = [
    {
      _id: '1',
      name: 'Camry',
      brand: 'Toyota',
      modelYear: 2023,
      licensePlate: 'ABC123',
      rentalPricePerDay: 1200000,
      description: 'Comfortable and fuel-efficient sedan',
      images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?ixlib=rb-4.0.3'],
      seats: 5,
      transmission: 'Automatic',
      fuelType: 'Gasoline',
      status: 'Available',
      location: {
        address: '123 Main St',
        city: 'Ho Chi Minh City'
      }
    },
    {
      _id: '2',
      name: 'Model 3',
      brand: 'Tesla',
      modelYear: 2023,
      licensePlate: 'XYZ789',
      rentalPricePerDay: 2500000,
      description: 'Electric luxury sedan with autopilot',
      images: ['https://images.unsplash.com/photo-1536700503339-1e4b06520771?ixlib=rb-4.0.3'],
      seats: 5,
      transmission: 'Automatic',
      fuelType: 'Electric',
      status: 'Available',
      location: {
        address: '456 Tech Ave',
        city: 'Ha Noi'
      }
    },
    {
      _id: '3',
      name: 'X5',
      brand: 'BMW',
      modelYear: 2022,
      licensePlate: 'DEF456',
      rentalPricePerDay: 3000000,
      description: 'Luxury SUV with premium features',
      images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3'],
      seats: 7,
      transmission: 'Automatic',
      fuelType: 'Hybrid',
      status: 'Available',
      location: {
        address: '789 Luxury Blvd',
        city: 'Da Nang'
      }
    },
    {
      _id: '4',
      name: 'Civic',
      brand: 'Honda',
      modelYear: 2023,
      licensePlate: 'GHI789',
      rentalPricePerDay: 800000,
      description: 'Reliable and economical compact car',
      images: ['https://images.unsplash.com/photo-1590362891991-f776e747a588?ixlib=rb-4.0.3'],
      seats: 5,
      transmission: 'Manual',
      fuelType: 'Gasoline',
      status: 'Available',
      location: {
        address: '321 Economy Rd',
        city: 'Nha Trang'
      }
    },
    {
      _id: '5',
      name: 'Corolla Cross',
      brand: 'Toyota',
      modelYear: 2023,
      licensePlate: 'JKL321',
      rentalPricePerDay: 1000000,
      description: 'Compact SUV with spacious interior',
      images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'],
      seats: 5,
      transmission: 'Automatic',
      fuelType: 'Gasoline',
      status: 'Available',
      location: {
        address: '654 Family St',
        city: 'Ho Chi Minh City'
      }
    },
    {
      _id: '6',
      name: 'CX-5',
      brand: 'Mazda',
      modelYear: 2022,
      licensePlate: 'MNO654',
      rentalPricePerDay: 1300000,
      description: 'Stylish and smooth compact SUV',
      images: ['https://images.unsplash.com/photo-1615063029891-497bebd4f03c?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8c3V2JTIwY2FyfGVufDB8fDB8fHww'],
      seats: 5,
      transmission: 'Automatic',
      fuelType: 'Gasoline',
      status: 'Available',
      location: {
        address: '987 Comfort Ave',
        city: 'Da Nang'
      }
    },
    {
      _id: '7',
      name: 'F-150',
      brand: 'Ford',
      modelYear: 2021,
      licensePlate: 'PQR987',
      rentalPricePerDay: 1800000,
      description: 'Powerful pickup truck for all terrains',
      images: ['https://images.unsplash.com/photo-1612563893490-d86ed296e5e6?q=80&w=2669&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'],
      seats: 5,
      transmission: 'Automatic',
      fuelType: 'Diesel',
      status: 'Available',
      location: {
        address: '111 Rugged Rd',
        city: 'Can Tho'
      }
    },
    {
      _id: '8',
      name: 'A4',
      brand: 'Audi',
      modelYear: 2023,
      licensePlate: 'STU111',
      rentalPricePerDay: 2700000,
      description: 'Premium sedan with sleek design',
      images: ['https://images.unsplash.com/photo-1698413935252-04ed6377296d?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzZ8fHN1diUyMGNhcnxlbnwwfHwwfHx8MA%3D%3D'],
      seats: 5,
      transmission: 'Automatic',
      fuelType: 'Gasoline',
      status: 'Available',
      location: {
        address: '222 Prestige St',
        city: 'Ha Noi'
      }
    },
    {
      _id: '9',
      name: 'Sportage',
      brand: 'Kia',
      modelYear: 2022,
      licensePlate: 'VWX222',
      rentalPricePerDay: 1100000,
      description: 'Modern SUV with advanced features',
      images: ['https://images.unsplash.com/photo-1698413935252-04ed6377296d?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzZ8fHN1diUyMGNhcnxlbnwwfHwwfHx8MA%3D%3D'],
      seats: 5,
      transmission: 'Automatic',
      fuelType: 'Gasoline',
      status: 'Available',
      location: {
        address: '333 Adventure Blvd',
        city: 'Hue'
      }
    },
    {
      _id: '10',
      name: 'Outlander',
      brand: 'Mitsubishi',
      modelYear: 2021,
      licensePlate: 'YZA333',
      rentalPricePerDay: 1200000,
      description: 'Versatile SUV perfect for families',
      images: ['https://images.unsplash.com/photo-1698413935252-04ed6377296d?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzZ8fHN1diUyMGNhcnxlbnwwfHwwfHx8MA%3D%3D'],
      seats: 7,
      transmission: 'Automatic',
      fuelType: 'Gasoline',
      status: 'Available',
      location: {
        address: '444 Family Way',
        city: 'Vung Tau'
      }
    }
  ];
  

  // Filter cars based on search parameters and filters
  const filteredCars = sampleCars.filter(car => {
    const location = searchParams.get('location');
    if (location && !car.location.city.toLowerCase().includes(location.toLowerCase())) {
      return false;
    }
    
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(Number);
      if (car.rentalPricePerDay < min || car.rentalPricePerDay > max) {
        return false;
      }
    }

    if (filters.transmission && car.transmission !== filters.transmission) {
      return false;
    }

    if (filters.fuelType && car.fuelType !== filters.fuelType) {
      return false;
    }

    if (filters.seats && car.seats !== parseInt(filters.seats)) {
      return false;
    }

    return true;
  });

  // Sort cars
  const sortedCars = [...filteredCars].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.rentalPricePerDay - b.rentalPricePerDay;
      case 'price-high':
        return b.rentalPricePerDay - a.rentalPricePerDay;
      case 'newest':
        return b.modelYear - a.modelYear;
      default:
        return 0;
    }
  });

  // Thêm các dòng sau để khai báo biến phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;
  const totalPages = Math.ceil(sortedCars.length / pageSize);
  const paginatedCars = sortedCars.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Reset về trang 1 khi filter/sort thay đổi
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
                    <option value="sedan">Sedan</option>
                    <option value="suv">SUV</option>
                    <option value="luxury">Luxury</option>
                    <option value="sports">Sports</option>
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
                    {['GPS', 'Bluetooth', 'Backup Camera', 'Sunroof'].map((feature) => (
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
                  {sortedCars.length} cars found
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
              {paginatedCars.map(car => (
                <CarCard key={car._id} car={car} />
              ))}
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

            {paginatedCars.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <h3 className="text-xl font-medium text-gray-900">Không tìm thấy xe nào</h3>
                <p className="mt-2 text-gray-600">Hãy thử thay đổi bộ lọc</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cars;