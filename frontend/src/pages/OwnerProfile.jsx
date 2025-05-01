import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaStar, FaStarHalf, FaRegStar, FaUserCheck, FaCar, FaPhone, FaEnvelope, FaThumbsUp } from 'react-icons/fa';
import { MdVerified, MdLocationOn, MdChevronLeft, MdChevronRight, MdSort } from 'react-icons/md';
import { BsSpeedometer2, BsCalendarCheck } from 'react-icons/bs';
import { formatCurrency } from '../utils/formatCurrency';
import CarCard from '../components/CarCard';

const OwnerProfile = () => {
  const { id } = useParams();
  const [owner, setOwner] = useState(null);
  const [ownerCars, setOwnerCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentCarIndex, setCurrentCarIndex] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const [showAllReviews, setShowAllReviews] = useState(false);

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
        const cars = carsData.data?.vehicles || [];
        setOwnerCars(cars);

        // Fetch all ratings for these cars
        if (cars.length > 0) {
          const vehicleIds = cars.map(car => car._id).join(',');
          const ratingsResponse = await fetch(`http://localhost:3000/ratings/by-provider/${id}?vehicleIds=${vehicleIds}`);
          if (!ratingsResponse.ok) {
            throw new Error('Failed to fetch reviews');
          }
          const ratingsData = await ratingsResponse.json();
          setReviews(
            ratingsData.map(rating => ({
              id: rating.id || rating._id,
              user: {
                name: rating.userName || "Anonymous",
                avatar: rating.userAvatar || "http://localhost:3001/avatar/user.png",
                isVerified: true,
              },
              rating: rating.rating,
              comment: rating.comment,
              date: rating.createdAt,
              carRented: cars.find(car => car._id === rating.vehicleId)?.name || "",
              rentalDuration: "N/A", // You can enhance this if you store duration
              helpful: rating.helpful || 0,
            }))
          );
        } else {
          setReviews([]);
        }
      } catch (error) {
        console.error('Error fetching owner data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOwnerData();
  }, [id]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // Simulated reviews data - replace with actual API call
        const mockReviews = [
          {
            id: 1,
            user: {
              name: "John Doe",
              avatar: "http://localhost:3001/avatar/user.png",
              isVerified: true
            },
            rating: 5,
            comment: "Great car provider! Very professional and responsive.",
            date: "2024-02-15",
            carRented: "Toyota Camry",
            rentalDuration: "3 days",
            helpful: 12
          },
          {
            id: 2,
            user: {
              name: "Alice Smith",
              avatar: "http://localhost:3001/avatar/user.png",
              isVerified: true
            },
            rating: 4.5,
            comment: "Very good experience overall. The car was in perfect condition.",
            date: "2024-02-10",
            carRented: "Honda Civic",
            rentalDuration: "5 days",
            helpful: 8
          },
          // Add more mock reviews as needed
        ];
        setReviews(mockReviews);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };

    fetchReviews();
  }, [id]);

  const averageRating = reviews.length
  ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
  : "N/A";
const totalRentals = ownerCars.reduce((sum, car) => sum + (car.totalRentals || 0), 0);

const fiveStarCount = reviews.filter(r => Math.round(r.rating) === 5).length;
const fiveStarRatio = reviews.length ? ((fiveStarCount / reviews.length) * 100).toFixed(0) + "%" : "N/A";

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

  const sortReviews = (reviews) => {
    switch (sortBy) {
      case 'highest':
        return [...reviews].sort((a, b) => b.rating - a.rating);
      case 'lowest':
        return [...reviews].sort((a, b) => a.rating - b.rating);
      case 'helpful':
        return [...reviews].sort((a, b) => b.helpful - a.helpful);
      case 'newest':
      default:
        return [...reviews].sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  };

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);
  const sortedReviews = sortReviews(displayedReviews);

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
            <div className="relative">
              <img
                src={owner.avatar 
                  ? `http://localhost:3001${owner.avatar.replace('/uploads', '')}` 
                  : "http://localhost:3001/avatar/user.png"}
                alt={owner.fullName}
                className="w-28 h-28 rounded-full object-cover border-4 border-primary"
              />
              <MdVerified className="text-primary text-2xl absolute -bottom-1 -right-1 bg-white rounded-full p-1" title="Verified Owner" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{owner.fullName}</h1>
                <span className="bg-primary bg-opacity-10 text-primary text-sm px-3 py-1 rounded-full">Car Provider</span>
              </div>
              <p className="text-gray-600 mb-6">
                Member since {owner.createdAt 
                  ? new Date(owner.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) 
                  : 'Unknown date'}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                  <FaCar className="text-primary text-xl mb-2" />
                  <span className="font-semibold text-lg">{ownerCars.length}</span>
                  <span className="text-sm text-gray-600">Cars Listed</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                  <FaStar className="text-primary text-xl mb-2" />
                  <span className="font-semibold text-lg">{averageRating}</span>
                  <span className="text-sm text-gray-600">Average Rating</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                  <BsSpeedometer2 className="text-primary text-xl mb-2" />
                  <span className="font-semibold text-lg">{totalRentals}</span>
                  <span className="text-sm text-gray-600">Rental Completed</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                  <MdVerified className="text-primary text-xl mb-2" />
                  <span className="font-semibold text-lg">{fiveStarRatio}</span>
                  <span className="text-sm text-gray-600">5 star rate</span>
                </div>
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

        {/* Reviews Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <FaStar className="text-primary" />
              Reviews and Ratings
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <MdSort className="text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm text-gray-600 border-none focus:ring-0 cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="highest">Highest Rating</option>
                  <option value="lowest">Lowest Rating</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reviews Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-gray-900">{averageRating}</span>
              <div className="flex gap-1 my-2">{renderStars(Number(averageRating))}</div>
              <span className="text-sm text-gray-600">Average Rating</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-gray-900">{reviews.length}</span>
              <BsSpeedometer2 className="text-primary text-xl my-2" />
              <span className="text-sm text-gray-600">Total Reviews</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
              <MdVerified className="text-primary text-xl mb-2" />
              <span className="font-semibold text-lg">{fiveStarRatio}</span>
              <span className="text-sm text-gray-600">5 star rate</span>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-6">
            {sortedReviews.map((review) => (
              <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={review.user.avatar}
                      alt={review.user.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{review.user.name}</h3>
                        {review.user.isVerified && (
                          <MdVerified className="text-primary" title="Verified User" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>{new Date(review.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{review.carRented}</span>
                        <span>•</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {renderStars(review.rating)}
                  </div>
                </div>
                <p className="text-gray-700 mb-4">{review.comment}</p>
              </div>
            ))}
          </div>

          {/* Show More Button */}
          {reviews.length > 3 && (
            <div className="text-center mt-8">
              <button
                onClick={() => setShowAllReviews(!showAllReviews)}
                className="text-primary font-medium hover:text-secondary transition-colors"
              >
                {showAllReviews ? "Show Less" : `Show All ${reviews.length} Reviews`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerProfile;