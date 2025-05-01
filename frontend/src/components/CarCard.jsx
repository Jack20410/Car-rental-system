import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCar, FaGasPump, FaCog, FaUsers, FaPlus, FaUser, FaStar, FaStarHalf, FaRegStar } from 'react-icons/fa';
import { formatCurrency } from '../utils/formatCurrency';

const CarCard = ({ car }) => {
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const displayedFeatures = car.features?.slice(0, 4) || [];
  const remainingFeaturesCount = car.features ? Math.max(0, car.features.length - 4) : 0;

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const response = await fetch(`http://localhost:3000/ratings/${car._id}`);
        if (response.ok) {
          const ratings = await response.json();
          if (ratings && ratings.length > 0) {
            const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
            setAverageRating(avg);
            setTotalReviews(ratings.length);
          }
        }
      } catch (error) {
        console.error('Error fetching ratings:', error);
      }
    };

    if (car._id) {
      fetchRatings();
    }
  }, [car._id]);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FaStar key={i} className="text-yellow-400 text-sm" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<FaStarHalf key={i} className="text-yellow-400 text-sm" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-yellow-400 text-sm" />);
      }
    }

    return stars;
  };

  return (
    <Link to={`/cars/${car._id}`} className="block">
      <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="relative h-48">
          <img
            src={car.images?.[0] ? `http://localhost:3002${car.images[0]}` : "placeholder-car-image.jpg"}
            alt={car.name}
            className="w-full h-full object-cover"
          />
          <span className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full ${
            car.status === 'Available' ? 'bg-green-100 text-green-800' : 
            car.status === 'Rented' ? 'bg-blue-100 text-blue-800' : 
            'bg-gray-100 text-gray-800'
          }`}>
            {car.status}
          </span>
        </div>
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-900">{car.name}</h3>
            {car.car_providerId && (
              <div className="flex items-center text-xs text-gray-600">
                <FaUser className="text-primary mr-1" />
                <span>{car.car_providerId.fullName}</span>
              </div>
            )}
          </div>

          {/* Rating Section */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex">
              {renderStars(averageRating)}
            </div>
            <span className="text-sm text-gray-600">
              ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <FaUsers className="text-primary" />
              <span>{car.seats} seats</span>
            </div>
            <div className="flex items-center gap-1">
              <FaGasPump className="text-primary" />
              <span>{car.fuelType}</span>
            </div>
            <div className="flex items-center gap-1">
              <FaCog className="text-primary" />
              <span>{car.transmission}</span>
            </div>
            <div className="flex items-center gap-1">
              <FaCar className="text-primary" />
              <span>{car.modelYear}</span>
            </div>
          </div>
          
          {/* Features Section */}
          {displayedFeatures.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {displayedFeatures.map((feature, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded"
                  >
                    {feature}
                  </span>
                ))}
                {remainingFeaturesCount > 0 && (
                  <span className="inline-flex items-center bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded">
                    <FaPlus className="mr-1" />
                    {remainingFeaturesCount}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <span className="text-md text-primary font-bold">{formatCurrency(car.rentalPricePerDay)} </span>
            <span className="text-sm text-gray-600">/ per day</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CarCard;