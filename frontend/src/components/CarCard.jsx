import React from 'react';
import { Link } from 'react-router-dom';
import { FaUsers, FaCog, FaGasPump } from 'react-icons/fa';
import { formatCurrency } from '../utils/formatCurrency';

const CarCard = ({ car }) => {
  return (
    <Link to={`/cars/${car._id}`} className="block">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        {/* Car Image */}
        <div className="aspect-w-16 aspect-h-9 relative">
          <img
            src={car.images[0]}
            alt={`${car.brand} ${car.name}`}
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-4 right-4 bg-white px-2 py-1 rounded-full text-sm font-medium text-gray-700">
            {car.status}
          </div>
        </div>

        {/* Car Details */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{car.brand} {car.name}</h3>
              <p className="text-sm text-gray-600">{car.modelYear}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">{formatCurrency(car.rentalPricePerDay)}</p>
              <p className="text-xs text-gray-600">per day</p>
            </div>
          </div>

          {/* Car Specifications */}
          <div className="grid grid-cols-3 gap-4 mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <FaUsers className="text-primary" />
              <span>{car.seats} seats</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCog className="text-primary" />
              <span>{car.transmission}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaGasPump className="text-primary" />
              <span>{car.fuelType}</span>
            </div>
          </div>

          {/* Location */}
          <div className="mt-4 text-sm text-gray-600">
            <p>{car.location.city}</p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CarCard; 