import React, { useState, useEffect, useRef, useCallback } from 'react';
import SearchBar from '../components/SearchBar';
import CarCard from '../components/CarCard';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredCars, setFeaturedCars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const sliderRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const autoScrollRef = useRef(null);
  const [popularLocations, setPopularLocations] = useState([
    {
      id: 1,
      name: 'Ho Chi Minh City',
      image: 'https://nld.mediacdn.vn/291774122806476800/2024/8/16/tp-65-1723817004792851519414.jpg',
      description: 'Vietnam\'s largest city with diverse vehicle options',
      carCount: 'Loading...'
    },
    {
      id: 2,
      name: 'Ha Noi',
      image: 'https://images.contentstack.io/v3/assets/blt1306150c2c4003bc/bltd403157dcd0ef9a3/660caf8a6c4a3972dfe468d3/00-what-to-see-and-do-in-hanoi-getty-cropped.jpg?auto=webp&width=784',
      description: 'The capital city with extensive car rental services',
      carCount: 'Loading...'
    },
    {
      id: 3,
      name: 'Da Nang',
      image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?ixlib=rb-4.0.3',
      description: 'Coastal city with modern rental fleet',
      carCount: 'Loading...'
    },
    {
      id: 4,
      name: 'Nha Trang',
      image: 'https://baokhanhhoa.vn/file/e7837c02857c8ca30185a8c39b582c03/012025/z6223362576777_15a21ef00a73b25851a3972d86795475_20250113104122.jpg',
      description: 'Beach resort city with convenient rental options',
      carCount: 'Loading...'
    },
    {
      id: 5,
      name: 'Quy Nhon',
      image: 'https://benhvienquynhon.gov.vn/wp-content/uploads/2023/05/bai-tam-quy-nhon.jpg',
      description: 'Emerging coastal destination with quality vehicles',
      carCount: 'Loading...'
    }
  ]);
  const touchTimeout = useRef(null);

  // Fetch car counts for each location
  useEffect(() => {
    const fetchCarCounts = async () => {
      try {
        const updatedLocations = await Promise.all(
          popularLocations.map(async (location) => {
            try {
              const response = await fetch(`http://localhost:3000/vehicles?city=${encodeURIComponent(location.name)}`);
              if (!response.ok) {
                throw new Error(`Failed to fetch cars for ${location.name}`);
              }
              const data = await response.json();
              const carCount = (data.data?.vehicles?.filter(car => car.status === 'Available').length) || 0;
              return {
                ...location,
                carCount: `${carCount} cars available`
              };
            } catch (error) {
              console.error(`Error fetching cars for ${location.name}:`, error);
              return {
                ...location,
                carCount: 'No data available'
              };
            }
          })
        );
        setPopularLocations(updatedLocations);
      } catch (error) {
        console.error('Error fetching car counts:', error);
      }
    };

    fetchCarCounts();
  }, []);

  // Fetch featured cars from API
  useEffect(() => {
    const fetchCars = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:3000/vehicles');
        if (!response.ok) {
          throw new Error('Failed to fetch cars');
        }
        const result = await response.json();
        
        if (!result.data?.vehicles || !Array.isArray(result.data.vehicles)) {
          throw new Error('Invalid response format: vehicles array not found');
        }
        
        // Filter out invalid vehicles and ensure required fields are present
        const vehicles = result.data.vehicles.filter(vehicle => {
          if (!vehicle || typeof vehicle !== 'object') return false;
          if (!vehicle._id || !vehicle.name) return false;
          
          // Ensure the vehicle has all required fields, use defaults if missing
          vehicle.brand = vehicle.brand || 'Unknown Brand';
          vehicle.name = vehicle.name || 'Unnamed Vehicle';
          vehicle.rentalPricePerDay = vehicle.rentalPricePerDay || vehicle.price || 0;
          vehicle.status = vehicle.status || 'Available';
          vehicle.location = vehicle.location || { city: 'Location not specified' };
          if (typeof vehicle.location === 'string') {
            vehicle.location = { city: vehicle.location };
          }
          
          return true;
        });
        
        if (vehicles.length === 0) {
          setError('No vehicles available');
          return;
        }
        
        // Lọc chỉ các xe Available
        const availableVehicles = vehicles.filter(car => car.status === 'Available');
        // Get random cars but ensure they have images
        const carsWithImages = availableVehicles.filter(car => car.images?.length > 0 || car.image);
        const randomCars = [...(carsWithImages.length > 0 ? carsWithImages : availableVehicles)]
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.min(6, availableVehicles.length));

        console.log('Featured cars:', randomCars);
        setFeaturedCars(randomCars);
      } catch (err) {
        console.error('Error fetching cars:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCars();
  }, []);

  const goToSlide = useCallback((index) => {
    if (sliderRef.current) {
      const slideWidth = sliderRef.current.querySelector('.location-card').offsetWidth;
      const scrollPosition = index * (slideWidth + 24);
      sliderRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
      setCurrentSlide(index);
    }
  }, []);

  const goToNextSlide = useCallback(() => {
    if (popularLocations.length > 0) {
      const nextSlide = (currentSlide + 1) % popularLocations.length;
      goToSlide(nextSlide);
    }
  }, [currentSlide, popularLocations.length, goToSlide]);

  const goToPrevSlide = useCallback(() => {
    if (popularLocations.length > 0) {
      const prevSlide = (currentSlide - 1 + popularLocations.length) % popularLocations.length;
      goToSlide(prevSlide);
    }
  }, [currentSlide, popularLocations.length, goToSlide]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        goToPrevSlide();
      } else if (e.key === 'ArrowRight') {
        goToNextSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextSlide, goToPrevSlide]);

  // Touch event handling
  useEffect(() => {
    const slider = sliderRef.current;
    if (slider) {
      const handleTouchStart = (e) => {
        setIsDragging(true);
        setStartX(e.touches[0].pageX - slider.offsetLeft);
        setScrollLeft(slider.scrollLeft);
      };

      const handleTouchMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.touches[0].pageX - slider.offsetLeft;
        const walk = (x - startX) * 2;
        slider.scrollLeft = scrollLeft - walk;
      };

      const handleTouchEnd = () => {
        setIsDragging(false);
        if (slider) {
          const slideWidth = slider.querySelector('.location-card').offsetWidth + 24;
          const newIndex = Math.round(slider.scrollLeft / slideWidth);
          setCurrentSlide(newIndex % popularLocations.length);
        }
      };

      slider.addEventListener('touchstart', handleTouchStart);
      slider.addEventListener('touchmove', handleTouchMove);
      slider.addEventListener('touchend', handleTouchEnd);

      return () => {
        slider.removeEventListener('touchstart', handleTouchStart);
        slider.removeEventListener('touchmove', handleTouchMove);
        slider.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, popularLocations.length]);

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
        <div className="relative overflow-hidden group">
          {/* Navigation Buttons */}
          <div className="absolute inset-y-0 left-2 z-20 flex items-center justify-center">
            <button
              onClick={goToPrevSlide}
              className="flex items-center justify-center w-12 h-12 bg-black/30 hover:bg-primary text-white rounded-full shadow-xl transition-all duration-300 backdrop-blur-sm hover:scale-110 group-hover:opacity-100 opacity-0"
              aria-label="Previous slide"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          
          <div className="absolute inset-y-0 right-2 z-20 flex items-center justify-center">
            <button
              onClick={goToNextSlide}
              className="flex items-center justify-center w-12 h-12 bg-black/30 hover:bg-primary text-white rounded-full shadow-xl transition-all duration-300 backdrop-blur-sm hover:scale-110 group-hover:opacity-100 opacity-0"
              aria-label="Next slide"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <div 
            ref={sliderRef}
            className="flex overflow-x-auto pb-6 space-x-6 snap-x hide-scrollbar overscroll-x-none will-change-transform touch-pan-x px-14"
            role="region"
            aria-label="Popular locations carousel"
            style={{ scrollBehavior: 'smooth' }}
          >
            {popularLocations.map((location, index) => (
              <Link
                key={location.id}
                to={`/cars?city=${(location.name)}`}
                className="location-card group relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex-shrink-0 w-full sm:w-80 md:w-96 snap-start"
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
            
            {/* Clone first few items for infinite scroll effect */}
            {popularLocations.slice(0, 2).map((location, index) => (
              <Link
                key={`clone-${location.id}`}
                to={`/cars?city=${(location.name)}`}
                className="location-card group relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex-shrink-0 w-full sm:w-80 md:w-96 snap-start"
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
          <div className="flex justify-center mt-4 space-x-3">
            {popularLocations.map((_, index) => (
              <button
                key={`indicator-${index}`}
                onClick={() => goToSlide(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  currentSlide === index ? 'w-8 bg-primary' : 'w-2.5 bg-gray-300 hover:bg-gray-400'
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
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-600 py-8">
            <p>{error}</p>
            <p className="mt-2">Please try again later</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCars.map(car => (
              <CarCard key={car._id} car={car} />
            ))}
          </div>
        )}
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