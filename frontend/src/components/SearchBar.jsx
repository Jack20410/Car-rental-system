import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchBar = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState({
    location: '',
    pickupDate: '',
    pickupTime: '',
    returnDate: '',
    returnTime: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert the search parameters to query string and navigate to cars page
    const queryString = new URLSearchParams(searchParams).toString();
    navigate(`/cars?${queryString}`);
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6">
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
        {/* Location */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Location to receive the car</label>
          <input
            type="text"
            name="location"
            placeholder="Find and choose a location"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            value={searchParams.location}
            onChange={handleChange}
          />
        </div>

        {/* Pickup Date & Time */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Pickup date</label>
          <div className="flex gap-2">
            <input
              type="date"
              name="pickupDate"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              value={searchParams.pickupDate}
              onChange={handleChange}
            />
            <input
              type="time"
              name="pickupTime"
              className="w-24 px-2 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              value={searchParams.pickupTime}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Return Date & Time */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Return date</label>
          <div className="flex gap-2">
            <input
              type="date"
              name="returnDate"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              value={searchParams.returnDate}
              onChange={handleChange}
            />
            <input
              type="time"
              name="returnTime"
              className="w-24 px-2 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              value={searchParams.returnTime}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Search Button */}
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full md:w-auto px-8 py-2 bg-primary text-white rounded-md hover:bg-secondary transition duration-300"
          >
            Search
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchBar; 