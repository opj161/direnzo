import React from 'react';

interface GalleryProps {
  imageUrls: string[]; // List of image URLs from localStorage
  onThumbnailClick: (url: string) => void; // Callback when a thumbnail is clicked
}

const Gallery: React.FC<GalleryProps> = ({ imageUrls, onThumbnailClick }) => {
  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        No recent generations found in this browser session.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto whitespace-nowrap py-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
      <div className="inline-flex space-x-3">
        {imageUrls.map((url, index) => (
          <div
            key={`${url}-${index}`} // Combine URL and index for a more stable key if URLs aren't unique
            className="flex-shrink-0 w-24 h-24 rounded border border-gray-300 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onThumbnailClick(url)}
          >
            <img
              src={url}
              alt={`Generated image ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy" // Lazy load gallery images
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Gallery;