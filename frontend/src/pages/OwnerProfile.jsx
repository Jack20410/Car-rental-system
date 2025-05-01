import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaStar, FaStarHalf, FaRegStar, FaUserCheck, FaCar, FaPhone, FaEnvelope } from 'react-icons/fa';
import { MdVerified, MdLocationOn, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { BsSpeedometer2 } from 'react-icons/bs';
import { formatCurrency } from '../utils/formatCurrency';
import CarCard from '../components/CarCard';

const OwnerProfile = () => {
  const { id } = useParams();
  const [owner, setOwner] = useState(null);
  const [ownerCars, setOwnerCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentCarIndex, setCurrentCarIndex] = useState(0);

  useEffect(() => {
    const fetchOwnerData = async () => {
      try {
        setLoading(true);
        // Fetch owner details
        const ownerResponse = await fetch(`http://localhost:3000/users/${id}`);
        if (!ownerResponse.ok) {
          throw new Error('Failed to fetch owner details');
        }
        const ownerData = await ownerResponse.json();
        setOwner(ownerData.data);

        // Fetch owner's cars
        const carsResponse = await fetch(`http://localhost:3000/vehicles?car_providerId=${id}`);
        if (!carsResponse.ok) {
          throw new Error('Failed to fetch owner cars');
        }
        const carsData = await carsResponse.json();
        setOwnerCars(carsData.data?.vehicles || []);

      } catch (error) {
        console.error('Error fetching owner data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOwnerData();
  }, [id]);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FaStar key={i} className="text-yellow-400" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<FaStarHalf key={i} className="text-yellow-400" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-yellow-400" />);
      }
    }

    return stars;
  };

  const handlePrevCars = () => {
    setCurrentCarIndex(prev => Math.max(0, prev - 3));
  };

  const handleNextCars = () => {
    setCurrentCarIndex(prev => Math.min(ownerCars.length - 3, prev + 3));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Car Provider Not Found</h2>
          <p className="text-gray-600">The car provider you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Owner Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-start gap-6">
            <img
              src={owner.avatar 
                ? `http://localhost:3001${owner.avatar.replace('/uploads', '')}` 
                : "http://localhost:3001/avatar/user.png"}
              alt={owner.fullName}
              className="w-24 h-24 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{owner.fullName}</h1>
                <MdVerified className="text-primary text-xl" title="Verified Owner" />
              </div>
              <p className="text-gray-600 mb-4">
                Member since {owner.createdAt 
                  ? new Date(owner.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) 
                  : 'Unknown date'}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <FaCar className="text-primary" />
                  <span>{ownerCars.length} Cars Listed</span>
                </div>
                {owner.email && (
                  <div className="flex items-center gap-2">
                    <FaEnvelope className="text-primary" />
                    <span>{owner.email}</span>
                  </div>
                )}
                {owner.phoneNumber && (
                  <div className="flex items-center gap-2">
                    <FaPhone className="text-primary" />
                    <span>{owner.phoneNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Owner's Cars */}
        {ownerCars.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Available Cars</h2>
              {ownerCars.length > 3 && (
                <div className="flex gap-2">
                  <button
                    onClick={handlePrevCars}
                    disabled={currentCarIndex === 0}
                    className={`p-2 rounded-full ${
                      currentCarIndex === 0
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-primary hover:bg-gray-100'
                    }`}
                  >
                    <MdChevronLeft size={24} />
                  </button>
                  <button
                    onClick={handleNextCars}
                    disabled={currentCarIndex >= ownerCars.length - 3}
                    className={`p-2 rounded-full ${
                      currentCarIndex >= ownerCars.length - 3
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-primary hover:bg-gray-100'
                    }`}
                  >
                    <MdChevronRight size={24} />
                  </button>
                </div>
              )}
            </div>
            
            <div className="relative overflow-hidden">
              <div 
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${currentCarIndex * (100 / 3)}%)` }}
              >
                {ownerCars.map(car => (
                  <div key={car._id} className="w-1/3 flex-shrink-0 px-2">
                    <CarCard car={car} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Cars Available</h2>
            <p className="text-gray-600">This car provider hasn't listed any cars yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerProfile; 