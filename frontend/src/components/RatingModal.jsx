import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import { toast } from 'react-toastify';

const RatingModal = ({ isOpen, onClose, rental, vehicle }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a star rating');
      return;
    }

    try {
      setIsSubmitting(true);

      // Get user info from auth
      const auth = localStorage.getItem('auth');
      if (!auth) {
        toast.error('Please login to submit a review');
        return;
      }
      const { user: authUser } = JSON.parse(auth);
      if (!authUser) {
        toast.error('User information not found');
        return;
      }

      await api.post('/ratings', {
        vehicleId: rental.vehicleId,
        userId: rental.userId,
        rating,
        comment,
        userName: authUser.fullName || authUser.name
      });

      toast.success('Your review has been submitted successfully!');
      onClose('success');
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Unable to submit review. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={() => !isSubmitting && onClose()} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6">
          <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Rate Your Trip
          </Dialog.Title>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="mb-4">
              <h3 className="font-medium text-gray-700">{vehicle?.name}</h3>
              <p className="text-sm text-gray-500">
                From: {new Date(rental.startDate).toLocaleDateString('en-US')} <br />
                To: {new Date(rental.endDate).toLocaleDateString('en-US')}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="text-yellow-400 hover:scale-110 transition-transform"
                  disabled={isSubmitting}
                >
                  {star <= rating ? (
                    <StarIcon className="h-8 w-8" />
                  ) : (
                    <StarOutlineIcon className="h-8 w-8" />
                  )}
                </button>
              ))}
            </div>
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
                Your Comment
              </label>
              <textarea
                id="comment"
                rows={4}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                placeholder="Share your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => onClose()}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default RatingModal;