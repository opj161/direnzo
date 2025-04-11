import React from 'react';

interface ImageViewerProps {
  imageUrl: string | null; // URL of the image to display
  isLoading: boolean; // To potentially show a different state while loading the *display*
}

const ImageViewer: React.FC<ImageViewerProps> = ({ imageUrl, isLoading }) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-gray-800 rounded min-h-[300px] md:min-h-[400px] lg:min-h-[500px] overflow-hidden transition-colors duration-200">
      {isLoading && !imageUrl && (
         <p className="text-gray-500 dark:text-gray-400 animate-pulse transition-colors duration-200">
           Loading image...
         </p>
      )}
      {!isLoading && imageUrl && (
        <img
          src={imageUrl}
          alt="Generated Fashion"
          className="max-w-full max-h-full object-contain animate-fade-in"
        />
      )}
      {!isLoading && !imageUrl && (
        <p className="text-gray-500 dark:text-gray-400 text-center px-4 transition-colors duration-200">
          Upload an image and configure settings to generate a new fashion visual.
        </p>
      )}
    </div>
  );
};

export default ImageViewer;