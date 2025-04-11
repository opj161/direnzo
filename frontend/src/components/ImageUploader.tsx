import React, { useState, useCallback } from 'react';
import {
    MAX_FILE_SIZE_MB,
    MAX_FILE_SIZE_BYTES,
    ACCEPTED_IMAGE_FORMATS,
    ACCEPTED_IMAGE_FORMATS_STRING
} from '../constants'; // Assuming this path works at build time

interface ImageUploaderProps {
  uploadedImageData: string | null; // Receive uploaded image data to display
  onImageUpload: (imageData: string | null) => void;
  onError: (error: string | null) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ uploadedImageData, onImageUpload, onError }) => {
  const [isDragging, setIsDragging] = useState(false);
  // Use the onError prop directly for external reporting, keep internal for display if needed
  // const [uploadErrorInternal, setUploadErrorInternal] = useState<string | null>(null);

  // --- Upload Logic (Moved from App.tsx) ---
  const processFile = useCallback((file: File | null) => {
    onError(null); // Clear previous errors via prop

    if (!file) {
        onImageUpload(null); // Clear image data in parent if file is null
        return;
    }

    // Validate file type
    if (!ACCEPTED_IMAGE_FORMATS.includes(file.type)) {
      onError(`Invalid format. Use ${ACCEPTED_IMAGE_FORMATS.map((f: string) => f.split('/')[1]).join(', ')}.`);
      onImageUpload(null);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      onError(`File too large. Max ${MAX_FILE_SIZE_MB}MB.`);
      onImageUpload(null);
      return;
    }

    // Read file as Data URL
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      onImageUpload(base64String); // Pass base64 data up
      onError(null); // Clear error on success via prop
    };
    reader.onerror = () => {
      onError('Failed to read file.');
      onImageUpload(null);
    };
    reader.readAsDataURL(file);
  }, [onImageUpload, onError]); // Include dependencies

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    processFile(file || null);
    // Reset input value to allow uploading the same file again
    event.target.value = '';
  }, [processFile]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    // Only set dragging to false if leaving the actual drop zone, not its children
    if (event.currentTarget.contains(event.relatedTarget as Node)) {
        return;
    }
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    processFile(file || null);
  }, [processFile]);

  const handleClearUpload = useCallback(() => {
    processFile(null); // This calls onImageUpload(null) and onError(null)
    // Ensure the hidden file input is cleared if needed
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = '';
    }
  }, [processFile]);
  // --- End Upload Logic ---

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded p-4 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 relative group min-h-[300px] sm:min-h-[350px] md:min-h-[400px] lg:min-h-[500px] transition-colors duration-200">
       <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 w-full text-center transition-colors duration-200">Original</h3>
       {/* Hidden File Input */}
       <input
          id="fileInput"
          type="file"
          accept={ACCEPTED_IMAGE_FORMATS_STRING}
          onChange={handleFileChange}
          className="hidden"
       />
       {/* Drop Zone / Display Area - Takes full space */}
       <div
          className={`absolute inset-0 flex items-center justify-center overflow-hidden p-1 rounded-md cursor-pointer border-2 border-dashed flex-grow
                      ${isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'}
                      ${uploadedImageData ? 'border-transparent hover:border-gray-400 dark:hover:border-gray-500' : ''}
                      transition-all duration-200 ease-in-out`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploadedImageData && document.getElementById('fileInput')?.click()} // Only allow click to upload if no image
       >
         {uploadedImageData ? (
           <img src={uploadedImageData} alt="Original Upload" className="max-w-full max-h-full object-contain rounded shadow-sm"/>
         ) : (
           <div className="text-center text-gray-500 dark:text-gray-400 p-4 transition-colors duration-200">
              {/* Upload Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-2 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <p className="font-semibold">{isDragging ? 'Drop image here' : 'Click or drag & drop image'}</p>
              <p className="text-xs mt-1">({ACCEPTED_IMAGE_FORMATS.map((f: string) => f.split('/')[1].toUpperCase()).join(', ')} up to {MAX_FILE_SIZE_MB}MB)</p>
           </div>
         )}
       </div>
       {/* Clear/Replace Button - More prominent, centered on hover */}
       {uploadedImageData && (
          <button
              onClick={handleClearUpload}
              className="absolute top-2 right-2 z-10 p-1.5 bg-black dark:bg-white bg-opacity-30 dark:bg-opacity-20 hover:bg-opacity-50 dark:hover:bg-opacity-30 text-white dark:text-gray-200 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              aria-label="Clear uploaded image"
          >
               {/* Using a smaller trash icon */}
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
               </svg>
          </button>
       )}
       {/* Upload Error Display - Positioned at the bottom - TODO: Decide if this should use internal state or prop */}
       {/* {uploadErrorInternal && (
          <div className="absolute bottom-2 left-2 right-2 p-1 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded text-center transition-colors duration-200">
              {uploadErrorInternal}
          </div>
        )} */}
    </div>
  );
};

export default ImageUploader;