import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatCurrency';
// import { useChat } from '../context/ChatContext';

// Modal Component
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

const ManageCars = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [providerRole, setProviderRole] = useState(false);
  const [existingImages, setExistingImages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const carsPerPage = 4;
  const [activeTab, setActiveTab] = useState('manage-cars');
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    modelYear: '',
    rentalPricePerDay: '',
    licensePlate: '',
    description: '',
    seats: '',
    carType: 'Sedan',
    transmission: 'Automatic',
    fuelType: 'Gasoline',
    location: {
      city: '',
      address: ''
    },
    features: [],
    images: []
  });
  const [editingCar, setEditingCar] = useState(null);
  const [imageError, setImageError] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const { sendMessage, chats, startChat } = useChat();
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);

  // Check auth directly from session storage as a fallback
  useEffect(() => {
    const auth = localStorage.getItem('auth');
    if (auth) {
      const parsedAuth = JSON.parse(auth);
      if (parsedAuth.user && parsedAuth.user.role === 'car_provider') {
        setProviderRole(true);
      }
    }
  }, []);

  // Protect the route
  useEffect(() => {
    // Get role from context or session storage
    const isProvider = user?.role === 'car_provider' || providerRole;
    
    if (!isProvider) {
      console.log('Not a car provider, redirecting', { user, providerRole });
      navigate('/');
    } else {
      // Fetch the provider's cars
      fetchCars();
    }
  }, [user, navigate, providerRole]);
  
  // Function to fetch cars
  const fetchCars = async () => {
    try {
      setIsLoading(true);
      const auth = JSON.parse(localStorage.getItem('auth'));
      const token = auth?.token;
      const userId = auth?.user?._id;
      
      if (!token || !userId) {
        throw new Error('No authentication token or user ID found');
      }
      
      // Fetch from the API gateway with user ID as query parameter
      const response = await fetch(`http://localhost:3000/vehicles?car_providerId=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCars(data.data?.vehicles || []);
      } else {
        throw new Error('Failed to fetch cars');
      }
    } catch (error) {
      console.error('Error fetching cars:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested location fields
    if (name.startsWith('location.')) {
      const locationField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFeaturesChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      if (checked) {
        return {
          ...prev,
          features: [...prev.features, value]
        };
      } else {
        return {
          ...prev,
          features: prev.features.filter(feature => feature !== value)
        };
      }
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      images: files
    }));
  };

  const handleMoveImage = (fromIndex, toIndex) => {
    setExistingImages(prevImages => {
      const newImages = [...prevImages];
      const [movedImage] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, movedImage);
      return newImages;
    });
  };

  const handleDeleteImage = async (indexToDelete) => {
    try {
      const imageToDelete = existingImages[indexToDelete];
      const token = JSON.parse(localStorage.getItem('auth'))?.token;
      
      if (!token) throw new Error('No authentication token found');

      // Call API to delete the image
      const response = await fetch(`http://localhost:3000/vehicles/${editingCar._id}/images`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imagePath: imageToDelete })
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      // Only remove from state if deletion was successful
      setExistingImages(prevImages => prevImages.filter((_, index) => index !== indexToDelete));
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      
      // Add all non-nested fields
      Object.keys(formData).forEach(key => {
        if (key === 'images') {
          formData.images.forEach(image => {
            formDataToSend.append('images', image);
          });
          // Add existing images in their new order
          if (editingCar) {
            formDataToSend.append('existingImages', JSON.stringify(existingImages));
          }
        } else if (key === 'location') {
          // Add location fields separately
          formDataToSend.append('location[city]', formData.location.city);
          formDataToSend.append('location[address]', formData.location.address);
        } else if (key === 'features') {
          // Add features as an array
          formData.features.forEach(feature => {
            formDataToSend.append('features[]', feature);
          });
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      const token = JSON.parse(localStorage.getItem('auth'))?.token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      let response;
    if (editingCar) {
      // Nếu đang edit, gọi PATCH
      response = await fetch(`http://localhost:3000/vehicles/${editingCar._id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });
    } else {
      // Nếu tạo mới, gọi POST
      response = await fetch('http://localhost:3000/vehicles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });
    }

      if (response.ok) {
        const result = await response.json();
        setCars(prev => [...prev, result.data]);
        setShowForm(false);
        setFormData({
          name: '',
          brand: '',
          modelYear: '',
          rentalPricePerDay: '',
          licensePlate: '',
          description: '',
          seats: '',
          carType: 'Sedan',
          transmission: 'Automatic',
          fuelType: 'Gasoline',
          location: {
            city: '',
            address: ''
          },
          features: [],
          images: []
        });
        // Refresh car list
        fetchCars();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create car');
      }
    } catch (error) {
      console.error('Error creating car:', error);
      alert(`Error creating car: ${error.message}`);
    }
  };

   const handleDeleteCar = async (carId) => {
    if (!window.confirm('Are you sure you want to delete this car?')) return;
    try {
      const token = JSON.parse(localStorage.getItem('auth'))?.token;
      if (!token) throw new Error('No authentication token found');
  
      const response = await fetch(`http://localhost:3000/vehicles/${carId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (response.ok) {
        setCars(prev => prev.filter(car => car._id !== carId));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete car');
      }
    } catch (error) {
      alert(`Error deleting car: ${error.message}`);
    }
  };
  const handleChangeStatus = async (car, newStatus) => {
    try {
      const token = JSON.parse(localStorage.getItem('auth'))?.token;
      if (!token) throw new Error('No authentication token found');
  
      const response = await fetch(`http://localhost:3000/vehicles/${car._id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
  
      if (response.ok) {
        fetchCars(); // Refresh list
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change status');
      }
    } catch (error) {
      alert(`Error changing status: ${error.message}`);
    }
  };

  // Function to fetch customers who have rented cars from this provider
  const fetchCustomers = async () => {
    try {
      setIsLoadingCustomers(true);
      const auth = JSON.parse(localStorage.getItem('auth'));
      const token = auth?.token;
      const providerId = auth?.user?._id;

      if (!token || !providerId) {
        throw new Error('No authentication token or provider ID found');
      }

      const response = await fetch(`http://localhost:3000/rentals/provider/${providerId}/customers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      } else {
        throw new Error('Failed to fetch customers');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  // Load customers when messages tab is activated
  useEffect(() => {
    if (activeTab === 'messages') {
      fetchCustomers();
    }
  }, [activeTab]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedCustomer) return;

    const auth = JSON.parse(localStorage.getItem('auth'));
    const providerId = auth?.user?._id;

    await sendMessage({
      content: messageInput,
      senderId: providerId,
      recipientId: selectedCustomer._id,
      timestamp: new Date().toISOString()
    });

    setMessageInput('');
  };

  return (
    <div className="container mx-auto px-4 pt-20">
      <div className="max-w-4xl mx-auto">
        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('manage-cars')}
                className={`${
                  activeTab === 'manage-cars'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium`}
              >
                Manage My Cars
              </button>
              <button
                onClick={() => setActiveTab('rental-management')}
                className={`${
                  activeTab === 'rental-management'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium`}
              >
                Car Rental Management
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`${
                  activeTab === 'messages'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium`}
              >
                Messages
              </button>
            </nav>
          </div>
        </div>

        {/* Manage My Cars Tab Content */}
        {activeTab === 'manage-cars' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Car Information</h1>
              <button
                onClick={() => setShowForm(true)}
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-secondary transition-colors"
              >
                Add New Car
              </button>
            </div>

            {/* Modal */}
            <Modal isOpen={showForm} onClose={() => {
              setShowForm(false);
              setEditingCar(null);
              setFormData({
                name: '',
                brand: '',
                modelYear: '',
                rentalPricePerDay: '',
                licensePlate: '',
                description: '',
                seats: '',
                carType: 'Sedan',
                transmission: 'Automatic',
                fuelType: 'Gasoline',
                location: { city: '', address: '' },
                features: [],
                images: []
              });
            }}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {editingCar ? 'Edit Car' : 'Add New Car'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                        Vehicle Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g. Toyota Camry 2021"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="brand">
                        Brand
                      </label>
                      <input
                        type="text"
                        id="brand"
                        name="brand"
                        value={formData.brand}
                        onChange={handleInputChange}
                        placeholder="e.g. Toyota"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="modelYear">
                        Model Year
                      </label>
                      <input
                        type="number"
                        id="modelYear"
                        name="modelYear"
                        value={formData.modelYear}
                        onChange={handleInputChange}
                        placeholder="e.g. 2021"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="licensePlate">
                        License Plate
                      </label>
                      <input
                        type="text"
                        id="licensePlate"
                        name="licensePlate"
                        value={formData.licensePlate}
                        onChange={handleInputChange}
                        placeholder="e.g. ABC-1234"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="rentalPricePerDay">
                        Price per Day
                      </label>
                      <input
                        type="number"
                        id="rentalPricePerDay"
                        name="rentalPricePerDay"
                        value={formData.rentalPricePerDay}
                        onChange={handleInputChange}
                        placeholder="e.g. 1.000.000"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="seats">
                        Number of Seats
                      </label>
                      <input
                        type="number"
                        id="seats"
                        name="seats"
                        value={formData.seats}
                        onChange={handleInputChange}
                        placeholder="e.g. 5"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="carType">
                        Car Type
                      </label>
                      <select
                        id="carType"
                        name="carType"
                        value={formData.carType}
                        onChange={handleInputChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      >
                        <option value="Sedan">Sedan</option>
                        <option value="SUV">SUV</option>
                        <option value="Convertible">Convertible</option>
                        <option value="Coupe">Coupe</option>
                        <option value="Hatchback">Hatchback</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="transmission">
                        Transmission
                      </label>
                      <select
                        id="transmission"
                        name="transmission"
                        value={formData.transmission}
                        onChange={handleInputChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      >
                        <option value="Automatic">Automatic</option>
                        <option value="Manual">Manual</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fuelType">
                        Fuel Type
                      </label>
                      <select
                        id="fuelType"
                        name="fuelType"
                        value={formData.fuelType}
                        onChange={handleInputChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      >
                        <option value="Gasoline">Gasoline</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Electric">Electric</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location.city">
                        City
                      </label>
                      <select
                        id="location.city"
                        name="location.city"
                        value={formData.location.city}
                        onChange={handleInputChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      >
                        <option value="">Select a city</option>
                        <option value="Ho Chi Minh city">Ho Chi Minh city</option>
                        <option value="Ha Noi city">Ha Noi city</option>
                        <option value="Da Nang city">Da Nang city</option>
                        <option value="Nha Trang city">Nha Trang city</option>
                        <option value="Quy Nhon city">Quy Nhon city</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location.address">
                        Address
                      </label>
                      <input
                        type="text"
                        id="location.address"
                        name="location.address"
                        value={formData.location.address}
                        onChange={handleInputChange}
                        placeholder="e.g. 123 Main St"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Features
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {[
                          { name: 'Entertainment', icon: '/icons/dvd-v2.png' },
                          { name: 'Tire Pressure Monitoring System', icon: '/icons/tpms-v2.png' },
                          { name: 'Spare Tire', icon: '/icons/spare_tire-v2.png' },
                          { name: 'Navigation', icon: '/icons/map-v2.png' },
                          { name: 'ETC', icon: '/icons/etc-v2.png' },
                          { name: 'Head Up Display', icon: '/icons/head_up-v2.png' },
                          { name: 'Impact Sensor', icon: '/icons/impact_sensor-v2.png' },
                          { name: '360 Camera', icon: '/icons/360_camera-v2.png' },
                          { name: 'Airbags', icon: '/icons/airbags-v2.png' },
                          { name: 'Reverse Camera', icon: '/icons/reverse_camera-v2.png' },
                          { name: 'USB Port', icon: '/icons/usb-v2.png' },
                          { name: 'GPS', icon: '/icons/gps-v2.png' },
                          { name: 'Bluetooth', icon: '/icons/bluetooth-v2.png' },
                          { name: 'Sunroof', icon: '/icons/sunroof-v2.png' }
                        ].map(feature => (
                          <div key={feature.name} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                            <input
                              type="checkbox"
                              id={`feature-${feature.name}`}
                              name="features"
                              value={feature.name}
                              checked={formData.features.includes(feature.name)}
                              onChange={handleFeaturesChange}
                              className="mr-2"
                            />
                            <img 
                              src={feature.icon} 
                              alt={feature.name}
                              className="w-5 h-5 object-contain"
                            />
                            <label htmlFor={`feature-${feature.name}`} className="text-sm">
                              {feature.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                        Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        rows="4"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="images">
                        Car Images <span className="text-red-500">*</span>
                      </label>
                      {/* Display existing images with reorder controls */}
                      {editingCar && editingCar.images && editingCar.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {existingImages.map((img, idx) => (
                            <div key={idx} className="relative group">
                              <img
                                src={`http://localhost:3002${img}`}
                                alt={`Car image ${idx + 1}`}
                                className="w-24 h-16 object-cover border rounded"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center space-x-2 transition-opacity">
                                {idx > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleMoveImage(idx, idx - 1)}
                                    className="p-1 bg-white rounded-full hover:bg-gray-100"
                                  >
                                    ←
                                  </button>
                                )}
                                {idx < existingImages.length - 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleMoveImage(idx, idx + 1)}
                                    className="p-1 bg-white rounded-full hover:bg-gray-100"
                                  >
                                    →
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteImage(idx)}
                                  className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                  title="Delete image"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <input
                        type="file"
                        id="images"
                        name="images"
                        onChange={handleImageChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        multiple
                        accept="image/*"
                        required={!editingCar}
                      />
                      {imageError && (
                        <p className="text-red-500 text-sm mt-2">{imageError}</p>
                      )}
                      <p className="text-gray-500 text-xs mt-1">Please upload exactly 3 images.</p>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingCar(null);
                        setFormData({
                          name: '',
                          brand: '',
                          modelYear: '',
                          rentalPricePerDay: '',
                          licensePlate: '',
                          description: '',
                          seats: '',
                          carType: 'Sedan',
                          transmission: 'Automatic',
                          fuelType: 'Gasoline',
                          location: { city: '', address: '' },
                          features: [],
                          images: []
                        });
                      }}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-primary text-white px-4 py-2 rounded-md hover:bg-secondary transition-colors"
                    >
                      {editingCar ? 'Update Car' : 'Create Car'}
                    </button>
                  </div>
                </form>
              </div>
            </Modal>

            <div className="bg-white shadow-md rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Your Cars</h2>
                {/* Pagination Controls */}
                {!isLoading && cars.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-primary text-white hover:bg-secondary'
                      }`}
                    >
                      Previous
                    </button>
                    <span className="text-gray-600">
                      Page {currentPage} of {Math.ceil(cars.length / carsPerPage)}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(cars.length / carsPerPage)))}
                      disabled={currentPage >= Math.ceil(cars.length / carsPerPage)}
                      className={`px-3 py-1 rounded ${
                        currentPage >= Math.ceil(cars.length / carsPerPage)
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-primary text-white hover:bg-secondary'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
              {isLoading ? (
                <p>Loading...</p>
              ) : cars.length === 0 ? (
                <p>No cars added yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cars
                    .slice((currentPage - 1) * carsPerPage, currentPage * carsPerPage)
                    .map(car => (
                    <div key={car._id} className="border rounded-lg overflow-hidden bg-white shadow">
                      <div className="h-48 overflow-hidden">
                        {car.images && car.images.length > 0 ? (
                          <img
                            src={`http://localhost:3002${car.images[0]}`}
                            alt={`${car.brand} ${car.name}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-gray-500">No image</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{car.name}</h3>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            car.status === 'Available' ? 'bg-blue-100 text-blue-800' :
                            car.status === 'Unavailable' ? 'bg-red-100 text-red-800' :
                            car.status === 'Rented' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {car.status}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">{car.brand} • {car.modelYear}</p>
                        <p className="text-gray-700 font-semibold mb-2">{formatCurrency(car.rentalPricePerDay)} per day</p>
                        <p className="text-gray-600 text-sm mb-3">{car.licensePlate}</p>
                        <div className="flex justify-end space-x-2">
                          <button
                            className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
                            onClick={() => {
                              setEditingCar(car);
                              setShowForm(true);
                              setExistingImages(car.images || []);
                              setFormData({
                                ...car,
                                location: car.location || { city: '', address: '' },
                                features: car.features || [],
                                images: []
                              });
                            }}
                          >
                            Edit
                          </button>
                          <select
                            className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded hover:bg-yellow-200"
                            value={car.status}
                            onChange={e => handleChangeStatus(car, e.target.value)}
                            disabled={car.status === 'Rented'}
                          >
                            <option value="Available">Available</option>
                            <option value="Unavailable">Unavailable</option>
                          </select>
                          <button
                            className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200"
                            onClick={() => handleDeleteCar(car._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Car Rental Management Tab Content */}
        {activeTab === 'rental-management' && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Rental Requests</h2>
              <div className="flex space-x-2">
                <select 
                  className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm"
                  onChange={(e) => {
                    // Add filter handling here
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="active">Active</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Placeholder for rental management content */}
            <div className="space-y-4">
              <p className="text-gray-500 text-center py-8">
                Rental management features will be implemented here.
                This section will show rental requests, booking status,
                and allow managing rentals.
              </p>
            </div>
          </div>
        )}

        {/* Messages Tab Content */}
        {activeTab === 'messages' && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="grid grid-cols-3 gap-6 h-[600px]">
              {/* Customers List */}
              <div className="border-r pr-4">
                <h3 className="text-lg font-semibold mb-4">Customers</h3>
                {isLoadingCustomers ? (
                  <p>Loading customers...</p>
                ) : customers.length === 0 ? (
                  <p className="text-gray-500">No customers found</p>
                ) : (
                  <div className="space-y-2">
                    {customers.map((customer) => (
                      <button
                        key={customer._id}
                        onClick={() => {
                          setSelectedCustomer(customer);
                          startChat(customer._id);
                        }}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedCustomer?._id === customer._id
                            ? 'bg-primary text-white'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm opacity-75">
                          {customer.email}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Chat Area */}
              <div className="col-span-2">
                {selectedCustomer ? (
                  <div className="h-full flex flex-col">
                    {/* Chat Header */}
                    <div className="border-b pb-4 mb-4">
                      <h3 className="text-lg font-semibold">
                        Chat with {selectedCustomer.name}
                      </h3>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                      {chats[selectedCustomer._id]?.messages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${
                            message.senderId === user._id ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              message.senderId === user._id
                                ? 'bg-primary text-white'
                                : 'bg-gray-100'
                            }`}
                          >
                            <p>{message.content}</p>
                            <span className="text-xs opacity-75">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Message Input */}
                    <form onSubmit={handleSendMessage} className="mt-auto">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          placeholder="Type your message..."
                          className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                        />
                        <button
                          type="submit"
                          className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-secondary transition-colors"
                        >
                          Send
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    Select a customer to start chatting
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCars;