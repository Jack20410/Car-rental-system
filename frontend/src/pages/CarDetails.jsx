import React, { useState, useEffect } from 'react';
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
  const [car, setCar] = useState(null);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [numberOfDays, setNumberOfDays] = useState(0);
  const [isHourlyRent, setIsHourlyRent] = useState(false);
  const [pickupTime, setPickupTime] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [numberOfHours, setNumberOfHours] = useState(0);

  useEffect(() => {
    const fetchCarAndProviderDetails = async () => {
      try {
        setLoading(true);
        // Fetch car details
        const carResponse = await fetch(`http://localhost:3000/vehicles/${id}`);
        if (!carResponse.ok) {
          throw new Error('Failed to fetch car details');
        }
        const carData = await carResponse.json();
        const data = carData.data;

        // Check if we have a car_providerId
        if (data && data.car_providerId) {
          try {
            // Fetch provider details
            const providerResponse = await fetch(`http://localhost:3000/users/${data.car_providerId}`);
            if (providerResponse.ok) {
              const providerData = await providerResponse.json();
              setProvider(providerData.data);
            } else {
              console.warn('Failed to fetch provider details, using default display');
              setProvider(null);
            }
          } catch (err) {
            console.warn('Error fetching provider:', err);
            setProvider(null);
          }
        } else {
          console.warn('No car_providerId found in vehicle data');
          setProvider(null);
        }
        
        // Transform the data to match our frontend structure
        const transformedData = {
          _id: data._id,
          name: data.name,
          brand: data.brand,
          modelYear: data.modelYear,
          licensePlate: data.licensePlate,
          rentalPricePerDay: data.rentalPricePerDay,
          description: data.description,
          images: data.images.map(image => `http://localhost:3002${image}`),
          seats: data.seats,
          transmission: data.transmission,
          fuelType: data.fuelType,
          status: data.status,
          features: data.features || [],
          rating: {
            average: 4.7,
            total: 0,
            distribution: {
              5: 0,
              4: 0,
              3: 0,
              2: 0,
              1: 0
            }
          },
          reviews: [],
          owner: provider ? {
            id: data.car_providerId,
            name: provider.fullName || 'Car Provider',
            avatar: provider.avatar ? `http://localhost:3001${provider.avatar}` : "https://randomuser.me/api/portraits/men/32.jpg",
            joinedDate: provider.createdAt ? new Date(provider.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown date',
            contact: {
              email: provider.email || "Contact information unavailable",
              phone: provider.phoneNumber || "Contact information unavailable"
            }
          } : {
            id: data.car_providerId || 'unknown',
            name: "Car Provider",
            avatar: "https://randomuser.me/api/portraits/men/32.jpg",
            joinedDate: "Unknown date",
            contact: {
              email: "Contact information unavailable",
              phone: "Contact information unavailable"
            }
          },
          location: {
            address: data.location?.address || '',
            city: data.location?.city || '',
            coordinates: {
              lat: 10.762622,
              lng: 106.660172
            },
            landmark: 'Near city center',
            pickupInstructions: 'Please contact our staff 15 minutes before arrival.',
            businessHours: '8:00 AM - 8:00 PM'
          }
        };
        
        setCar(transformedData);
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCarAndProviderDetails();
  }, [id]);

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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Car Details</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Car Not Found</h2>
          <p className="text-gray-600">The car you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 !== 0;

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

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = endDate - startDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const calculateHours = (startDate, startTime, endDate, endTime) => {
    if (!startDate || !endDate || !startTime || !endTime) return 0;
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    const diffTime = end - start;
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    return diffHours > 0 ? diffHours : 0;
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
                {car.features.map((featureName) => {
                  const featureMap = {
                    'Entertainment': '/icons/dvd-v2.png',
                    'Tire Pressure Monitoring System': '/icons/tpms-v2.png',
                    'Spare Tire': '/icons/spare_tire-v2.png',
                    'Navigation': '/icons/map-v2.png',
                    'ETC': '/icons/etc-v2.png',
                    'Head Up Display': '/icons/head_up-v2.png',
                    'Impact Sensor': '/icons/impact_sensor-v2.png',
                    '360 Camera': '/icons/360_camera-v2.png',
                    'Airbags': '/icons/airbags-v2.png',
                    'Reverse Camera': '/icons/reverse_camera-v2.png',
                    'USB Port': '/icons/usb-v2.png',
                    'GPS': '/icons/gps-v2.png',
                    'Bluetooth': '/icons/bluetooth-v2.png',
                    'Sunroof': '/icons/sunroof-v2.png'
                  };
                  
                  return (
                    <div key={featureName} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                      <img 
                        src={featureMap[featureName]} 
                        alt={featureName}
                        className="w-5 h-5 object-contain"
                      />
                      <span className="text-sm text-gray-700">{featureName}</span>
                    </div>
                  );
                })}
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
                            {car.location.address}, {car.location.city}
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
                  </div>
                </div>

                {/* Owner Stats */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <BsSpeedometer2 className="text-primary" />
                    <span>98% response rate</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <FaCalendarAlt className="text-primary" />
                    <span>Responds within 1 hour</span>
                  </div>
                </div>

                {/* Verification & Contact */}
                <div>
                  <div className="space-y-3 mb-4">
                    <h4 className="font-medium text-gray-800">Contact Information</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {car.owner.contact.email && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <MdEmail className="text-primary" />
                          <span>{car.owner.contact.email}</span>
                        </div>
                      )}
                      {car.owner.contact.phone && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <FaPhoneAlt className="text-primary" />
                          <span>{car.owner.contact.phone}</span>
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
                  {formatCurrency(isHourlyRent ? car.rentalPricePerDay / 24 : car.rentalPricePerDay)}
                </h2>
                <span className="text-gray-600">per {isHourlyRent ? 'hour' : 'day'}</span>
              </div>

              {/* Toggle Rent Type */}
              <div className="flex items-center justify-center mb-4">
                <button
                  type="button"
                  onClick={() => setIsHourlyRent(false)}
                  className={`px-4 py-2 rounded-l-lg ${!isHourlyRent ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Thuê theo ngày
                </button>
                <button
                  type="button"
                  onClick={() => setIsHourlyRent(true)}
                  className={`px-4 py-2 rounded-r-lg ${isHourlyRent ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Thuê theo giờ
                </button>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <FaCalendarAlt className="text-primary" />
                    Pickup Date
                  </label>
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => {
                      setPickupDate(e.target.value);
                      if (isHourlyRent) {
                        setNumberOfHours(
                          pickupTime && returnTime
                            ? calculateHours(e.target.value, pickupTime, e.target.value, returnTime)
                            : 0
                        );
                      } else {
                        setNumberOfDays(calculateDays(e.target.value, returnDate));
                      }
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  />
                  {isHourlyRent && (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="time"
                        value={pickupTime}
                        onChange={(e) => {
                          setPickupTime(e.target.value);
                          setNumberOfHours(
                            pickupDate && e.target.value && returnTime
                              ? calculateHours(pickupDate, e.target.value, pickupDate, returnTime)
                              : 0
                          );
                        }}
                        className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                        placeholder="Pickup Time"
                      />
                      <input
                        type="time"
                        value={returnTime}
                        onChange={(e) => {
                          setReturnTime(e.target.value);
                          setNumberOfHours(
                            pickupDate && pickupTime && e.target.value
                              ? calculateHours(pickupDate, pickupTime, pickupDate, e.target.value)
                              : 0
                          );
                        }}
                        className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                        placeholder="Return Time"
                      />
                    </div>
                  )}
                </div>

                {/* Chỉ hiển thị Return Date/Time nếu là thuê theo ngày */}
                {!isHourlyRent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <FaCalendarAlt className="text-primary" />
                      Return Date
                    </label>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => {
                        setReturnDate(e.target.value);
                        setNumberOfDays(calculateDays(pickupDate, e.target.value));
                      }}
                      min={pickupDate || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                    />
                    <input
                      type="time"
                      value={returnTime}
                      onChange={(e) => {
                        setReturnTime(e.target.value);
                      }}
                      className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                    />
                  </div>
                )}

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between mb-2">
                    <span>{isHourlyRent ? 'Hourly Rate' : 'Daily Rate'}</span>
                    <span>{formatCurrency(isHourlyRent ? car.rentalPricePerDay / 24 : car.rentalPricePerDay)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>{isHourlyRent ? 'Number of Hours' : 'Number of Days'}</span>
                    <span>{isHourlyRent ? numberOfHours : numberOfDays}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Insurance</span>
                    <span>{formatCurrency(150000)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
                    <span>Total</span>
                    <span>
                      {formatCurrency(
                        isHourlyRent
                          ? ((car.rentalPricePerDay / 24) * numberOfHours) + 150000
                          : (car.rentalPricePerDay * numberOfDays) + 150000
                      )}
                    </span>
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


