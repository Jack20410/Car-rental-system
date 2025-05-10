import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import { toast } from 'react-toastify';

const RatingModal = ({ isOpen, onClose, rental, vehicle, onRatingUpdate }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRating, setExistingRating] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [canUpdate, setCanUpdate] = useState(true);

  useEffect(() => {
    const fetchExistingRating = async () => {
      try {
        const response = await api.get(`/ratings/by-rental/${rental._id}`);
        if (response.data) {
          setExistingRating(response.data);
          setRating(response.data.rating);
          setComment(response.data.comment || '');
          setIsEditing(true);
          setCanUpdate(response.data.updateCount < 1);
        } else {
          setExistingRating(null);
          setRating(0);
          setComment('');
          setIsEditing(false);
          setCanUpdate(true);
        }
      } catch (error) {
        console.error('Error fetching existing rating:', error);
      }
    };

    if (isOpen && rental?._id) {
      fetchExistingRating();
    }
  }, [isOpen, rental]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a star rating');
      return;
    }

    try {
      setIsSubmitting(true);

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

      let response;
      if (isEditing && existingRating) {
        if (!canUpdate) {
          toast.error('You can only update your rating once');
          return;
        }
        response = await api.put(`/ratings/${existingRating._id}`, {
          rating,
          comment,
          userId: authUser._id
        });
        toast.success('Your review has been updated successfully!');
      } else {
        response = await api.post('/ratings', {
          vehicleId: rental.vehicleId,
          userId: rental.userId,
          rentalId: rental._id,
          rating,
          comment,
          userName: authUser.fullName || authUser.name
        });
        toast.success('Your review has been submitted successfully!');
      }

      // Gọi callback để cập nhật trạng thái ở component cha
      if (onRatingUpdate) {
        onRatingUpdate({
          rentalId: rental._id,
          hasRating: true,
          updateCount: response.data.updateCount || 0
        });
      }

      onClose('success');
    } catch (error) {
      console.error('Error submitting rating:', error);
      const errorMessage = error.response?.data?.error || 'Unable to submit review. Please try again later.';
      toast.error(errorMessage);
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
            {isEditing ? (canUpdate ? 'Edit Your Review' : 'Check Your Review') : 'Rate Your Trip'}
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
                  onClick={() => canUpdate && setRating(star)}
                  className={`text-yellow-400 transition-transform ${canUpdate ? 'hover:scale-110' : ''}`}
                  disabled={isSubmitting || !canUpdate}
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
                onChange={(e) => canUpdate && setComment(e.target.value)}
                disabled={isSubmitting || !canUpdate}
              />
            </div>
            <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md">
              {isEditing ? 
                (canUpdate ? 
                  "You only can update review once time." : 
                  "You have already updated your review.") : 
                "You only can update review once time."}
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
              {canUpdate && (
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : isEditing ? 'Update Review' : 'Submit Review'}
                </button>
              )}
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default RatingModal;