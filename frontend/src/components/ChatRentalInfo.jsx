import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/formatCurrency';

const ChatRentalInfo = ({ userId, recipientId, isProvider }) => {
  const [rental, setRental] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch the latest active rental between the user and recipient
  useEffect(() => {
    const fetchActiveRental = async () => {
      if (!userId || !recipientId) return;
      
      try {
        setLoading(true);
        const auth = JSON.parse(localStorage.getItem('auth'));
        const token = auth?.token;
        
        if (!token) throw new Error('No authentication token found');

        // Fetch all rentals
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
        const allRentals = rentalsData.data?.rentals || [];
        
        // Find active rentals between these two users
        let activeRentals = [];
        
        // For provider: look for rentals where userId is the customer and vehicle belongs to provider
        // For customer: look for rentals where userId is customer and provider owns the vehicle
        for (const r of allRentals) {
          try {
            // Skip cancelled, rejected or completed rentals
            // if (['cancelled', 'rejected', 'completed'].includes(r.status)) {
            //   continue;
            // }
            
            // Get vehicle details to check provider
            const vehicleResponse = await fetch(`http://localhost:3000/vehicles/${r.vehicleId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (!vehicleResponse.ok) continue;
            
            const vehicleData = await vehicleResponse.json();
            const vehicle = vehicleData.data;
            
            const vehicleProviderId = vehicle?.car_providerId?._id || vehicle?.car_providerId;
            
            // Match the rental to our chat participants
            if (isProvider) {
              // Provider view: customer + provider's vehicle
              if (r.userId === recipientId && vehicleProviderId === userId) {
                activeRentals.push({ ...r, vehicle });
              }
            } else {
              // Customer view: customer + provider's vehicle
              if (r.userId === userId && vehicleProviderId === recipientId) {
                activeRentals.push({ ...r, vehicle });
              }
            }
          } catch (error) {
            console.error('Error processing rental:', error);
          }
        }
        
        // Sort by startDate descending (newest first)
        activeRentals.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        
        // Get the most recent active rental
        if (activeRentals.length > 0) {
          setRental(activeRentals[0]);
          setVehicle(activeRentals[0].vehicle);
        }
      } catch (error) {
        console.error('Error fetching active rental:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveRental();
  }, [userId, recipientId, isProvider]);

  if (loading) {
    return (
      <div className="p-3 border-b border-gray-200 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!rental) {
    return null; // No active rental, don't show anything
  }

  // Format dates
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="p-3 border-b border-gray-200 bg-blue-50">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium text-blue-800">Active Rental</h3>
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}
        </span>
      </div>
      
      <div className="flex items-center">
        {vehicle?.images && vehicle.images.length > 0 ? (
          <img 
            src={`http://localhost:3002${vehicle.images[0]}`}
            alt={vehicle.name}
            className="w-10 h-10 object-cover rounded mr-2"
          />
        ) : (
          <div className="w-10 h-10 bg-gray-200 rounded mr-2 flex items-center justify-center text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        )}
        
        <div className="flex-1">
          <p className="text-sm font-medium">{vehicle?.name || 'Vehicle'}</p>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatDate(rental.startDate)} - {formatDate(rental.endDate)}</span>
            <span className="font-medium text-blue-600">{formatCurrency(rental.totalPrice)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatRentalInfo; 