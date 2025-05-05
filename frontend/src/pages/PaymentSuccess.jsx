import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { formatCurrency } from '../utils/formatCurrency';
import api from '../utils/api';

const PaymentSuccess = () => {
  const location = useLocation();
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Parse query params from the URL
    const queryParams = new URLSearchParams(location.search);
    const paymentStatus = queryParams.get('resultCode');
    
    // If no resultCode or not successful, set null payment info
    if (!paymentStatus || paymentStatus !== '0') {
      setPaymentInfo(null);
      setLoading(false);
      return;
    }
    
    // Try to extract data from query params
    const paymentId = queryParams.get('orderId');
    const amount = queryParams.get('amount');
    const extraData = queryParams.get('extraData');
    
    let rentalId = '';
    
    // Try to decode extraData if available
    if (extraData) {
      try {
        const decodedData = JSON.parse(atob(extraData));
        rentalId = decodedData.rentalId;
        
        // If we have a rentalId, check the payment status first
        // instead of immediately updating it
        if (rentalId) {
          checkAndUpdateRentalPaymentStatus(rentalId);
        }
      } catch (e) {
        console.error('Failed to decode extraData:', e);
        setLoading(false);
      }
    }
    
    setPaymentInfo({
      paymentId,
      amount: amount ? parseInt(amount) : 0,
      rentalId,
      date: new Date().toLocaleDateString()
    });
    
    if (!rentalId) {
      setLoading(false);
    }
  }, [location]);

  // Function to check and then update the rental payment status
  const checkAndUpdateRentalPaymentStatus = async (rentalId) => {
    try {
      // First check if the rental exists and get its payment status
      const rentalResponse = await api.get(`/rentals/${rentalId}`);
      const rental = rentalResponse.data.data;
      
      // If already paid, don't update again
      if (rental && rental.paymentStatus === 'paid') {
        console.log('Rental payment status is already paid, skipping frontend update');
        setLoading(false);
        return;
      }
      
      // Only proceed with the update if we confirmed it's not already paid
      const response = await api.patch(`/rentals/${rentalId}/payment`, {
        paymentStatus: 'paid'
      });
      
      console.log('Payment status updated successfully from frontend:', response.data);
    } catch (error) {
      console.error('Error updating rental payment status:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-600">Processing your payment...</p>
          </div>
        ) : paymentInfo ? (
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="h-10 w-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">Payment Successful!</h1>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Payment Details</h2>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment ID:</span>
                    <span className="font-medium">{paymentInfo.paymentId}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rental ID:</span>
                    <span className="font-medium">{paymentInfo.rentalId}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{paymentInfo.date}</span>
                  </div>
                  
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                    <span className="font-semibold">Amount Paid:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(paymentInfo.amount)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-3">
                <Link 
                  to="/rentals" 
                  className="w-full py-3 px-4 bg-primary text-white text-center font-medium rounded-md hover:bg-primary-dark"
                >
                  View My Rentals
                </Link>
                
                <Link 
                  to="/" 
                  className="w-full py-3 px-4 bg-gray-100 text-gray-700 text-center font-medium rounded-md hover:bg-gray-200"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="h-10 w-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">Payment Incomplete</h1>
            
            <p className="text-center text-gray-600 mb-6">
              Your payment was not completed or there was an issue processing it.
            </p>
            
            <div className="flex flex-col space-y-3">
              <Link 
                to="/rentals" 
                className="w-full py-3 px-4 bg-primary text-white text-center font-medium rounded-md hover:bg-primary-dark"
              >
                Return to Rentals
              </Link>
              
              <Link 
                to="/" 
                className="w-full py-3 px-4 bg-gray-100 text-gray-700 text-center font-medium rounded-md hover:bg-gray-200"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess; 