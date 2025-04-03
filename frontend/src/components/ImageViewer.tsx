import React from 'react';

interface ImageViewerProps {
  imageUrl: string | null; // URL of the image to display
  isLoading: boolean; // To potentially show a different state while loading the *display*
}

const ImageViewer: React.FC<ImageViewerProps> = ({ imageUrl, isLoading }) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded min-h-[300px] md:min-h-[400px] lg:min-h-[500px] overflow-hidden">
      {isLoading && !imageUrl && (
         // This state is tricky - usually covered by the main loading indicator.
         // We might just show the placeholder until the image URL is ready.
         <p className="text-gray-500">Loading image...</p>
      )}
      {!isLoading && imageUrl && (
        <img
          src={imageUrl}
          alt="Generated Fashion"
          className="max-w-full max-h-full object-contain" // Ensure image fits within bounds
        />
      )}
      {!isLoading && !imageUrl && (
        <p className="text-gray-500 text-center px-4">
          Upload an image and configure settings to generate a new fashion visual.
        </p>
      )}
    </div>
  );
};

export default ImageViewer;