import React, { useState } from 'react';

interface GalleryProps {
  imageUrls: string[]; // List of image URLs from localStorage
  onThumbnailClick: (url: string) => void; // Callback when a thumbnail is clicked
  onClearGallery?: () => void; // Optional callback to clear the gallery
}

const Gallery: React.FC<GalleryProps> = ({ imageUrls, onThumbnailClick, onClearGallery }) => {
  const [clearConfirm, setClearConfirm] = useState<boolean>(false);

  const handleClearGallery = () => {
    // Show confirmation dialog
    setClearConfirm(true);
  };

  const handleConfirmClear = () => {
    // Call the parent component's clear function
    if (onClearGallery) {
      onClearGallery();
    }
    setClearConfirm(false);
  };

  const handleCancelClear = () => {
    setClearConfirm(false);
  };

  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-4 transition-colors duration-200">
        No recent generations found in this browser session.
      </div>
    );
  }

  return (
    <div>
      {/* Mobile scrolling gallery */}
      <div className="block md:hidden overflow-x-auto py-2 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-200 dark:scrollbar-track-gray-700 transition-colors duration-200">
        <div className="inline-flex space-x-3">
          {imageUrls.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="flex-shrink-0 w-24 h-24 rounded border border-gray-300 dark:border-gray-600 overflow-hidden cursor-pointer hover:opacity-90 hover:border-primary-500 dark:hover:border-primary-400 transition-all duration-200 animate-fade-in"
              onClick={() => onThumbnailClick(url)}
            >
              <img
                src={url}
                alt={`Generated image ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop grid gallery */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {imageUrls.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className="aspect-square rounded border border-gray-300 dark:border-gray-600 overflow-hidden cursor-pointer hover:opacity-90 hover:border-primary-500 dark:hover:border-primary-400 hover:shadow-md transition-all duration-200 animate-fade-in"
            onClick={() => onThumbnailClick(url)}
          >
            <img
              src={url}
              alt={`Generated image ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* Gallery actions - only show if there are images and onClearGallery is provided */}
      {imageUrls.length > 0 && onClearGallery && (
        <div className="mt-4 flex justify-end">
          {clearConfirm ? (
            <div className="flex space-x-2 items-center animate-fade-in">
              <span className="text-sm text-gray-600 dark:text-gray-300">Clear all images?</span>
              <button
                className="text-sm px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                onClick={handleConfirmClear}
              >
                Yes
              </button>
              <button
                className="text-sm px-2 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded transition-colors"
                onClick={handleCancelClear}
              >
                No
              </button>
            </div>
          ) : (
            <button
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              onClick={handleClearGallery}
            >
              Clear Gallery
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Gallery;