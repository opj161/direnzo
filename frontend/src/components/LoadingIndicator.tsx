import React from 'react';

interface LoadingIndicatorProps {
  isActive: boolean; // Controls visibility
  message?: string; // Optional message
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ isActive, message = "Generating image, please wait..." }) => {
  if (!isActive) {
    return null; // Don't render anything if not active
  }

  return (
    <div className="absolute inset-0 bg-white dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 flex flex-col items-center justify-center z-10 transition-colors duration-200">
      {/* Reusing the spinner SVG */}
      <svg className="animate-spin h-8 w-8 text-primary-600 dark:text-primary-400 mb-2 transition-colors duration-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="text-primary-600 dark:text-primary-400 font-medium transition-colors duration-200">{message}</p>
    </div>
  );
};

export default LoadingIndicator;