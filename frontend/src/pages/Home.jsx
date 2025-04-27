import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import SearchBar from '../components/SearchBar';
import CarCard from '../components/CarCard';
import { TruckIcon, ShieldCheckIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import '../styles/Home.css'; // Updated import path for styles folder

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef(null);
  const autoScrollRef = useRef(null);

  // Featured cars (using the same sample data for now)
  const featuredCars = useMemo(() => [
    {
      _id: '1',
      name: 'Camry',
      brand: 'Toyota',
      modelYear: 2023,
      licensePlate: 'ABC123',
      rentalPricePerDay: 1000000,
      description: 'Comfortable and fuel-efficient sedan',
      images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?ixlib=rb-4.0.3'],
      seats: 5,
      transmission: 'Automatic',
      fuelType: 'Gasoline',
      status: 'Available',
      location: {
        address: '123 Main St',
        city: 'New York'
      }
    },
    {
      _id: '2',
      name: 'Model 3',
      brand: 'Tesla',
      modelYear: 2023,
      licensePlate: 'XYZ789',
      rentalPricePerDay: 1500000,
      description: 'Electric luxury sedan with autopilot',
      images: ['https://images.unsplash.com/photo-1536700503339-1e4b06520771?ixlib=rb-4.0.3'],
      seats: 5,
      transmission: 'Automatic',
      fuelType: 'Electric',
      status: 'Available',
      location: {
        address: '456 Tech Ave',
        city: 'San Francisco'
      }
    },
    {
      _id: '3',
      name: 'X5',
      brand: 'BMW',
      modelYear: 2022,
      licensePlate: 'DEF456',
      rentalPricePerDay: 1500000,
      description: 'Luxury SUV with premium features',
      images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3'],
      seats: 7,
      transmission: 'Automatic',
      fuelType: 'Hybrid',
      status: 'Available',
      location: {
        address: '789 Luxury Blvd',
        city: 'Miami'
      }
    }
  ], []);

  // Popular locations data
  const popularLocations = useMemo(() => [
    {
      id: 1,
      name: 'Ho Chi Minh City',
      carCount: '5000+ cars',
      image: 'https://nld.mediacdn.vn/291774122806476800/2024/8/16/tp-65-1723817004792851519414.jpg',
      description: 'Vietnam\'s largest city with diverse vehicle options'
    },
    {
      id: 2,
      name: 'Hanoi',
      carCount: '2500+ cars',
      image: 'https://images.contentstack.io/v3/assets/blt1306150c2c4003bc/bltd403157dcd0ef9a3/660caf8a6c4a3972dfe468d3/00-what-to-see-and-do-in-hanoi-getty-cropped.jpg?auto=webp&width=784',
      description: 'The capital city with extensive car rental services'
    },
    {
      id: 3,
      name: 'Da Nang',
      carCount: '500+ cars',
      image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?ixlib=rb-4.0.3',
      description: 'Coastal city with modern rental fleet'
    },
    {
      id: 4,
      name: 'Nha Trang',
      carCount: '350+ cars',
      image: 'https://baokhanhhoa.vn/file/e7837c02857c8ca30185a8c39b582c03/012025/z6223362576777_15a21ef00a73b25851a3972d86795475_20250113104122.jpg',
      description: 'Beach resort city with convenient rental options'
    },
    {
      id: 5,
      name: 'Quy Nhon',
      carCount: '200+ cars',
      image: 'https://benhvienquynhon.gov.vn/wp-content/uploads/2023/05/bai-tam-quy-nhon.jpg',
      description: 'Emerging coastal destination with quality vehicles'
    }
  ], []);

  const goToSlide = useCallback((index) => {
    setCurrentSlide(index);
    if (sliderRef.current) {
      const slideWidth = sliderRef.current.querySelector('.location-card').offsetWidth;
      const scrollPosition = index * (slideWidth + 24);
      sliderRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  // Auto slide functionality
  useEffect(() => {
    // Clear any existing interval when component re-renders
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
    }
    
    autoScrollRef.current = setInterval(() => {
      if (sliderRef.current && popularLocations.length > 0) {
        const nextSlide = (currentSlide + 1) % popularLocations.length;
        goToSlide(nextSlide);
      }
    }, 3000);
    
    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [currentSlide, popularLocations.length, goToSlide]);

  return (
    <div>
      {/* Hero Section with Search */}
      <div className="relative bg-gray-900 text-white">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?ixlib=rb-4.0.3"
            alt="Hero background"
            className="w-full h-full object-cover opacity-50"
            loading="eager"
            fetchPriority="high"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-8">
            Find Your Perfect Rental Car
          </h1>
          <div className="max-w-5xl mx-auto">
            <SearchBar />
          </div>
        </div>
      </div>

      {/* Popular Locations Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Popular Locations</h2>
          <p className="mt-4 text-xl text-gray-600">
            Choose from our most popular rental locations
          </p>
        </div>
        <div className="relative overflow-hidden">
          <div 
            ref={sliderRef}
            className="flex overflow-x-auto pb-6 space-x-6 snap-x hide-scrollbar overscroll-x-none will-change-transform"
          >
            {popularLocations.map((location, index) => (
              <Link
                key={location.id}
                to={`/cars?location=${encodeURIComponent(location.name)}`}
                className={`location-card group relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex-shrink-0 w-full sm:w-80 md:w-96 snap-start ${index === currentSlide ? 'border-2 border-primary' : ''}`}
              >
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={location.image}
                    alt={location.name}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    width="384"
                    height="256"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent">
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-2xl font-bold mb-2">{location.name}</h3>
                    <p className="text-sm opacity-90 mb-2">{location.description}</p>
                    <p className="text-sm font-semibold bg-primary/80 inline-block px-3 py-1 rounded-full">
                      {location.carCount}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {/* Slide indicators */}
          <div className="flex justify-center mt-4 space-x-2">
            {popularLocations.map((_, index) => (
              <button
                key={`indicator-${index}`}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  currentSlide === index ? 'w-6 bg-primary' : 'w-2 bg-gray-300'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Featured Cars Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Featured Cars</h2>
          <p className="mt-4 text-xl text-gray-600">
            Discover our most popular rental vehicles
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredCars.map(car => (
            <CarCard key={car._id} car={car} />
          ))}
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose Us</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-primary text-4xl mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
              <p className="text-gray-600">Round-the-clock customer support for your convenience</p>
            </div>
            <div className="text-center p-6">
              <div className="text-primary text-4xl mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality Guaranteed</h3>
              <p className="text-gray-600">All our vehicles are regularly maintained and inspected</p>
            </div>
            <div className="text-center p-6">
              <div className="text-primary text-4xl mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Best Rates</h3>
              <p className="text-gray-600">Competitive pricing with no hidden charges</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Home); 