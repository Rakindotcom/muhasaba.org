import React, { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';

const DateTimeDisplay = ({ className = '' }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {formatTime(currentTime)}
            </div>
            <div className="text-lg text-gray-500">Current Time</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-green-600" />
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-900">
              {formatDate(currentTime)}
            </div>
            <div className="text-lg text-gray-500">Today's Date</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateTimeDisplay;