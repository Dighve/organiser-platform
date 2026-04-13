import React from 'react';

const RatingBar = ({ label, value, maxValue = 5 }) => {
  const percentage = (value / maxValue) * 100;
  
  const getColorClass = () => {
    if (value >= 4.5) return 'from-purple-500 to-pink-500';
    if (value >= 3.5) return 'from-pink-500 to-orange-400';
    if (value >= 2.5) return 'from-orange-400 to-yellow-400';
    return 'from-gray-400 to-gray-500';
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">{value.toFixed(1)}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${getColorClass()} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default RatingBar;
