import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api, { endpoints } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';
import { toast } from 'react-toastify';
import { useChat } from '../context/ChatContext';

const RentalCard = ({ rental, onCancel }) => {
  const [provider, setProvider] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        // Fetch vehicle details first
        const vehicleResponse = await api.get(endpoints.vehicles.details(rental.vehicleId));
        const vehicleData = vehicleResponse.data.data;
        
        // Transform image URLs to use correct port (3002)
        if (vehicleData.images && vehicleData.images.length > 0) {
          vehicleData.images = vehicleData.images.map(image => {
            if (image.startsWith('http')) return image;
            return `http://localhost:3002${image}`;
          });
        }
        
        setVehicle(vehicleData);

        // Fetch provider details if we have providerId
        if (vehicleData?.car_providerId) {
          try {
            const providerIdRaw = vehicleData.car_providerId;
            const providerId = typeof providerIdRaw === 'object' ? providerIdRaw._id : providerIdRaw;
            
            const providerResponse = await api.get(endpoints.user.details(providerId));
            setProvider(providerResponse.data.data);
          } catch (error) {
            console.error('Failed to fetch provider:', error.message);
            setProvider(null);
          }
        }
      } catch (error) {
        console.error('Failed to fetch vehicle:', error.message);
        toast.error('Could not load vehicle details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [rental.vehicleId]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    let date = new Date(dateString);
    // Trừ đi 7 tiếng để về đúng giờ Việt Nam nếu bị cộng dư
    date = new Date(date.getTime() - 7 * 60 * 60 * 1000);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Vehicle Image */}
        <div className="md:col-span-1 h-48">
          {vehicle?.images?.[0] ? (
            <img
              src={vehicle.images[0]}
              alt={vehicle?.name || 'Vehicle Image'}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null; // Prevent infinite loop
                e.target.src = '/placeholder-car.jpg';
                console.log('Failed to load image:', vehicle.images[0]);
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">No image available</span>
            </div>
          )}
        </div>

        {/* Vehicle and Provider Info */}
        <div className="md:col-span-2 p-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {vehicle?.name || 'Unknown Vehicle'}
              </h3>
              {/* <p className="text-sm text-gray-500">
                {vehicle ? `${vehicle.model} (${vehicle.year})` : 'Loading details...'}
              </p> */}
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(rental.status)}`}>
              {rental.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Rental Period</h4>
              <p className="text-sm text-gray-900">
                From: {formatDate(rental.startDate)}<br />
                To: {formatDate(rental.endDate)}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Provider Information</h4>
              {provider ? (
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-600 w-24">Name:</span>
                    <span className="text-sm text-gray-900">{provider.fullName || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-600 w-24">Email:</span>
                    <span className="text-sm text-gray-900">{provider.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-600 w-24">Phone:</span>
                    <span className="text-sm text-gray-900">{provider.phoneNumber || 'N/A'}</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic flex items-center space-x-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Provider information not available</span>
                </div>
              )}
            </div>
          </div>

          {/* Status History Timeline */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Status History</h4>
            <div className="space-y-2">
              {rental.statusHistory.map((history, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  <span className={`text-xs font-semibold rounded-full px-2 py-1 ${getStatusColor(history.status)}`}>
                    {history.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(history.changedAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment and Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <div>
              <span className="text-sm text-gray-500">Total Price:</span>
              <span className="ml-2 text-lg font-semibold text-gray-900">
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND'
                }).format(rental.totalPrice)}
              </span>
              <span className={`ml-4 px-2 py-1 text-xs font-semibold rounded-full ${
                rental.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                rental.paymentStatus === 'refunded' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {rental.paymentStatus}
              </span>
            </div>
            {rental.status === 'pending' && (
              <button
                onClick={() => onCancel(rental._id)}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Cancel Rental
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Rentals = () => {
  const { user } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [loading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('rentals');
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  
  // Chat context
  const { startChat, sendMessage, getCurrentChatMessages, currentChat, setCurrentChat, connectionError, clearChatHistory, reconnect, connected } = useChat();
  const messagesEndRef = useRef(null);
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);

  const fetchRentals = async () => {
    try {
      const response = await api.get('/rentals');
      setRentals(response.data.data || []);
    } catch (err) {
      setError('Failed to load your rental history. Please try again later.');
      console.error('Error fetching rentals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      setIsLoadingProviders(true);
      const auth = JSON.parse(localStorage.getItem('auth'));
      const token = auth?.token;
      const userId = auth?.user?._id;
      
      console.log("Current customer ID:", userId);
      
      if (!token || !userId) {
        throw new Error('No authentication token or user ID found');
      }
      
      // Get all rentals first to identify providers this customer has interacted with
      const rentalsResponse = await fetch(`http://localhost:3000/rentals/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!rentalsResponse.ok) {
        throw new Error('Failed to fetch rentals');
      }
      
      const rentalsData = await rentalsResponse.json();
      const rentals = rentalsData.data?.rentals || [];
      
      console.log("Fetched rentals:", rentals);
      
      // Create a map to store unique providers
      const providersMap = new Map();
      
      // Process each rental to find providers
      for (let i = 0; i < rentals.length; i++) {
        const rental = rentals[i];
        
        // Only process rentals for this customer
        if (rental.userId === userId && rental.vehicleId) {
          console.log(`Processing rental ${i+1}/${rentals.length} with vehicleId: ${rental.vehicleId}`);
          
          try {
            // Get vehicle details to find the provider
            const vehicleResponse = await fetch(`http://localhost:3000/vehicles/${rental.vehicleId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (vehicleResponse.ok) {
              const vehicleData = await vehicleResponse.json();
              const vehicle = vehicleData.data;
              
              // Extract provider ID (could be string or object)
              const providerIdRaw = vehicle?.car_providerId;
              const providerId = typeof providerIdRaw === 'object' ? providerIdRaw._id : providerIdRaw;
              
              console.log(`Vehicle ${rental.vehicleId} belongs to provider:`, providerId);
              
              if (providerId && !providersMap.has(providerId)) {
                // Get provider details
                try {
                  const providerResponse = await fetch(`http://localhost:3000/users/${providerId}`, {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  });
                  
                  if (providerResponse.ok) {
                    const providerData = await providerResponse.json();
                    const provider = providerData.data;
                    
                    console.log(`Adding provider ${providerId} to chat list:`, provider?.fullName);
                    providersMap.set(providerId, {
                      _id: providerId,
                      fullName: provider?.fullName || 'Unknown Provider',
                      email: provider?.email || 'No email available'
                    });
                  }
                } catch (error) {
                  console.error(`Could not fetch details for provider ${providerId}:`, error);
                }
              }
            }
          } catch (error) {
            console.error(`Error processing rental ${rental._id}:`, error);
          }
        }
      }
      
      // Convert map to array for state
      const providersList = Array.from(providersMap.values());
      console.log("Extracted providers:", providersList);
      setProviders(providersList);
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast.error('Could not load providers. Please try again later.');
    } finally {
      setIsLoadingProviders(false);
    }
  };

  useEffect(() => {
    fetchRentals();
  }, []);

  useEffect(() => {
    if (activeTab === 'messages') {
      fetchProviders();
    }
  }, [activeTab]);

  const handleCancel = async (rentalId) => {
    try {
      await api.patch(`/rentals/${rentalId}/status`, {
        status: 'cancelled'
      });
      toast.success('Rental cancelled successfully');
      fetchRentals(); // Refresh the rentals list
    } catch (error) {
      console.error('Error cancelling rental:', error);
      toast.error('Failed to cancel rental');
    }
  };

  // Function to format chat timestamp
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const messageDate = new Date(timestamp);
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Store messages in local state for better rendering
  useEffect(() => {
    if (!currentChat) return;
    
    // Get current messages and update local state
    const messages = getCurrentChatMessages();
    console.log("Setting chat messages:", messages);
    setChatMessages(messages || []);

    // Subscribe to new messages
    const handleNewMessage = (message) => {
      console.log("New message received:", message);
      setChatMessages(prev => [...(prev || []), message]);
    };

    // Add message listener using window events since WebSocket handling is done in ChatContext
    window.addEventListener('chat-message', handleNewMessage);

    // Cleanup
    return () => {
      window.removeEventListener('chat-message', handleNewMessage);
    };
  }, [currentChat]);

  // Sync with getCurrentChatMessages when they change
  useEffect(() => {
    const messages = getCurrentChatMessages();
    if (messages && messages.length > 0) {
      setChatMessages(messages);
    }
  }, [getCurrentChatMessages]);

  // Start or select a chat when provider is selected
  useEffect(() => {
    if (selectedProvider) {
      console.log("Starting chat with provider:", selectedProvider);
      startChat(selectedProvider);
      setActiveChat(selectedProvider._id);
    }
  }, [selectedProvider, startChat]);

  // Debug current chat state
  useEffect(() => {
    console.log("Current chat state:", { currentChat, messages: chatMessages });
  }, [currentChat, chatMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end',
        inline: 'nearest'
      });
    }
    
    // Prevent body scroll when viewing messages
    return () => {
      // Reset any scroll behavior when component unmounts
      document.body.style.overflow = '';
    };
  }, [chatMessages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedProvider || !connected) return;
    
    console.log(`Sending message to ${selectedProvider.fullName} (${selectedProvider._id}): ${messageInput}`);
    
    // Make sure we have a current chat
    if (!currentChat) {
      console.log("No current chat, starting a new one");
      startChat(selectedProvider);
      return; // Wait for chat to be established
    }
    
    // Use chat context to send message
    const success = sendMessage({
      content: messageInput,
      recipientId: selectedProvider._id
    });
    
    if (success) {
      // Update local messages immediately for better UX
      const newMessage = {
        senderId: user._id,
        text: messageInput,
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...(prev || []), newMessage]);
      setMessageInput('');
      
      // Scroll to bottom after a small delay to ensure the DOM has updated
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }, 100);
    } else {
      console.error('Failed to send message');
      toast.error('Failed to send message. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-5 pb-10">
      <div className="max-w-4xl mx-auto">
        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('rentals')}
                className={`${
                  activeTab === 'rentals'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium`}
              >
                My Rentals
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`${
                  activeTab === 'messages'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium`}
              >
                Messages
              </button>
            </nav>
          </div>
        </div>

        {/* Rentals Tab Content */}
        {activeTab === 'rentals' && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">My Rentals</h1>
              <p className="mt-1 text-sm text-gray-500">Track your rental history and status changes</p>
            </div>

            {rentals.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No rentals</h3>
                <p className="mt-1 text-sm text-gray-500">You haven't made any car rentals yet.</p>
                <div className="mt-6">
                  <Link to="/cars" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                    Browse available cars
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {rentals.map((rental) => (
                  <RentalCard
                    key={rental._id}
                    rental={rental}
                    onCancel={handleCancel}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Messages Tab Content */}
        {activeTab === 'messages' && (
          <div className="bg-white shadow-md rounded-lg">
            <div className="p-6 border-b">
              <h1 className="text-2xl font-semibold text-gray-900">Messages with Providers</h1>
              <p className="mt-1 text-sm text-gray-500">Chat with car providers about your rentals</p>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
              {/* Providers List */}
              <div className="border rounded-lg overflow-hidden h-full">
                <div className="bg-gray-50 p-3 border-b">
                  <h3 className="font-medium text-gray-700">Car Providers</h3>
                </div>
                
                <div className="h-[calc(100%-48px)] overflow-y-auto">
                  {isLoadingProviders ? (
                    <div className="p-4 text-center">Loading providers...</div>
                  ) : providers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No providers found</div>
                  ) : (
                    providers.map(provider => (
                      <div 
                        key={provider._id} 
                        className={`p-3 hover:bg-gray-50 cursor-pointer flex items-center ${selectedProvider?._id === provider._id ? 'bg-blue-50' : ''}`}
                        onClick={() => setSelectedProvider(provider)}
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                          {provider.fullName ? provider.fullName.charAt(0).toUpperCase() : 'P'}
                        </div>
                        <div>
                          <h4 className="font-medium">{provider.fullName || 'Unknown Provider'}</h4>
                          <p className="text-sm text-gray-500">{provider.email}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Area */}
              <div className="col-span-2 border rounded-lg flex flex-col h-full overflow-hidden chat-container">
                {selectedProvider ? (
                  <>
                    {/* Chat Header */}
                    <div className="bg-gray-50 p-3 border-b flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                          {selectedProvider.fullName ? selectedProvider.fullName.charAt(0).toUpperCase() : 'P'}
                        </div>
                        <div>
                          <h3 className="font-medium">{selectedProvider.fullName || 'Unknown Provider'}</h3>
                          <p className="text-xs text-gray-500">{selectedProvider.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} 
                          title={connected ? 'Connected' : 'Disconnected'}>
                        </div>
                        <button 
                          onClick={() => clearChatHistory()} 
                          className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded transition-colors"
                          title="Clear chat history"
                        >
                          Clear Chat
                        </button>
                      </div>
                    </div>
                    
                    {/* Chat Messages Area - Improved Structure */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div 
                        className="chat-message-container"
                        onClick={(e) => {
                          // Prevent clicks inside chat from scrolling the page
                          e.stopPropagation();
                        }}
                      >
                        {chatMessages?.length === 0 ? (
                          <div className="text-center text-gray-500 my-4">
                            <p>No messages yet. Start a conversation!</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {chatMessages.map((msg, index) => {
                              const isMyMessage = msg.senderId === user._id;
                              return (
                                <div 
                                  key={`${msg.senderId}-${msg.timestamp}-${index}`}
                                  className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                                >
                                  <div 
                                    className={`chat-bubble ${
                                      isMyMessage ? 'chat-bubble-sent' : 'chat-bubble-received'
                                    }`}
                                  >
                                    <div className="break-words overflow-hidden">
                                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                      <span className="text-xs text-gray-500 mt-1 block">
                                        {formatMessageTime(msg.timestamp)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            <div ref={messagesEndRef} className="h-0 w-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Message Input */}
                    <div className="chat-input-container">
                      <form onSubmit={handleSendMessage} className="flex space-x-2">
                        <input
                          type="text"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          placeholder="Type a message..."
                          className="chat-input flex-1"
                        />
                        <button
                          type="submit"
                          disabled={!connected}
                          className="chat-send-button"
                        >
                          Send
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-500">
                    <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h3 className="text-lg font-medium mb-1">No conversation selected</h3>
                    <p className="max-w-xs">Select a provider from the list to start chatting</p>
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

export default Rentals;