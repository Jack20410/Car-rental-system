import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { endpoints } from '../utils/api';

const DEFAULT_AVATAR = 'http://localhost:3001/avatar/user.png';

const Profile = () => {
  const { user, getAuthState } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phoneNumber || '',
    address: user?.address || '',
    avatar: user?.avatar || DEFAULT_AVATAR,
  });
  const [previewAvatar, setPreviewAvatar] = useState(user?.avatar || DEFAULT_AVATAR);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Preview the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewAvatar(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Will be handled in form submission
      setFormData({
        ...formData,
        avatarFile: file
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Create form data for file upload
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      submitData.append('phoneNumber', formData.phone);
      
      if (formData.address) {
        submitData.append('address', formData.address);
      }
      
      // If we have a new avatar file
      if (formData.avatarFile) {
        submitData.append('avatar', formData.avatarFile);
      }

      await api.put(endpoints.user.update, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      
      // Force a reload of the profile
      window.location.reload();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">User Profile</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and preferences.</p>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {message.text && (
            <div className={`px-4 py-3 ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {message.text}
            </div>
          )}

          {isEditing ? (
            <div className="px-4 py-5 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center mb-6">
                  <div className="relative">
                    <img 
                      src={previewAvatar} 
                      alt="Profile Avatar" 
                      className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_AVATAR;
                      }}
                    />
                    <label 
                      htmlFor="avatar-upload" 
                      className="absolute bottom-0 right-0 bg-primary text-white p-1 rounded-full cursor-pointer hover:bg-secondary"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </label>
                    <input 
                      id="avatar-upload" 
                      name="avatar" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleAvatarChange}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">Click on the edit icon to change your avatar</p>
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled
                    className="mt-1 block w-full border border-gray-300 bg-gray-100 rounded-md shadow-sm py-2 px-3"
                  />
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phone"
                    id="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <textarea
                    name="address"
                    id="address"
                    rows="3"
                    value={formData.address}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="border-t border-gray-200">
              <div className="flex justify-center py-5">
                <img 
                  src={user.avatar || DEFAULT_AVATAR} 
                  alt="Profile Avatar" 
                  className="h-32 w-32 rounded-full object-cover border-2 border-gray-200"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DEFAULT_AVATAR;
                  }}
                />
              </div>
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Full name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.name}</dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Email address</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.email}</dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Phone number</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user.phoneNumber || 'Not provided'}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user.address || 'Not provided'}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary text-white">
                      {user.role || 'User'}
                    </span>
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Member since</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile; 