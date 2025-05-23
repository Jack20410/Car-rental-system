import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchBar = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDates, setSelectedDates] = useState({
    pickup: {
      date: ''
    },
    return: {
      date: ''
    }
  });
  
  // Current displayed month/year in calendar
  const [currentView, setCurrentView] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear()
  });
  
  // Days of the week
  const weekDays = useMemo(() => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], []);
  
  // Generate calendar days for current month
  const generateCalendarDays = useCallback((month, year) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const days = [];
    
    // Adjust first day (0 is Sunday in JS but we want Monday as first day)
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    // Add empty slots for days before first of month
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  }, []);
  
  // Get next month
  const nextMonth = useCallback(() => {
    setCurrentView(prev => {
      if (prev.month === 11) {
        return { month: 0, year: prev.year + 1 };
      } else {
        return { ...prev, month: prev.month + 1 };
      }
    });
  }, []);
  
  // Get previous month
  const prevMonth = useCallback(() => {
    setCurrentView(prev => {
      if (prev.month === 0) {
        return { month: 11, year: prev.year - 1 };
      } else {
        return { ...prev, month: prev.month - 1 };
      }
    });
  }, []);
  
  // Format date for display
  const formatDateDisplay = useCallback(() => {
    if (!selectedDates.pickup.date || !selectedDates.return.date) return 'Select dates';
    
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };
    
    const pickup = formatDate(selectedDates.pickup.date);
    const returnDate = formatDate(selectedDates.return.date);
    
    return `${pickup} - ${returnDate}`;
  }, [selectedDates]);
  
  // Handle day selection
  const handleDaySelect = useCallback((day, month, year) => {
    if (!day) return;
    
    const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // If no pickup date is selected or a return date is already selected, set pickup date
    if (!selectedDates.pickup.date || selectedDates.return.date) {
      setSelectedDates({
        pickup: { ...selectedDates.pickup, date: dateStr },
        return: { ...selectedDates.return, date: '' }
      });
    } 
    // If pickup date is selected, set return date
    else {
      const pickupDate = new Date(selectedDates.pickup.date);
      const newDate = new Date(dateStr);
      
      // Ensure return date is not before pickup date
      if (newDate >= pickupDate) {
        setSelectedDates(prev => ({
          ...prev,
          return: { ...prev.return, date: dateStr }
        }));
      } else {
        // If selected date is before pickup, swap dates
        setSelectedDates({
          pickup: { ...selectedDates.pickup, date: dateStr },
          return: { ...selectedDates.return, date: selectedDates.pickup.date }
        });
      }
    }
  }, [selectedDates]);
  
  // Available cities
  const cities = useMemo(() => [
    'Ho Chi Minh',
    'Ha Noi',
    'Da Nang',
    'Nha Trang',
    'Quy Nhon'
  ], []);

  // Handle location change
  const handleLocationChange = useCallback((e) => {
    setLocation(e.target.value);
  }, []);
  
  // Handle search submission
  const handleSearch = useCallback(() => {
    if (!location || !selectedDates.pickup.date || !selectedDates.return.date) {
      alert('Please fill in all fields');
      return;
    }

    // Convert city name to lowercase and remove spaces for API
    const formattedCity = location.toLowerCase().replace(/\s+/g, '');

    // Lấy danh sách xe theo thành phố
    fetch(`http://localhost:3000/vehicles?city=${formattedCity}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(async vehiclesResponse => {
        if (!vehiclesResponse.success) {
          throw new Error(vehiclesResponse.message || 'Error fetching vehicles');
        }

        // Lấy danh sách xe
        const vehicles = Array.isArray(vehiclesResponse.data) 
          ? vehiclesResponse.data 
          : vehiclesResponse.data?.vehicles || [];

        // Kiểm tra availability cho từng xe trong khoảng ngày đã chọn
        const availableVehicles = [];
        for (const vehicle of vehicles) {
          if (!vehicle || vehicle.status !== 'Available') continue;
          try {
            const res = await fetch(
              `http://localhost:3000/rentals/availability?vehicleId=${vehicle._id}&startDate=${selectedDates.pickup.date}&endDate=${selectedDates.return.date}`
            );
            if (!res.ok) continue;
            const avail = await res.json();
            // Đảm bảo chỉ push xe nếu avail.data.isAvailable === true
            if (avail.success && avail.data?.isAvailable === true) {
              availableVehicles.push(vehicle);
            }
          } catch (err) {
            continue;
          }
        }

        // Lưu kết quả vào sessionStorage
        const searchResults = {
          vehicles: availableVehicles,
          searchCriteria: {
            city: location,
            startDate: selectedDates.pickup.date,
            endDate: selectedDates.return.date
          }
        };
        sessionStorage.setItem('searchResults', JSON.stringify(searchResults));

        // Điều hướng sang trang cars với tham số tìm kiếm
        const queryParams = new URLSearchParams({
          city: location,
          startDate: selectedDates.pickup.date,
          endDate: selectedDates.return.date
        }).toString();
        navigate(`/cars?${queryParams}`);
      })
      .catch(error => {
        console.error('Error during search:', error);
        alert('Error searching for vehicles. Please try again.');
      });
  }, [location, selectedDates, navigate]);
  
  // Months array for display
  const months = useMemo(() => [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ], []);
  
  // Check if day is selected
  const isDaySelected = useCallback((day, month, year) => {
    if (!day) return false;
    
    const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return selectedDates.pickup.date === dateStr || selectedDates.return.date === dateStr;
  }, [selectedDates]);
  
  // Check if day is in range between pickup and return
  const isDayInRange = useCallback((day, month, year) => {
    if (!day || !selectedDates.pickup.date || !selectedDates.return.date) return false;
    
    const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const date = new Date(dateStr);
    const pickup = new Date(selectedDates.pickup.date);
    const returnDate = new Date(selectedDates.return.date);
    
    return date > pickup && date < returnDate;
  }, [selectedDates]);
  
  // Toggle date modal
  const toggleDateModal = useCallback(() => {
    setShowDateModal(prev => !prev);
  }, []);
  
  return (
    <>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-6xl mx-auto">
        <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center gap-4">
          {/* Location selector */}
          <div className="flex-1 flex items-center border rounded-lg p-3 gap-2 hover:border-blue-600 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <label className="block text-xs text-gray-600 font-medium mb-1">Location</label>
              <select
                value={location}
                onChange={handleLocationChange}
                className="w-full outline-none text-gray-800 bg-transparent"
              >
                <option value="">Select a city</option>
                {cities.map(city => (
                  <option key={city} value={city}>
                    {city.charAt(0).toUpperCase() + city.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Date/time selector */}
          <div 
            className="flex-1 flex items-center border rounded-lg p-3 gap-2 cursor-pointer hover:border-blue-600 transition"
            onClick={toggleDateModal}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <label className="block text-xs text-gray-600 font-medium mb-1">Rental Period</label>
              <div className="text-gray-800">{formatDateDisplay()}</div>
            </div>
          </div>
          
          {/* Search button */}
          <button 
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg transition font-medium w-full md:w-auto"
          >
            Find Cars
          </button>
        </div>
      </div>
      
      {/* Date selection modal */}
      {showDateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            {/* Modal header */}
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Rental Period</h2>
              <button 
                onClick={toggleDateModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Tabs */}
            <div className="p-4 border-b">
              <div className="grid gap-4">
                <button className="text-center py-2 border-b-2 border-blue-600 text-blue-600 font-medium">
                  Rent by Day
                </button>
              </div>
            </div>
            
            {/* Calendar section */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current month */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <button onClick={prevMonth} className="p-1 text-gray-600 hover:text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h3 className="font-medium text-lg text-gray-800">
                    {months[currentView.month]} {currentView.year}
                  </h3>
                  <div className="w-5"></div> {/* Empty space for alignment */}
                </div>
                
                {/* Weekday headers */}
                <div className="grid grid-cols-7 mb-2">
                  {weekDays.map(day => (
                    <div key={day} className="text-center text-sm font-medium py-2 text-gray-700">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-1">
                  {generateCalendarDays(currentView.month, currentView.year).map((day, index) => (
                    <div 
                      key={index} 
                      className={`
                        h-10 flex items-center justify-center text-sm rounded-md
                        ${!day ? 'text-gray-300' : 'cursor-pointer hover:bg-gray-100 text-gray-800'}
                        ${isDaySelected(day, currentView.month, currentView.year) ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                        ${isDayInRange(day, currentView.month, currentView.year) ? 'bg-blue-100 text-gray-800' : ''}
                      `}
                      onClick={() => handleDaySelect(day, currentView.month, currentView.year)}
                    >
                      {day}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Next month */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="w-5"></div> {/* Empty space for alignment */}
                  <h3 className="font-medium text-lg text-gray-800">
                    {currentView.month === 11 
                      ? `${months[0]} ${currentView.year + 1}` 
                      : `${months[currentView.month + 1]} ${currentView.year}`}
                  </h3>
                  <button onClick={nextMonth} className="p-1 text-gray-600 hover:text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                
                {/* Weekday headers */}
                <div className="grid grid-cols-7 mb-2">
                  {weekDays.map(day => (
                    <div key={day} className="text-center text-sm font-medium py-2 text-gray-700">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-1">
                  {generateCalendarDays(
                    currentView.month === 11 ? 0 : currentView.month + 1, 
                    currentView.month === 11 ? currentView.year + 1 : currentView.year
                  ).map((day, index) => (
                    <div 
                      key={index} 
                      className={`
                        h-10 flex items-center justify-center text-sm rounded-md
                        ${!day ? 'text-gray-300' : 'cursor-pointer hover:bg-gray-100 text-gray-800'}
                        ${isDaySelected(
                          day, 
                          currentView.month === 11 ? 0 : currentView.month + 1, 
                          currentView.month === 11 ? currentView.year + 1 : currentView.year
                        ) ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                        ${isDayInRange(
                          day, 
                          currentView.month === 11 ? 0 : currentView.month + 1, 
                          currentView.month === 11 ? currentView.year + 1 : currentView.year
                        ) ? 'bg-blue-100 text-gray-800' : ''}
                      `}
                      onClick={() => handleDaySelect(
                        day, 
                        currentView.month === 11 ? 0 : currentView.month + 1, 
                        currentView.month === 11 ? currentView.year + 1 : currentView.year
                      )}
                    >
                      {day}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Footer with buttons */}
            <div className="p-4 border-t flex justify-end">
              <button 
                onClick={() => setShowDateModal(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default React.memo(SearchBar);