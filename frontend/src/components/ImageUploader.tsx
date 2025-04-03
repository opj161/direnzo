import React, { useState, useCallback } from 'react';
// Consider using a library like react-dropzone for easier implementation
// import { useDropzone } from 'react-dropzone';

interface ImageUploaderProps {
  onImageUpload: (imageData: string | null) => void; // Callback to pass base64 data to parent
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false); // For visual feedback

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset input value to allow uploading the same file again
    event.target.value = '';
  };

  const processFile = (file: File) => {
    setError(null); // Clear previous errors
    setPreviewUrl(null); // Clear previous preview
    onImageUpload(null); // Clear image data in parent

    // Validate file type
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      setError(`Invalid file format. Please upload ${ACCEPTED_FORMATS.map(f => f.split('/')[1]).join(', ')}.`);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    // Read file as Data URL (base64) for preview and sending to backend
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreviewUrl(base64String);
      onImageUpload(base64String); // Pass base64 data up
      setError(null); // Clear error on success
    };
    reader.onerror = () => {
      setError('Failed to read file.');
      onImageUpload(null);
    };
    reader.readAsDataURL(file);
  };

  // --- Drag and Drop Handlers (Basic Implementation) ---
  // For a robust solution, consider react-dropzone
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]); // Include processFile in dependency array

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Upload Clothing Image
      </label>
      <div
        className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer
                    ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                    transition-colors duration-200 ease-in-out`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileInput')?.click()} // Trigger hidden input click
      >
        <input
          id="fileInput"
          type="file"
          accept={ACCEPTED_FORMATS.join(',')}
          onChange={handleFileChange}
          className="hidden" // Hide the default input
        />
        {previewUrl ? (
          <img src={previewUrl} alt="Preview" className="max-h-40 mx-auto mb-2 rounded" />
        ) : (
          <p className="text-gray-500">
            {isDragging ? 'Drop image here' : 'Drag & drop or click to upload'}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          {ACCEPTED_FORMATS.map(f => f.split('/')[1].toUpperCase()).join(', ')} up to {MAX_FILE_SIZE_MB}MB
        </p>
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default ImageUploader;