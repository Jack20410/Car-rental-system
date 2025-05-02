import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { endpoints } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';
import { toast } from 'react-toastify';

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
            const providerId = typeof vehicleData.car_providerId === 'object' 
              ? vehicleData.car_providerId._id 
              : vehicleData.car_providerId;
              
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRentals = async () => {
    try {
      const response = await api.get('/rentals');
      setRentals(response.data.data || []);
    } catch (err) {
      setError('Failed to load your rental history. Please try again later.');
      console.error('Error fetching rentals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentals();
  }, []);

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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
      </div>
    </div>
  );
};

export default Rentals; 