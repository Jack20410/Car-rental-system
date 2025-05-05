import { useState } from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import api, { endpoints } from '../utils/api';
import { toast } from 'react-toastify';

const PaymentModal = ({ isOpen, onClose, rental, vehicle, provider }) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  if (!isOpen) return null;

  const handlePaymentMethodChange = (e) => {
    setPaymentMethod(e.target.value);
  };

  const handlePayment = async () => {
    try {
      setLoading(true);

      if (paymentMethod === 'cash') {
        // For cash payment, just update the rental payment status
        await api.patch(`/rentals/${rental._id}/payment`, {
          paymentStatus: 'paid'
        });

        toast.success('Cash payment recorded successfully!');
        onClose('success');
      } else if (paymentMethod === 'momo') {
        // For MOMO payment, create a payment through the payment service
        const response = await api.post('/payments/momo', {
          rentalId: rental._id
        });

        // Redirect to MOMO payment page
        if (response.data && response.data.payUrl) {
          // Clear any existing toasts before redirecting
          if (toast.dismiss) {
            toast.dismiss();
          }
          
          // Don't show a toast for MOMO payments - it will be handled on redirect
          window.location.href = response.data.payUrl;
        } else {
          toast.error('Could not generate payment URL');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(
        error.response?.data?.message || 
        'Payment processing failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-primary text-white px-6 py-4">
          <h3 className="text-lg font-semibold">Payment for Rental</h3>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Rental Information */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Rental Details</h4>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Vehicle:</span>
                <span className="font-medium">{vehicle?.name || 'Unknown Vehicle'}</span>
              </div>

              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Provider:</span>
                <span className="font-medium">{provider?.fullName || 'Unknown Provider'}</span>
              </div>

              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Rental Period:</span>
                <span className="font-medium">
                  {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                </span>
              </div>

              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium capitalize">{rental.status}</span>
              </div>

              <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-200">
                <span>Total Amount:</span>
                <span className="text-primary">{formatCurrency(rental.totalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Select Payment Method</h4>
            <div className="space-y-3">
              <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={handlePaymentMethodChange}
                  className="h-5 w-5 text-primary focus:ring-primary border-gray-300"
                />
                <div className="ml-3">
                  <span className="font-medium text-gray-900">Cash</span>
                  <p className="text-sm text-gray-500">Pay in cash directly to the provider</p>
                </div>
              </label>

              <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="momo"
                  checked={paymentMethod === 'momo'}
                  onChange={handlePaymentMethodChange}
                  className="h-5 w-5 text-primary focus:ring-primary border-gray-300"
                />
                <div className="ml-3">
                  <span className="font-medium text-gray-900">MOMO</span>
                  <p className="text-sm text-gray-500">Pay online with MOMO</p>
                </div>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              type="button"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                `Pay with ${paymentMethod === 'cash' ? 'Cash' : 'MOMO'}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal; 