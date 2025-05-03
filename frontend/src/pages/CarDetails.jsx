import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCar, FaGasPump, FaCog, FaUsers, FaCalendarAlt, FaMapMarkerAlt, FaStar, FaStarHalf, FaRegStar, FaPhoneAlt, FaUserCheck } from 'react-icons/fa';
import { BsSpeedometer2, BsGearFill, BsShieldCheck } from 'react-icons/bs';
import { AiOutlineSafety, AiOutlineCheck } from 'react-icons/ai';
import { MdLocalOffer, MdCancel, MdGavel, MdSmokeFree, MdLocationOn, MdDirections, MdVerified, MdEmail } from 'react-icons/md';
import { GiCardDiscard, GiTrashCan, GiFruitBowl, GiChemicalDrop } from 'react-icons/gi';
import { FaCarSide } from 'react-icons/fa6';
import { formatCurrency } from '../utils/formatCurrency';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../utils/api';

const CarDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [car, setCar] = useState(null);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [rentalType, setRentalType] = useState('daily'); // default to daily
  const [hourlyDuration, setHourlyDuration] = useState(6); // default to 6 hours
  const [totalPrice, setTotalPrice] = useState(0);
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviews, setReviews] = useState([]);
  const { user } = useAuth();
  const [showReviews, setShowReviews] = useState(true);
  const [socket, setSocket] = useState(null);
  const [sortBy, setSortBy] = useState('newest');

  // Fetch ratings from rating-service when carId changes
  useEffect(() => {
    if (!id) return;

    const fetchRatings = async () => {
      try {
        const res = await fetch(`http://localhost:3000/ratings/${id}`);
        if (!res.ok) throw new Error('Failed to fetch ratings');
        const data = await res.json();
        setReviews(
          data.map(rating => ({
            id: rating.id || rating._id,
            user: {
              name: rating.userName || "Anonymous", // Now this will be present
              avatar: rating.userAvatar || "http://localhost:3001/avatar/user.png",
              isVerified: true,
            },
            rating: rating.rating,
            comment: rating.comment,
            date: new Date(rating.createdAt).toLocaleDateString('en-US'),
            tripDuration: "1 day",
          }))
        );
      } catch (err) {
        console.error('Error fetching ratings:', err);
      }
    };

    fetchRatings();
  }, [id]); // Only depend on id

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
            // Get the provider ID (handle both object and string cases)
            const providerId = typeof data.car_providerId === 'object' 
              ? data.car_providerId._id 
              : data.car_providerId;

            // Fetch provider details
            const providerResponse = await fetch(`http://localhost:3000/users/${providerId}`);
            if (providerResponse.ok) {
              const providerData = await providerResponse.json();
              setProvider(providerData.data);
              
              // Update car data with provider info
              data.car_providerId = providerData.data;
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
        
        setCar(data);
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCarAndProviderDetails();
  }, [id, navigate]);

  // Initialize WebSocket connection
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3003');

    ws.onopen = () => {
      console.log('WebSocket Connected');
      setSocket(ws);
    };

    ws.onclose = () => {
      console.log('WebSocket Disconnected');
      setSocket(null);
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);

        if (data.type === 'price_calculated') {
          setTotalPrice(data.totalPrice);
        } else if (data.type === 'calculation_error') {
          console.error('Price calculation error:', data.message);
          toast.error('Error calculating price. Please try again.');
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  // Calculate price when dates change
  useEffect(() => {
    if (!socket || !id || !pickupDate || !returnDate) return;

    const data = {
      type: 'calculate_price',
      data: {
        vehicleId: id,
        startDate: pickupDate,
        endDate: returnDate,
        pickupTime: pickupTime,
        returnTime: returnTime
      }
    };

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    }
  }, [socket, id, pickupDate, returnDate, pickupTime, returnTime]);

  // Function to get coordinates from city name using OpenStreetMap Nominatim
  const getCoordinates = async (city) => {
    try {
      // Append "Viet Nam" to the search query for better accuracy
      const searchQuery = `${city}, Viet Nam`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=vn`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          boundingBox: data[0].boundingbox
        };
      }
      throw new Error('Location not found');
    } catch (error) {
      console.error('Error getting coordinates:', error);
      // Default coordinates for Vietnam (Hanoi)
      return { 
        lat: 21.028511, 
        lng: 105.804817,
        boundingBox: null
      };
    }
  };

  // Hàm sort reviews
  const sortReviews = (reviewsToSort) => {
    return [...reviewsToSort].sort((a, b) => {
      switch (sortBy) {
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        case 'newest':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });
  };

  // Calculate days between two dates
  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = endDate - startDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Calculate hours between two times
  const calculateHours = (startDate, startTime, endDate, endTime) => {
    if (!startDate || !endDate || !startTime || !endTime) return 0;
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    const diffTime = end - start;
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    return diffHours > 0 ? diffHours : 0;
  };

  // Initialize map when car data is loaded
  useEffect(() => {
    // Cleanup previous map instance if it exists
    if (mapInstance) {
      mapInstance.remove();
      setMapInstance(null);
      setMapLoaded(false);
    }

    const initMap = async () => {
      // Only initialize if we have car data and location
      if (!car?.location?.city || !mapRef.current || mapLoaded) {
        return;
      }

      try {
        const locationData = await getCoordinates(car.location.city);
        
        // Create new map instance
        const newMap = L.map(mapRef.current).setView([locationData.lat, locationData.lng], 17);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(newMap);

        // Add a marker for the car location
        const marker = L.marker([locationData.lat, locationData.lng])
          .addTo(newMap)
          .bindPopup(car.location.city);
        
        // Open popup by default
        marker.openPopup();

        // If we have a bounding box, fit the map to it
        if (locationData.boundingBox) {
          newMap.fitBounds([
            [locationData.boundingBox[0], locationData.boundingBox[2]],
            [locationData.boundingBox[1], locationData.boundingBox[3]]
          ]);
        }

        setMapInstance(newMap);
        setMapLoaded(true);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    // Initialize map
    initMap();

    // Cleanup function
    return () => {
      if (mapInstance) {
        mapInstance.remove();
        setMapInstance(null);
        setMapLoaded(false);
      }
    };
  }, [car]); // Only depend on car data changes

  // Hàm chuyển ngày giờ sang ISO string với offset +07:00 (giờ Việt Nam)
  function toVNISOString(dateStr, timeStr) {
    if (!dateStr || !timeStr) return '';
    // Tạo đối tượng Date từ local time
    const date = new Date(`${dateStr}T${timeStr}`);
    // Lấy timestamp + 7 tiếng (nếu trình duyệt đang ở múi giờ khác)
    const vnDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000) + 7 * 60 * 60 * 1000);
    // Trả về ISO string với offset +07:00
    return vnDate.toISOString().replace('Z', '+07:00');
  }

  const handleBooking = async (e) => {
    e.preventDefault();
    
    if (rentalType === 'hourly') {
      // Validate thuê theo giờ
      if (!pickupDate || !pickupTime) {
        toast.error('Vui lòng chọn ngày và giờ lấy xe');
        return;
      }

      const startDateTime = new Date(`${pickupDate}T${pickupTime}`);
      if (startDateTime < new Date()) {
        toast.error('Thời gian lấy xe không được ở quá khứ');
        return;
      }

      // Gửi dữ liệu thuê theo giờ
      await submitBooking({
        vehicleId: id,
        startDate: `${pickupDate}T${pickupTime}`,
        rentalType: 'hourly',
        hourlyDuration: hourlyDuration
      });

    } else {
      // Validate thuê theo ngày
      if (!pickupDate || !returnDate || !pickupTime || !returnTime) {
        toast.error('Vui lòng chọn đầy đủ ngày và giờ lấy/trả xe');
        return;
      }

      const startDateTime = new Date(`${pickupDate}T${pickupTime}`);
      const endDateTime = new Date(`${returnDate}T${returnTime}`);

      if (startDateTime < new Date()) {
        toast.error('Thời gian lấy xe không được ở quá khứ');
        return;
      }

      if (endDateTime <= startDateTime) {
        toast.error('Thời gian trả xe phải sau thời gian lấy xe');
        return;
      }

      // Gửi dữ liệu thuê theo ngày
      await submitBooking({
        vehicleId: id,
        startDate: `${pickupDate}T${pickupTime}`,
        endDate: `${returnDate}T${returnTime}`,
        rentalType: 'daily'
      });
    }
  };

  const submitBooking = async (bookingData) => {
    try {
      // Get auth token
      const auth = localStorage.getItem('auth');
      if (!auth) {
        toast.error('Vui lòng đăng nhập để đặt xe');
        navigate('/login');
        return;
      }
      const { token } = JSON.parse(auth);
      if (!token) {
        toast.error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại');
        navigate('/login');
        return;
      }

      // Get car_providerId from provider data
      if (!provider?._id) {
        toast.error('Thông tin chủ xe không hợp lệ. Vui lòng thử lại.');
        return;
      }

      const response = await fetch('http://localhost:3000/rentals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...bookingData,
          car_providerId: provider._id
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('🚗 Đặt xe thành công! Kiểm tra trong Đơn thuê của tôi', {
          onClose: () => navigate('/rentals')
        });
      } else {
        throw new Error(data.message || 'Đặt xe thất bại');
      }
    } catch (error) {
      console.error('Booking error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Đặt xe thất bại. Vui lòng thử lại.';
      toast.error(errorMessage);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim() || reviewRating === 0) return;

    try {
      // Get auth token and userId if needed
      const auth = localStorage.getItem('auth');
      const { token, userId } = auth ? JSON.parse(auth) : {};
      if (!token) {
        toast.error('Please login to submit a review');
        return;
      }

      const reviewPayload = {
        vehicleId: id,
        userId: userId || user?._id || "anonymous",
        userName: user?.name || "Anonymous", // Add this line
        userAvatar: user?.avatar
          ? (user.avatar.startsWith('http')
              ? user.avatar
              : `http://localhost:3001${user.avatar.replace('/uploads', '')}`)
          : "http://localhost:3001/avatar/user.png", // Add this line
        rating: reviewRating,
        comment: reviewComment,
      };  

      const res = await fetch('http://localhost:3000/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reviewPayload)
      });

      if (!res.ok) throw new Error('Failed to submit review');
      const newReview = await res.json();

      // Optionally, refetch reviews or append the new one
      setReviews(prev => [
        {
          id: newReview.id || newReview._id,
          user: {
            name: user?.name || "Anonymous",
            avatar: user?.avatar
              ? (user.avatar.startsWith('http')
                  ? user.avatar
                  : `http://localhost:3001${user.avatar.replace('/uploads', '')}`)
              : "http://localhost:3001/avatar/user.png",
            isVerified: true,
          },
          rating: newReview.rating,
          comment: newReview.comment,
          date: new Date(newReview.createdAt).toLocaleDateString('en-US'),
          tripDuration: "1 day",
        },
        ...prev
      ]);
      setReviewComment('');
      setReviewRating(0);
      toast.success('Review submitted!');
    } catch (err) {
      toast.error('Failed to submit review');
      console.error(err);
    }
  };
  const handleOwnerClick = () => {
    if (provider?._id) {
      navigate(`/owner-profile/${provider._id}`);
    }
  };

  const DEFAULT_AVATAR = "http://localhost:3001/avatar/user.png";
  function ReviewAvatar({ avatar, name, className }) {
    return avatar ? (
      <img
        src={avatar}
        alt={name}
        className={`${className} rounded-full object-cover`}
        onError={(e) => {
          e.target.src = DEFAULT_AVATAR;
          e.target.onerror = () => {
            e.target.style.display = 'none';
            e.target.parentElement.innerHTML = `<div class="${className} rounded-full bg-primary text-white flex items-center justify-center">${name?.charAt(0).toUpperCase() || 'U'}</div>`;
          };
        }}
      />
    ) : (
      <div className={`${className} rounded-full bg-primary text-white flex items-center justify-center`}>
        {name ? name.charAt(0).toUpperCase() : 'U'}
      </div>
    );
  }

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

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Car Images Gallery */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="aspect-w-16 aspect-h-9 relative">
            <img
              src={car.images?.[selectedImage] ? `http://localhost:3002${car.images[selectedImage]}` : "/placeholder-car-image.jpg"}
              alt={`${car.brand} ${car.name}`}
              className="w-full h-[400px] object-cover"
            />
          </div>
          <div className="p-4 flex gap-4 overflow-x-auto">
            {car.images?.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-colors ${
                  selectedImage === index ? 'border-primary' : 'border-transparent'
                }`}
              >
                <img 
                  src={`http://localhost:3002${image}`} 
                  alt={`${car.brand} ${car.name} view ${index + 1}`} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "/placeholder-car-image.jpg";
                  }}
                />
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

            {/* Location Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MdLocationOn className="text-primary" />
                Car Location
              </h2>
              <div className="space-y-4">
                {/* Leaflet Map */}
                <div 
                  ref={mapRef}
                  className="w-full h-64 rounded-lg"
                  style={{ background: '#f1f1f1', position: 'relative', zIndex: 0 }}
                />

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
                        {/* {car.location.pickupInstructions} */}
                        Self take-over
                      </p>
                      <p className="flex items-start gap-2 text-gray-700">
                        <FaCalendarAlt className="text-primary mt-1" />
                        {/* Business Hours: {car.location.businessHours} */}
                        Business Hours: 7:00 AM - 10:00 PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Car Owner Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <FaUserCheck className="text-primary text-xl" />
                Car Owner Information
              </h2>

              <div 
                onClick={() => {
                  const providerId = typeof car.car_providerId === 'object' 
                    ? car.car_providerId._id 
                    : car.car_providerId;
                  navigate(`/owner-profile/${providerId}`);
                }}
                className="cursor-pointer hover:bg-gray-50 rounded-lg transition-colors p-4 border border-gray-100"
              >
                {/* Owner Profile Header */}
                <div className="flex items-start gap-6">
                  <div className="relative">
                    <img
                      src={provider?.avatar ? `http://localhost:3001${provider.avatar.replace('/uploads', '')}` : "http://localhost:3001/avatar/user.png"}
                      alt={provider?.fullName || 'Car Provider'}
                      className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                    />
                    <MdVerified className="text-primary text-xl absolute -bottom-1 -right-1 bg-white rounded-full" title="Verified Owner" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">{provider?.fullName || 'Car Provider'}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Member since {provider?.createdAt ? new Date(provider.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown date'}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <BsSpeedometer2 className="text-primary" />
                        <span className="text-sm text-gray-700">Quick Response</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MdEmail className="text-primary" />
                        <span className="text-sm text-gray-700">Email Verified</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaPhoneAlt className="text-primary" />
                        <span className="text-sm text-gray-700">Phone Verified</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
                    <div className="p-2 bg-primary bg-opacity-10 rounded-lg">
                      <FaStar className="text-primary text-2xl" />
                    </div>
                    <div>
                      <span className="block font-semibold text-xl text-gray-900">
                        {reviews.length > 0 
                          ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
                          : "N/A"}
                      </span>
                      <span className="text-sm text-gray-600">Average Rating</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
                    <div className="p-2 bg-primary bg-opacity-10 rounded-lg">
                      <BsSpeedometer2 className="text-primary text-2xl" />
                    </div>
                    <div>
                      <span className="block font-semibold text-xl text-gray-900">{car.totalRentals || 0}</span>
                      <span className="text-sm text-gray-600">Rental Completed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            
            {/* Reviews and Ratings Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaStar className="text-primary" />
                Reviews and Ratings
              </h2>

                        {/* Dropdown chọn sort */}
            <div className="flex justify-end mb-4">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
              </select>
            </div>

              {/* Leave a Review Form */}
              {/* <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Leave a Review</h3>
                <form className="space-y-4" onSubmit={handleReviewSubmit}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Rating</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="focus:outline-none"
                        >
                          {reviewRating >= star ? (
                            <FaStar className="text-yellow-400 text-2xl" />
                          ) : (
                            <FaRegStar className="text-yellow-400 text-2xl" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Comment</label>
                    <textarea
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                      rows={3}
                      placeholder="Share your experience..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-secondary transition"
                  >
                    Submit Review
                  </button>
                </form>
              </div> */}

              {/* Reviews List */}
              {showReviews && (
                <div className="space-y-6">
                  {sortReviews(reviews).map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <ReviewAvatar
                            avatar={review.user.avatar}
                            name={review.user.name}
                            className="w-12 h-12"
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
              )}

              {/* Toggle Button */}
              <div className="text-center mt-6">
                <button
                  className="text-primary font-medium hover:text-secondary transition-colors"
                  onClick={() => setShowReviews((prev) => !prev)}
                >
                  {showReviews ? "Hide Reviews" : "Show Reviews"}
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
                  {formatCurrency(totalPrice || car.rentalPricePerDay)}
                </h2>
                <span className="text-gray-600">per day</span>
              </div>

              {/* Toggle Rent Type */}
              <div className="flex items-center justify-center mb-4">
                <button
                  type="button"
                  onClick={() => setRentalType('daily')}
                  className={`px-4 py-2 rounded-l-lg ${rentalType === 'daily' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Thuê theo ngày
                </button>
                <button
                  type="button"
                  onClick={() => setRentalType('hourly')}
                  className={`px-4 py-2 rounded-r-lg ${rentalType === 'hourly' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Thuê theo giờ
                </button>
              </div>

              <form className="space-y-4" onSubmit={handleBooking}>
                {/* Pickup Date & Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <FaCalendarAlt className="text-primary" />
                    Ngày lấy xe
                  </label>
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  />
                  <div className="mt-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Giờ lấy xe</label>
                    <input
                      type="time"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>

                {/* Hourly Duration Selection - only show for hourly rentals */}
                {rentalType === 'hourly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thời gian thuê
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[6, 8, 12].map((hours) => (
                        <button
                          key={hours}
                          type="button"
                          onClick={() => setHourlyDuration(hours)}
                          className={`py-2 px-4 rounded-lg border ${
                            hourlyDuration === hours
                              ? 'border-primary bg-primary text-white'
                              : 'border-gray-300 hover:border-primary'
                          }`}
                        >
                          {hours} giờ
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Return Date & Time - only show for daily rentals */}
                {rentalType === 'daily' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <FaCalendarAlt className="text-primary" />
                      Ngày trả xe
                    </label>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      min={pickupDate || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                    />
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Giờ trả xe</label>
                      <input
                        type="time"
                        value={returnTime}
                        onChange={(e) => setReturnTime(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                )}

                {/* Price Display */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Tổng cộng</span>
                    <span>{formatCurrency(totalPrice || car.rentalPricePerDay)}</span>
                  </div>
                  {rentalType === 'hourly' && (
                    <p className="text-sm text-gray-600 mt-1">
                      ({hourlyDuration} giờ)
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary text-white py-3 rounded-lg hover:bg-secondary transition duration-150"
                >
                  Đặt xe ngay
                </button>
              </form>

              <div className="mt-4">
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <FaMapMarkerAlt className="h-5 w-5 text-primary mr-2" />
                  {car.location.address}, {car.location.city}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MdCancel className="h-5 w-5 text-primary mr-2" />
                  Miễn phí huỷ trước 24h nhận xe
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





