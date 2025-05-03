import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api, { endpoints } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';
import { toast } from 'react-toastify';
import { useChat } from '../context/ChatContext';
import ChatWindow from '../components/ChatWindow';
import PaymentModal from '../components/PaymentModal';
import { useRentalWebSocket } from '../context/RentalWebSocketContext';

const RentalCard = ({ rental, onStatusChange, onPaymentClick }) => {
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
      started: 'bg-green-100 text-green-800',
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

          {/* History Timelines - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Status History Timeline */}
            <div>
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
                      {formatDate(history.changedAt)}
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
                'bg-red-100 text-red-800'
              }`}>
                {rental.paymentStatus}
              </span>
            </div>
            <div className="flex gap-2">
              {rental.status === 'pending' && (
                <button
                  onClick={() => onStatusChange(rental._id, 'cancelled')}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Cancel Rental
                </button>
              )}
              {rental.status === 'approved' && (
                <button
                  onClick={() => onStatusChange(rental._id, 'started')}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Start Rental
                </button>
              )}
              {['approved', 'started', 'completed'].includes(rental.status) && 
               rental.paymentStatus === 'unpaid' && (
                <button
                  onClick={() => onPaymentClick(rental, vehicle, provider)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Pay Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Rentals = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [rentals, setRentals] = useState([]);
  const [allRentals, setAllRentals] = useState([]);
  const [loading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('rentals');
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [rentalStatusFilter, setRentalStatusFilter] = useState('all');
  
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
    unreadMessages
  } = useChat();
  const messagesEndRef = useRef(null);
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const processedMessageIds = useRef(new Set());

  // Rental WebSocket context
  const { sendRentalUpdate } = useRentalWebSocket();

  // Handle new messages with useCallback and prevent duplicate processing
  const handleNewMessage = useCallback((event) => {
    //console.log("Event received in Rentals:", event);
    
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
      //console.log("Skipping already processed message:", messageId);
      return;
    }
    
    //console.log("New message received in Rentals:", message);
    processedMessageIds.current.add(messageId);
    
    // Only add message to this chat if it belongs to the current conversation
    if (currentChat && message.chatId === currentChat.id) {
      setChatMessages(prev => {
        // Check if message is already in the array
        const isDuplicate = prev.some(m => 
          m.senderId === message.senderId && 
          m.text === message.text && 
          m.timestamp === message.timestamp
        );
        
        if (isDuplicate) {
          //console.log("Duplicate message detected, skipping update");
          return prev;
        }
        
        //console.log("Adding new message to chat:", message);
        return [...prev, message];
      });
    } else {
      console.log("Message doesn't belong to current chat or no chat is selected");
      if (currentChat) {
        console.log("Current chat ID:", currentChat.id);
        console.log("Message chat ID:", message.chatId);
      }
    }
  }, [currentChat]);

  // Clear processed messages when currentChat changes
  useEffect(() => {
    processedMessageIds.current.clear();
  }, [currentChat]);

  const fetchRentals = async () => {
    try {
      //console.log('Fetching all rentals');
      const response = await api.get('/rentals');
      const fetchedRentals = response.data.data || [];
      //console.log('Fetched rentals:', fetchedRentals);
      setAllRentals(fetchedRentals);
    } catch (err) {
      setError('Failed to load your rental history. Please try again later.');
      console.error('Error fetching rentals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // console.log('Applying filter:', rentalStatusFilter);
    // console.log('Current all rentals:', allRentals);
    
    const filteredRentals = rentalStatusFilter === 'all'
      ? allRentals
      : allRentals.filter(rental => rental.status === rentalStatusFilter);
    
    // console.log('Filtered rentals:', filteredRentals);
    setRentals(filteredRentals);
  }, [rentalStatusFilter, allRentals]);

  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchProviders = useCallback(async () => {
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

      // Check if we should auto-select a provider with unread messages
      // This happens when user clicks on notification bell
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'messages' && providersList.length > 0) {
        // Get unread messages status
        const unreadMessages = JSON.parse(localStorage.getItem('unread_messages') || '{}');
        
        // Find a provider with unread messages
        let providerWithUnread = null;
        
        // Look through unread message chats to find a provider
        for (const chatId in unreadMessages) {
          if (unreadMessages[chatId] > 0) {
            // Chat IDs are formed as smaller_id_larger_id
            const ids = chatId.split('_');
            // Find which ID is the provider (not the current user)
            const providerId = ids.find(id => id !== userId);
            
            if (providerId) {
              // Find this provider in our list
              providerWithUnread = providersList.find(p => p._id === providerId);
              if (providerWithUnread) break;
            }
          }
        }
        
        // Auto-select the first provider with unread messages, or the first provider if none have unread messages
        setSelectedProvider(providerWithUnread || providersList[0]);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast.error('Could not load providers. Please try again later.');
    } finally {
      setIsLoadingProviders(false);
    }
  }, [user, createChatId]);

  useEffect(() => {
    if (activeTab === 'messages') {
      fetchProviders();
    }
  }, [activeTab]);

  // Add useEffect to listen for rental updates
  useEffect(() => {
    const handleRentalUpdate = (event) => {
      const update = event.detail;
      console.log('Received rental update:', update);
      
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
      const response = await api.patch(`/rentals/${rentalId}/status`, {
        status: newStatus
      });
      
      if (response.data.success) {
        // Gửi thông báo qua WebSocket
        sendRentalUpdate({
          type: 'RENTAL_UPDATE',
          rentalId,
          newStatus,
          updatedBy: user._id,
          timestamp: new Date().toISOString()
        });
        
        toast.success('Rental status updated successfully');
        fetchRentals();
      }
    } catch (error) {
      console.error('Error updating rental status:', error);
      
      const errorMessage = error.response?.data?.message || 
                          'Failed to update rental status. Please try again.';
      
      if (errorMessage.includes('Cannot start rental until payment is completed')) {
        toast.error('Payment is required before starting the rental. Please complete the payment first.');
      } else if (errorMessage.includes('Not authorized')) {
        toast.error('You are not authorized to perform this action.');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handlePaymentClick = (rental, vehicle, provider) => {
    setSelectedRental(rental);
    setSelectedVehicle(vehicle);
    setSelectedProvider(provider);
    setShowPaymentModal(true);
  };

  // Handler for closing the payment modal
  const handleClosePaymentModal = (result) => {
    setShowPaymentModal(false);
    
    // If payment was successful, refresh the rentals list
    if (result === 'success') {
      fetchRentals();
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
    if (currentChat) {
      console.log("Current chat changed:", currentChat);
      setActiveChat(currentChat);
      
      // Get current messages and update local state
      const loadMessages = async () => {
        await loadChatMessages(currentChat.id);
      };
      loadMessages();
    }
  }, [currentChat, loadChatMessages]);

  // Listen for new messages
  useEffect(() => {
    window.addEventListener('chat-message', handleNewMessage);
    return () => {
      window.removeEventListener('chat-message', handleNewMessage);
    };
  }, [handleNewMessage]);

  // Start chat with provider
  const startChat = (provider) => {
    if (!provider) return;
    
    try {
      // Clear previous chat messages first
      setChatMessages([]);
      processedMessageIds.current.clear();
      
      // Use the consistent chatId function to ensure the same ID is used in both directions
      const chatId = createChatId(user._id, provider._id);
      //console.log(`Setting up chat with ${provider.fullName}`);
      
      // Set the current chat with the consistent ID
      setCurrentChat({
        id: chatId,
        recipient: provider
      });
      
      // Pre-load messages for this chat
      loadChatMessages(chatId);
    } catch (error) {
      console.error("Error setting up chat:", error);
      toast.error("Failed to set up chat. Please try again.");
    }
  };

  // Start or select a chat when provider is selected
  useEffect(() => {
    if (selectedProvider) {
      //console.log("Starting chat with provider:", selectedProvider);
      startChat(selectedProvider);
      setActiveChat(selectedProvider._id);
    }
  }, [selectedProvider]);

  // Clear chat state when user changes or logs out
  useEffect(() => {
    if (!user) {
      // Clear all chat-related state
      setChatMessages([]);
      setCurrentChat(null);
      setActiveChat(null);
      processedMessageIds.current.clear();
    }
  }, [user]);

  // Debug current chat state
  useEffect(() => {
    console.log("Current chat state:", { currentChat, messages: chatMessages });
    console.log("User role check:", { isUser: user?.role, isProvider: user?.role === 'car_provider' });
  }, [currentChat, chatMessages, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    // Use RequestAnimationFrame to ensure DOM is ready
    const scrollTimeout = requestAnimationFrame(() => {
      if (messagesEndRef.current && currentChat) {
        // Find the container element for this specific chat
        const chatContainer = messagesEndRef.current.closest('.chat-message-container');
        if (chatContainer) {
          // Scroll the container instead of using scrollIntoView (which can affect page position)
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }
    });
    
    return () => {
      cancelAnimationFrame(scrollTimeout);
    };
  }, [chatMessages, currentChat]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedProvider || !connected) return;
    
    //console.log(`Sending message to ${selectedProvider.fullName} (${selectedProvider._id}): ${messageInput}`);
    
    // Make sure we have a current chat
    if (!currentChat) {
      //console.log("No current chat, starting a new one");
      startChat(selectedProvider);
      
      // Save the message to send after chat is established
      setTimeout(() => {
        sendMessage({
          content: messageInput,
          recipientId: selectedProvider._id
        });
        setMessageInput('');
      }, 500);
      
      return;
    }
    
    // Use chat context to send message
    const success = sendMessage({
      content: messageInput,
      recipientId: selectedProvider._id,
      chatId: currentChat.id
    });
    
    if (success) {
      // Update local messages immediately for better UX
      const newMessage = {
        senderId: user._id,
        text: messageInput,
        timestamp: new Date().toISOString(),
        chatId: currentChat.id
      };
      setChatMessages(prev => [...(prev || []), newMessage]);
      setMessageInput('');
      
      // Request to scroll chat container to bottom after state update
      requestAnimationFrame(() => {
        if (messagesEndRef.current) {
          const chatContainer = messagesEndRef.current.closest('.chat-message-container');
          if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
          }
        }
      });
    } else {
      console.error('Failed to send message');
      toast.error('Failed to send message. Please try again.');
    }
  };

  // Check for tab query parameter to set active tab automatically
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'messages') {
      setActiveTab('messages');
      // Fetch providers when switching to messages tab from notification
      fetchProviders();
    }
  }, [location, fetchProviders]);

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
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">My Rentals</h1>
                <p className="mt-1 text-sm text-gray-500">Track your rental history and status changes</p>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  value={rentalStatusFilter}
                  onChange={(e) => {
                    // console.log('Changing filter to:', e.target.value);
                    setRentalStatusFilter(e.target.value);
                  }}
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
                    onStatusChange={handleRentalStatusChange}
                    onPaymentClick={handlePaymentClick}
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

            <div className="grid grid-cols-4 h-[655px]">
              {/* Providers list */}
              <div className="col-span-1 border-r border-gray-200 overflow-y-auto">
                <div className="p-4">
                  <h2 className="text-lg font-semibold mb-4">Car Providers</h2>
                  <div className="space-y-2">
                    {providers.map(provider => {
                      // Check if this provider has unread messages
                      const providerChatId = createChatId(user._id, provider._id);
                      const hasUnread = unreadMessages[providerChatId] && unreadMessages[providerChatId] > 0;
                      
                      return (
                        <button
                          key={provider._id}
                          onClick={() => startChat(provider)}
                          className={`w-full p-3 rounded-lg text-left transition-colors relative ${
                            currentChat?.recipient?._id === provider._id
                              ? 'bg-blue-50 text-blue-700'
                              : hasUnread 
                                ? 'bg-yellow-50 hover:bg-yellow-100' 
                                : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="font-medium">{provider.fullName}</div>
                          <div className="text-sm text-gray-500">{provider.email}</div>
                          
                          {/* Unread indicator */}
                          {hasUnread && (
                            <span className="absolute top-3 right-3 h-3 w-3 bg-red-500 rounded-full animate-pulse"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Chat window */}
              <div className="col-span-3 p-4">
                {currentChat ? (
                  <div className="h-full chat-wrapper">
                    <ChatWindow 
                      key={currentChat.id}
                      chatId={currentChat.id} 
                      recipient={currentChat.recipient}
                      isProvider={false}
                    />
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    Select a provider to start chatting
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={handleClosePaymentModal}
          rental={selectedRental}
          vehicle={selectedVehicle}
          provider={selectedProvider}
        />
      )}
    </div>
  );
};

export default Rentals;