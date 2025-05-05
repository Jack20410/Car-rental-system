import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatCurrency } from '../utils/formatCurrency';
import { useChat } from '../context/ChatContext';
import { toast } from 'react-toastify';
import ChatWindow from '../components/ChatWindow';
import { useRentalWebSocket } from '../context/RentalWebSocketContext';
import { MdVerified, MdEmail } from 'react-icons/md';
import { FaPhoneAlt } from 'react-icons/fa';

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
  const location = useLocation();
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
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [rentals, setRentals] = useState([]);
  const [isLoadingRentals, setIsLoadingRentals] = useState(false);
  const [rentalStatusFilter, setRentalStatusFilter] = useState('all');
  const [rentalVehicles, setRentalVehicles] = useState({});
  const [chatMessages, setChatMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const processedMessageIds = useRef(new Set());
  const [rentalCustomers, setRentalCustomers] = useState({});

  // Chat context
  const { 
    connected, 
    connectionError, 
    sendMessage, 
    currentChat, 
    setCurrentChat, 
    reconnect,
    createChatId,
    loadChatMessages,
    unreadMessages,
    markMessagesAsRead
  } = useChat();

  const { sendRentalUpdate } = useRentalWebSocket();

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

  // Handle change car status
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

  // Handle customer selection for chat - defined as regular function
  const handleCustomerSelect = (customer) => {
    if (!customer || !user?._id) return;
    
    setSelectedCustomer(customer);
    
    try {
      const chatId = createChatId(user._id, customer._id);
      console.log(`Setting up chat with ${customer.fullName}, chatId: ${chatId}`);
      
      setCurrentChat({
        id: chatId,
        recipient: customer
      });
      
      loadChatMessages(chatId);
      
      setTimeout(() => {
        markMessagesAsRead(chatId);
      }, 300);
    } catch (error) {
      console.error("Error setting up chat:", error);
      toast.error("Failed to set up chat. Please try again.");
    }
  };

  // Function to fetch customers who have rented cars from this provider
  const fetchCustomers = async () => {
    try {
      setIsLoadingCustomers(true);
      const auth = JSON.parse(localStorage.getItem('auth'));
      const token = auth?.token;
      const providerId = auth?.user?._id;

      console.log("Current provider ID:", providerId);

      if (!token || !providerId) {
        throw new Error('No authentication token or provider ID found');
      }

      // Get all rentals and extract customer info
      const rentalsResponse = await fetch(`http://localhost:3000/rentals/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!rentalsResponse.ok) {
        throw new Error('Failed to fetch rentals data');
      }

      const rentalsData = await rentalsResponse.json();
      // The rentals are in data.rentals, not directly in data
      const rentals = rentalsData.data?.rentals || [];
      
      // console.log("Fetched rentals:", rentals);
      
      // Create a map to store unique customers
      const customersMap = new Map();
      
      // Process each rental to find those related to this provider
      for (let i = 0; i < rentals.length; i++) {
        const rental = rentals[i];
        if (rental.vehicleId) {
          try {
            // console.log(`Processing rental ${i+1}/${rentals.length} with vehicleId: ${rental.vehicleId}`);
            
            // Get vehicle details to check if it belongs to this provider
            const vehicleResponse = await fetch(`http://localhost:3000/vehicles/${rental.vehicleId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (vehicleResponse.ok) {
              const vehicleData = await vehicleResponse.json();
              const vehicle = vehicleData.data;
              
              // Get the provider ID from the vehicle
              const vehicleProviderId = vehicle?.car_providerId?._id || vehicle?.car_providerId;
              
              console.log(`Vehicle ${rental.vehicleId} belongs to provider:`, vehicleProviderId);
              console.log(`Comparing with current provider:`, providerId);
              
              // Check if this vehicle belongs to the current provider
              if (vehicle && vehicleProviderId === providerId) {
                console.log(`Match found! Adding customer ${rental.userId} to the list`);
                
                // Add customer to map if not already added
                if (rental.userId && !customersMap.has(rental.userId)) {
                  // Try to get user details if available
                  try {
                    const userResponse = await fetch(`http://localhost:3000/users/${rental.userId}`, {
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      }
                    });
                    
                    if (userResponse.ok) {
                      const userData = await userResponse.json();
                      const user = userData.data;
                      
                      customersMap.set(rental.userId, {
                        _id: rental.userId,
                        fullName: user?.fullName || rental.customer?.fullName || 'Unknown Customer',
                        email: user?.email || rental.customer?.email || 'No email available'
                      });
                    } else {
                      // Fallback to rental customer data
                      customersMap.set(rental.userId, {
                        _id: rental.userId,
                        fullName: rental.customer?.fullName || 'Unknown Customer',
                        email: rental.customer?.email || 'No email available'
                      });
                    }
                  } catch (error) {
                    // If we can't get user details, use what we have
                    customersMap.set(rental.userId, {
                      _id: rental.userId,
                      fullName: rental.customer?.fullName || 'Unknown Customer',
                      email: rental.customer?.email || 'No email available'
                    });
                  }
                }
              } else {
                console.log(`No match for vehicle ${rental.vehicleId}`);
              }
            }
          } catch (err) {
            console.error(`Error processing rental ${rental._id}:`, err);
          }
        }
      }
      
      // Convert map to array for state
      const customersList = Array.from(customersMap.values());
      console.log("Extracted customers:", customersList);
      setCustomers(customersList);
      
      // Check if we should auto-select a customer with unread messages
      if (customersList.length > 0) {
        // Get unread messages status
        const unreadMessages = JSON.parse(localStorage.getItem('unread_messages') || '{}');
        
        // Find a customer with unread messages
        let customerWithUnread = null;
        
        // Look through unread message chats to find a customer
        for (const chatId in unreadMessages) {
          if (unreadMessages[chatId] > 0) {
            // Chat IDs are formed as smaller_id_larger_id
            const ids = chatId.split('_');
            // Find which ID is the customer (not the current user/provider)
            const customerId = ids.find(id => id !== providerId);
            
            if (customerId) {
              // Find this customer in our list
              customerWithUnread = customersList.find(c => c._id === customerId);
              if (customerWithUnread) break;
            }
          }
        }
        
        // Auto-select the first customer with unread messages or the first customer
        // Only select if no customer is currently selected (to avoid overriding user selection)
        if (!selectedCustomer) {
          const customerToSelect = customerWithUnread || customersList[0];
          setSelectedCustomer(customerToSelect);
          handleCustomerSelect(customerToSelect);
        }
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Could not load customers. Please try again later.');
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

  // Update the fetchRentals function
  const fetchRentals = async () => {
    try {
      setIsLoadingRentals(true);
      const auth = JSON.parse(localStorage.getItem('auth'));
      const token = auth?.token;

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:3000/rentals/provider', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch rentals');
      }

      const data = await response.json();
      const rentalsData = data.data.rentals;

      // Create objects to store vehicle and customer details
      const vehicleDetails = {};
      const customerDetails = {};

      // Fetch details for each rental
      for (const rental of rentalsData) {
        try {
          // Fetch vehicle details
          const vehicleResponse = await fetch(`http://localhost:3000/vehicles/${rental.vehicleId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (vehicleResponse.ok) {
            const vehicleData = await vehicleResponse.json();
            vehicleDetails[rental.vehicleId] = vehicleData.data;
          }

          // Fetch customer details
          const customerResponse = await fetch(`http://localhost:3000/users/${rental.userId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (customerResponse.ok) {
            const customerData = await customerResponse.json();
            customerDetails[rental.userId] = customerData.data;
          }
        } catch (error) {
          console.error(`Error fetching details for rental ${rental._id}:`, error);
        }
      }

      setRentalVehicles(vehicleDetails);
      setRentalCustomers(customerDetails);
      setRentals(rentalsData);
    } catch (error) {
      console.error('Error fetching rentals:', error);
      toast.error('Failed to fetch rentals');
    } finally {
      setIsLoadingRentals(false);
    }
  };

  // Add this useEffect to fetch rentals when the tab changes
  useEffect(() => {
    if (activeTab === 'rental-management') {
      fetchRentals();
    }
  }, [activeTab]);

  // Add useEffect to listen for rental updates
  useEffect(() => {
    const handleRentalUpdate = (event) => {
      const update = event.detail;
      console.log('Received rental update in ManageCars:', update);
      
      // Nếu có cập nhật về rental, fetch lại danh sách
      if (update.type === 'RENTAL_UPDATE') {
        fetchRentals();
      }
    };

    window.addEventListener('rentalStatusUpdate', handleRentalUpdate);
    return () => {
      window.removeEventListener('rentalStatusUpdate', handleRentalUpdate);
    };
  }, []);

  const handleRentalStatusChange = async (rentalId, newStatus) => {
    try {
      const auth = JSON.parse(localStorage.getItem('auth'));
      const token = auth?.token;

      const response = await fetch(`http://localhost:3000/rentals/${rentalId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Send notification via WebSocket
        sendRentalUpdate({
          type: 'RENTAL_UPDATE',
          rentalId,
          newStatus,
          updatedBy: user._id,
          timestamp: new Date().toISOString()
        });

        fetchRentals();
        toast.success('Rental status has been updated successfully');
      } else {
        throw new Error('Failed to update rental status');
      }
    } catch (error) {
      console.error('Error updating rental status:', error);
      toast.error('Failed to update rental status. Please try again.');
    }
  };

  // Add this function near handleRentalStatusChange
  const handlePaymentStatusChange = async (rentalId) => {
    try {
      const response = await fetch(`http://localhost:3000/rentals/${rentalId}/payment`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth'))?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paymentStatus: 'paid' })
      });

      if (!response.ok) {
        throw new Error('Failed to update payment status');
      }

      // Refresh rentals after status update
      fetchRentals();
      toast.success('Payment status has been updated successfully');
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status. Please try again.');
    }
  };

  // Effect to handle real-time chat updates
  useEffect(() => {
    if (!selectedCustomer || !user?._id) return;

    // Create chat ID using both user IDs (sorted to maintain consistency)
    const chatId = createChatId(user._id, selectedCustomer._id);
    console.log(`Setting up chat with ${selectedCustomer.fullName}, chatId: ${chatId}`);

    // Set the current chat with the consistent ID
    setCurrentChat({
      id: chatId,
      recipient: selectedCustomer
    });

    // Pre-load messages for this chat
    if (chatId) {
      loadChatMessages(chatId);
    }
  }, [selectedCustomer, user, createChatId, loadChatMessages]);

  // Handle new messages with useCallback to prevent issues with stale closures
  const handleNewMessage = useCallback((event) => {
    // Skip if not initialized yet
    if (!user || !currentChat) return;
    
    console.log("Event received in ManageCars:", event);
    
    // Make sure we have the message data from the event
    const message = event.detail;
    if (!message) {
      console.error("Message event received but no detail found:", event);
      return;
    }
    
    // Create a unique message identifier
    const messageId = `${message.senderId}_${message.timestamp}_${message.text}`;
    
    // Skip if we've already processed this message
    if (processedMessageIds.current.has(messageId)) {
      console.log("Skipping already processed message:", messageId);
      return;
    }
    
    console.log("New message received in ManageCars:", message);
    processedMessageIds.current.add(messageId);
    
    // Only add message to this chat if it belongs to the current conversation
    if (currentChat && message.chatId === currentChat.id) {
      // Update UI as needed - ChatWindow component handles this now
      console.log("Message belongs to current chat:", currentChat.id);
    }
  }, [currentChat, user]);

  // Clear processed messages when currentChat changes
  useEffect(() => {
    processedMessageIds.current.clear();
  }, [currentChat]);

  // Listen for new messages
  useEffect(() => {
    // Skip if component not fully initialized
    if (!user) return;
    
    const messageHandler = (event) => {
      handleNewMessage(event);
    };
    
    window.addEventListener('chat-message', messageHandler);
    
    return () => {
      window.removeEventListener('chat-message', messageHandler);
    };
  }, [handleNewMessage, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    // Only try to scroll if we have a current chat
    if (!currentChat) return;
    
    // Use RequestAnimationFrame to ensure DOM is ready
    const scrollTimeout = requestAnimationFrame(() => {
      if (messagesEndRef.current) {
        // Find the container element for this specific chat
        const chatContainer = messagesEndRef.current.closest('.chat-message-container');
        if (chatContainer) {
          // Scroll the container instead of using scrollIntoView (which can affect page position)
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }
    });
    
    return () => cancelAnimationFrame(scrollTimeout);
  }, [currentChat]); // Only depend on currentChat, not on chatMessages which could cause extra renders

  // Check for tab query parameter to set active tab automatically
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'messages') {
      setActiveTab('messages');
      // This will trigger fetchCustomers() through the activeTab useEffect
    }
  }, [location]);

  return (
    <div className="container mx-auto px-4 pt-5 pb-10">
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
                  value={rentalStatusFilter}
                  onChange={(e) => setRentalStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="started">Started</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {isLoadingRentals ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading rentals...</p>
              </div>
            ) : rentals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No rental requests found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rentals
                  .filter(rental => rentalStatusFilter === 'all' || rental.status === rentalStatusFilter)
                  .map(rental => {
                    const vehicle = rentalVehicles[rental.vehicleId];
                    const customer = rentalCustomers[rental.userId];
                    return (
                      <div key={rental._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                          {/* Vehicle Image */}
                          <div className="w-48 h-32 rounded-lg overflow-hidden">
                            {vehicle?.images?.[0] ? (
                              <img
                                src={`http://localhost:3002${vehicle.images[0]}`}
                                alt={vehicle.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-400">No image</span>
                              </div>
                            )}
                          </div>

                          {/* Rental Details */}
                          <div className="flex-1">
                            {/* Vehicle Info and Customer Info */}
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-lg font-semibold">{vehicle?.name || 'Unknown Vehicle'}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-gray-600">{vehicle?.brand} • {vehicle?.modelYear}</p>
                                  <span className="text-gray-400">|</span>
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <img
                                      src={customer?.avatar 
                                        ? `http://localhost:3001${customer.avatar.replace('/uploads', '')}` 
                                        : "http://localhost:3001/avatar/user.png"}
                                      alt={customer?.fullName || 'Customer'}
                                      className="w-5 h-5 rounded-full object-cover"
                                    />
                                    <span>{customer?.fullName || 'Unknown Customer'}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  rental.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  rental.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                  rental.status === 'started' ? 'bg-green-100 text-green-800' :
                                  rental.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                  rental.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  rental.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}
                                </span>
                              </div>
                            </div>

                            {/* Dates and History */}
                            <div className="mt-4 grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-500">Start Date</p>
                                <p className="font-medium">{new Date(rental.startDate).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">End Date</p>
                                <p className="font-medium">{new Date(rental.endDate).toLocaleDateString()}</p>
                              </div>
                            </div>

                            {/* History Timelines */}
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Status History Timeline */}
                              <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Status History</h4>
                                <div className="space-y-2">
                                  {rental.statusHistory?.map((history, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                                      <span className={`text-xs font-semibold rounded-full px-2 py-1 ${
                                        history.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        history.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                        history.status === 'started' ? 'bg-green-100 text-green-800' :
                                        history.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                        history.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                        history.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {history.status.charAt(0).toUpperCase() + history.status.slice(1)}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(history.changedAt).toLocaleString()}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Payment History Timeline */}
                              <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Payment History</h4>
                                <div className="space-y-2">
                                  {rental.paymentHistory?.map((history, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                      <span className={`text-xs font-semibold rounded-full px-2 py-1 ${
                                        history.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                      }`}>
                                        {history.status.charAt(0).toUpperCase() + history.status.slice(1)}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(history.changedAt).toLocaleString()}
                                      </span>
                                      {history.amount && (
                                        <span className="text-xs font-medium text-gray-700">
                                          {formatCurrency(history.amount)}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Price and Actions */}
                            <div className="mt-4 flex justify-between items-center">
                              <div className="text-lg font-semibold text-primary">
                                {formatCurrency(rental.totalPrice)}
                                <span className={`ml-4 px-2 py-1 text-xs font-semibold rounded-full ${
                                  rental.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {rental.paymentStatus.charAt(0).toUpperCase() + rental.paymentStatus.slice(1)}
                                </span>
                              </div>
                              
                              {/* Status Actions */}
                              <div className="flex gap-2">
                                {rental.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleRentalStatusChange(rental._id, 'approved')}
                                      className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleRentalStatusChange(rental._id, 'rejected')}
                                      className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                                {rental.status === 'started' && (
                                  <button
                                    onClick={() => handleRentalStatusChange(rental._id, 'completed')}
                                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                  >
                                    Complete
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Messages Tab Content */}
        {activeTab === 'messages' && (
          <div className="bg-white shadow-md rounded-lg">
            <div className="p-6 border-b">
              <h1 className="text-2xl font-semibold text-gray-900">Customer Messages</h1>
              <p className="mt-1 text-sm text-gray-500">Chat with customers about their rentals</p>
            </div>

            {/* Show connection error if there's a problem with WebSocket */}
            {connectionError && (
              <div className="bg-red-50 p-4 m-4 rounded-md">
                <div className="flex flex-col">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Chat service is currently unavailable</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>Please ensure the chat service is running and try to reconnect.</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 ml-8">
                    <button
                      onClick={reconnect}
                      className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-md text-sm font-medium transition-colors"
                    >
                      Reconnect
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-4 h-[655px]">
              {/* Customers list */}
              <div className="col-span-1 border-r border-gray-200 overflow-y-auto">
                <div className="p-4">
                  <h2 className="text-lg font-semibold mb-4">Customers</h2>
                  <div className="space-y-2">
                    {isLoadingCustomers ? (
                      <div className="text-center py-4">Loading customers...</div>
                    ) : customers.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">No customers found</div>
                    ) : (
                      customers.map(customer => {
                        // Check if this customer has unread messages
                        const chatId = createChatId(user._id, customer._id);
                        const hasUnread = unreadMessages[chatId] && unreadMessages[chatId] > 0;
                        
                        return (
                          <button
                            key={customer._id}
                            onClick={() => handleCustomerSelect(customer)}
                            className={`w-full p-3 rounded-lg text-left transition-colors relative ${
                              selectedCustomer?._id === customer._id
                                ? 'bg-blue-50 text-blue-700'
                                : hasUnread
                                  ? 'bg-yellow-50 hover:bg-yellow-100'
                                  : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="font-medium">{customer.fullName || 'Unknown User'}</div>
                            <div className="text-sm text-gray-500">{customer.email || 'No email available'}</div>
                            
                            {/* Unread indicator */}
                            {hasUnread && (
                              <span className="absolute top-3 right-3 h-3 w-3 bg-red-500 rounded-full animate-pulse"></span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Chat window */}
              <div className="col-span-3 p-4">
                {currentChat && selectedCustomer ? (
                  <div className="h-full chat-wrapper">
                    <ChatWindow 
                      key={currentChat.id}
                      chatId={currentChat.id} 
                      recipient={selectedCustomer}
                      isProvider={true} 
                    />
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