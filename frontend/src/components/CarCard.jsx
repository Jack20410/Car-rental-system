import React from 'react';
import { Link } from 'react-router-dom';
import { FaCar, FaGasPump, FaCog, FaUsers, FaPlus } from 'react-icons/fa';
import { formatCurrency } from '../utils/formatCurrency';

const CarCard = ({ car }) => {
  const displayedFeatures = car.features?.slice(0, 4) || [];
  const remainingFeaturesCount = car.features ? Math.max(0, car.features.length - 4) : 0;

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
          <h3 className="font-semibold text-gray-900 mb-2">{car.name}</h3>
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