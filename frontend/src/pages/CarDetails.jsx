import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaCar, FaGasPump, FaCog, FaUsers, FaCalendarAlt, FaMapMarkerAlt, FaStar, FaStarHalf, FaRegStar, FaPhoneAlt, FaUserCheck } from 'react-icons/fa';
import { BsSpeedometer2, BsGearFill, BsShieldCheck } from 'react-icons/bs';
import { AiOutlineSafety, AiOutlineCheck } from 'react-icons/ai';
import { MdLocalOffer, MdCancel, MdGavel, MdSmokeFree, MdLocationOn, MdDirections, MdVerified, MdEmail } from 'react-icons/md';
import { GiCardDiscard, GiTrashCan, GiFruitBowl, GiChemicalDrop } from 'react-icons/gi';
import { FaCarSide } from 'react-icons/fa6';
import { formatCurrency } from '../utils/formatCurrency';

const CarDetails = () => {
  const { id } = useParams();
  const [selectedImage, setSelectedImage] = useState(0);

  // This would normally come from an API call using the id
  const car = {
    _id: id,
    name: 'Camry',
    brand: 'Toyota',
    modelYear: 2023,
    licensePlate: 'ABC123',
    rentalPricePerDay: 1200000, // Price in VND
    description: 'Experience comfort and reliability with our Toyota Camry. This well-maintained sedan offers excellent fuel efficiency, smooth handling, and plenty of space for both passengers and luggage. Perfect for both city driving and long trips.',
    images: [
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?ixlib=rb-4.0.3',
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?ixlib=rb-4.0.3',
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?ixlib=rb-4.0.3',
    ],
    seats: 5,
    transmission: 'Automatic',
    fuelType: 'Gasoline',
    status: 'Available',
    location: {
      address: '123 Main Street',
      city: 'Ho Chi Minh City',
      district: 'District 1',
      coordinates: {
        lat: 10.762622,
        lng: 106.660172
      },
      landmark: 'Near Ben Thanh Market',
      pickupInstructions: 'Please contact our staff 15 minutes before arrival. Parking available at the front.',
      businessHours: '8:00 AM - 8:00 PM'
    },
    features: [
      'Bluetooth Connectivity',
      'Backup Camera',
      'Cruise Control',
      'USB Charging',
      'Apple CarPlay',
      'Android Auto',
      'Climate Control',
      'Keyless Entry'
    ],
    specifications: {
      engine: '2.5L 4-Cylinder',
      power: '203 hp',
      fuelEfficiency: '28 city / 39 highway',
      trunk: '15.1 cubic feet',
      airbags: '8',
      abs: 'Yes',
      stabilityControl: 'Yes'
    },
    rating: {
      average: 4.7,
      total: 128,
      distribution: {
        5: 85,
        4: 28,
        3: 10,
        2: 3,
        1: 2
      }
    },
    reviews: [
      {
        id: 1,
        user: {
          name: 'John Smith',
          avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
          isVerified: true
        },
        rating: 5,
        date: '2024-02-15',
        comment: 'Excellent car! Very clean and well-maintained. The pickup process was smooth, and the owner was very professional.',
        tripDuration: '3 days'
      },
      {
        id: 2,
        user: {
          name: 'Sarah Johnson',
          avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
          isVerified: true
        },
        rating: 4,
        date: '2024-02-10',
        comment: 'Great experience overall. The car was comfortable and fuel-efficient. Would rent again.',
        tripDuration: '5 days'
      },
      {
        id: 3,
        user: {
          name: 'Mike Brown',
          avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
          isVerified: false
        },
        rating: 5,
        date: '2024-02-05',
        comment: 'Perfect car for our family trip. Everything was as described, and the owner was very helpful.',
        tripDuration: '7 days'
      }
    ],
    owner: {
      id: "owner123",
      name: "David Nguyen",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      joinedDate: "January 2022",
      responseRate: 98,
      responseTime: "within 1 hour",
      totalTrips: 245,
      verificationStatus: {
        email: true,
        phone: true,
        identity: true
      },
      languages: ["English", "Vietnamese"],
      contact: {
        email: "david.nguyen@example.com",
        phone: "+84 123 456 789"
      }
    }
  };

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

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Car Images Gallery */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="aspect-w-16 aspect-h-9 relative">
            <img
              src={car.images[selectedImage]}
              alt={`${car.brand} ${car.name}`}
              className="w-full h-[400px] object-cover"
            />
          </div>
          <div className="p-4 flex gap-4 overflow-x-auto">
            {car.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-colors ${
                  selectedImage === index ? 'border-primary' : 'border-transparent'
                }`}
              >
                <img src={image} alt={`${car.brand} ${car.name} view ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Car Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{car.brand} {car.name}</h1>
              <p className="text-gray-600 mb-4">{car.description}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <FaCalendarAlt className="text-primary" />
                    Model Year
                  </p>
                  <p className="font-semibold">{car.modelYear}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <BsGearFill className="text-primary" />
                    Transmission
                  </p>
                  <p className="font-semibold">{car.transmission}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <FaGasPump className="text-primary" />
                    Fuel Type
                  </p>
                  <p className="font-semibold">{car.fuelType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <FaUsers className="text-primary" />
                    Seats
                  </p>
                  <p className="font-semibold">{car.seats}</p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Features</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {car.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-gray-700">
                    <AiOutlineCheck className="h-5 w-5 text-primary mr-2" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            {/* Specifications */}
            {/* <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Specifications</h2>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(car.specifications).map(([key, value]) => (
                  <div key={key} className="border-b border-gray-200 pb-2">
                    <p className="text-sm text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p className="font-semibold">{value}</p>
                  </div>
                ))}
              </div>
            </div> */}

            {/* Location Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MdLocationOn className="text-primary" />
                Car Location
              </h2>
              <div className="space-y-4">
                {/* Map Placeholder */}
                <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MdDirections className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Map will be integrated here</p>
                  </div>
                </div>

                {/* Location Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                    <h3 className="font-medium text-gray-800">Address Details</h3>
                    <div className="space-y-2">
                        <p className="flex items-start gap-2 text-gray-700">
                        <FaMapMarkerAlt className="text-primary mt-1" />
                        <span>
                            {car.location.address}, {car.location.district}, {car.location.city}
                            <br />
                            <span className="text-gray-500 text-sm">{car.location.landmark}</span>
                        </span>
                        </p>
                    </div>
                    </div>

                    <div className="space-y-3">
                    <h3 className="font-medium text-gray-800">Pickup Information</h3>
                    <div className="space-y-2">
                        <p className="flex items-start gap-2 text-gray-700">
                        <AiOutlineSafety className="text-primary mt-1" />
                        {car.location.pickupInstructions}
                        </p>
                        <p className="flex items-start gap-2 text-gray-700">
                        <FaCalendarAlt className="text-primary mt-1" />
                        Business Hours: {car.location.businessHours}
                        </p>
                    </div>
                </div>
            </div>
            </div>
            </div>
            
            {/* Car Owner Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaUserCheck className="text-primary" />
                Car Owner
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Owner Profile */}
                <div className="flex items-start gap-4">
                  <img
                    src={car.owner.avatar}
                    alt={car.owner.name}
                    className="w-16 h-16 rounded-full"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{car.owner.name}</h3>
                      <MdVerified className="text-primary" title="Verified Owner" />
                    </div>
                    <p className="text-sm text-gray-600">Member since {car.owner.joinedDate}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {car.owner.languages.map((lang, index) => (
                        <span
                          key={lang}
                          className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Owner Stats */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <BsSpeedometer2 className="text-primary" />
                    <span>{car.owner.responseRate}% response rate</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <FaCalendarAlt className="text-primary" />
                    <span>Responds {car.owner.responseTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <FaCar className="text-primary" />
                    <span>{car.owner.totalTrips} completed trips</span>
                  </div>
                </div>

                {/* Verification & Contact */}
                <div>
                  <div className="space-y-3 mb-4">
                    <h4 className="font-medium text-gray-800">Verified Info</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {car.owner.verificationStatus.email && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <MdEmail className="text-primary" />
                          <span>Email</span>
                        </div>
                      )}
                      {car.owner.verificationStatus.phone && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <FaPhoneAlt className="text-primary" />
                          <span>Phone</span>
                        </div>
                      )}
                      {car.owner.verificationStatus.identity && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <BsShieldCheck className="text-primary" />
                          <span>Identity</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button className="w-full bg-primary text-white py-2 rounded-lg hover:bg-secondary transition duration-150">
                    Contact Owner
                  </button>
                </div>
              </div>
            </div>
            
            {/* Reviews and Ratings Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaStar className="text-primary" />
                Reviews and Ratings
              </h2>

              {/* Rating Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Average Rating */}
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 mb-2">{car.rating.average}</div>
                  <div className="flex justify-center mb-1">
                    {renderStars(car.rating.average)}
                  </div>
                  <p className="text-gray-600">{car.rating.total} reviews</p>
                </div>

                {/* Rating Distribution */}
                <div className="col-span-2">
                  {Object.entries(car.rating.distribution)
                    .sort((a, b) => b[0] - a[0])
                    .map(([stars, count]) => (
                      <div key={stars} className="flex items-center mb-2">
                        <div className="w-12 text-sm text-gray-600">{stars} stars</div>
                        <div className="flex-1 mx-4">
                          <div className="h-2 rounded-full bg-gray-200">
                            <div
                              className="h-2 rounded-full bg-primary"
                              style={{
                                width: `${(count / car.rating.total) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="w-12 text-sm text-gray-600 text-right">{count}</div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-6">
                {car.reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={review.user.avatar}
                          alt={review.user.name}
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{review.user.name}</h3>
                            {review.user.isVerified && (
                              <MdVerified className="text-primary" title="Verified User" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{review.date}</span>
                            <span>•</span>
                            <span>{review.tripDuration} rental</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>

              {/* Show More Button */}
              <div className="text-center mt-6">
                <button className="text-primary font-medium hover:text-secondary transition-colors">
                  Show More Reviews
                </button>
              </div>
            </div>

            {/* Terms and Conditions Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MdGavel className="text-primary" />
                Terms and Conditions
              </h2>
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800">Other Regulations:</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-gray-700">
                    <FaCarSide className="text-primary mt-1" />
                    Use the vehicle for its intended purpose only.
                  </li>
                  <li className="flex items-start gap-3 text-gray-700">
                    <MdGavel className="text-primary mt-1" />
                    Do not use the rental vehicle for illegal purposes or activities.
                  </li>
                  <li className="flex items-start gap-3 text-gray-700">
                    <GiCardDiscard className="text-primary mt-1" />
                    Do not use the rental vehicle as collateral or for pawning.
                  </li>
                  <li className="flex items-start gap-3 text-gray-700">
                    <MdSmokeFree className="text-primary mt-1" />
                    No smoking, chewing gum, or littering in the vehicle.
                  </li>
                  <li className="flex items-start gap-3 text-gray-700">
                    <GiChemicalDrop className="text-primary mt-1" />
                    No transportation of prohibited items or flammable materials.
                  </li>
                  <li className="flex items-start gap-3 text-gray-700">
                    <GiFruitBowl className="text-primary mt-1" />
                    No transportation of fruits or strong-smelling foods in the vehicle.
                  </li>
                  <li className="flex items-start gap-3 text-gray-700">
                    <GiTrashCan className="text-primary mt-1" />
                    Upon return, if the vehicle is dirty or has odors, customers must clean the vehicle or pay an additional cleaning fee.
                  </li>
                </ul>
                <p className="text-gray-700 mt-4 italic">
                  Thank you for your cooperation. We wish you wonderful trips!
                </p>
              </div>
            </div>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <MdLocalOffer className="text-primary" />
                  {formatCurrency(car.rentalPricePerDay)}
                </h2>
                <span className="text-gray-600">per day</span>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <FaCalendarAlt className="text-primary" />
                    Pickup Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <FaCalendarAlt className="text-primary" />
                    Return Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  />
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between mb-2">
                    <span>Daily Rate</span>
                    <span>{formatCurrency(car.rentalPricePerDay)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Number of Days</span>
                    <span>3</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Insurance</span>
                    <span>{formatCurrency(150000)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
                    <span>Total</span>
                    <span>{formatCurrency(car.rentalPricePerDay * 3 + 150000)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary text-white py-3 rounded-lg hover:bg-secondary transition duration-150"
                >
                  Book Now
                </button>
              </form>

              <div className="mt-4">
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <FaMapMarkerAlt className="h-5 w-5 text-primary mr-2" />
                  {car.location.address}, {car.location.city}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MdCancel className="h-5 w-5 text-primary mr-2" />
                  Free cancellation up to 24 hours before pickup
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarDetails; 