import React from 'react';
import { Link } from 'react-router-dom';
import { FaUsers, FaCog, FaGasPump } from 'react-icons/fa';
import { formatCurrency } from '../utils/formatCurrency';

const CarCard = ({ car }) => {
  if (!car) {
    return null;
  }

  // Handle image URL - remove http://localhost:3002 prefix if it exists
  const imageUrl = car.images?.[0] || car.image || 'https://via.placeholder.com/384x192?text=No+Image';
  const displayImageUrl = imageUrl.startsWith('http://localhost:3002') 
    ? imageUrl 
    : `http://localhost:3002${imageUrl}`;

  return (
    <Link to={`/cars/${car._id}`} className="block">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        {/* Car Image */}
        <div className="aspect-w-16 aspect-h-9 relative">
          <img
            src={displayImageUrl}
            alt={`${car.brand} ${car.name}`}
            className="w-full h-48 object-cover"
            loading="lazy"
            width="384" 
            height="192"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/384x192?text=No+Image';
            }}
          />
          <div className="absolute top-4 right-4 bg-white px-2 py-1 rounded-full text-sm font-medium text-gray-700">
            {car.status || 'Available'}
          </div>
        </div>

        {/* Car Details */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {car.brand} {car.name}
              </h3>
              <p className="text-sm text-gray-600">{car.modelYear || 'Year not specified'}</p>
              <p className="text-xs text-gray-500 mt-1">{car.carType || 'Type not specified'}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">
                {formatCurrency(car.rentalPricePerDay || car.price || 0)}
              </p>
              <p className="text-xs text-gray-600">per day</p>
            </div>
          </div>

          {/* Car Specifications */}
          <div className="grid grid-cols-3 gap-4 mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <FaUsers className="text-primary" />
              <span>{car.seats || '?'} seats</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCog className="text-primary" />
              <span>{car.transmission || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaGasPump className="text-primary" />
              <span>{car.fuelType || 'N/A'}</span>
            </div>
          </div>

          {/* Location */}
          <div className="mt-4 text-sm text-gray-600">
            <p>{car.location?.city || car.location || 'Location not specified'}</p>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-2 mt-3">
            {Array.isArray(car.features) && car.features.length > 0 ? (
              car.features.map((feature, idx) => (
                <span
                  key={idx}
                  className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded"
                >
                  {feature}
                </span>
              ))
            ) : (
              <span className="text-gray-400 text-xs">No features listed</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default React.memo(CarCard);