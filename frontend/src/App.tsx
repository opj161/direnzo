import { useState, useCallback, useEffect } from 'react';

// Import Components
import ModelSettings, { ModelSettingsState } from './components/ModelSettings';
import EnvironmentSettings, { EnvironmentSettingsState } from './components/EnvironmentSettings';
import GenerationButton from './components/GenerationButton';
import ImageViewer from './components/ImageViewer';
import Gallery from './components/Gallery';
import LoadingIndicator from './components/LoadingIndicator';
import ErrorMessage from './components/ErrorMessage';
import ThemeToggle from './components/ThemeToggle';
import { generateImage } from './services/api';
import { initializeTheme } from './utils/themeUtils';

// Get the backend URL from environment variables (Vite specific)
// Fallback to localhost for local development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// LocalStorage key
const GALLERY_STORAGE_KEY = 'aiFashionGallery_v1';
const MAX_GALLERY_ITEMS = 20; // As per PRD

// --- Upload Constants ---
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_FORMATS_STRING = ACCEPTED_FORMATS.join(',');

function App() {
  // --- State Management ---
  const [uploadedImageData, setUploadedImageData] = useState<string | null>(null);
  const [modelSettings, setModelSettings] = useState<ModelSettingsState | null>(null); // Initialize later
  const [environmentSettings, setEnvironmentSettings] = useState<EnvironmentSettingsState | null>(null); // Initialize later
  // State stores the *relative* path from the backend or localStorage
  const [generatedImageRelativePath, setGeneratedImageRelativePath] = useState<string | null>(null);
  // State stores the list of *relative* paths from localStorage
  const [galleryImageRelativePaths, setGalleryImageRelativePaths] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null); // State for the prompt
  // --- Upload State (moved from ImageUploader) ---
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // --- Responsive UI State ---
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState<boolean>(false);

  // Initialize theme on component mount
  useEffect(() => {
    initializeTheme();
  }, []);

  // --- Load Gallery from localStorage on initial mount ---
  useEffect(() => {
    try {
      const storedGallery = localStorage.getItem(GALLERY_STORAGE_KEY);
      if (storedGallery) {
        const parsedUrls: string[] = JSON.parse(storedGallery);
        // Basic validation if needed (e.g., check if it's an array of strings)
        // Ensure stored data is an array of strings (relative paths)
        if (Array.isArray(parsedUrls) && parsedUrls.every(item => typeof item === 'string' && item.startsWith('/'))) {
             setGalleryImageRelativePaths(parsedUrls);
             // Optionally display the latest image from the gallery on load
             if (parsedUrls.length > 0) {
                setGeneratedImageRelativePath(parsedUrls[0]); // Set the relative path
             }
        } else {
            console.warn("Invalid gallery data found in localStorage. Resetting.");
            localStorage.removeItem(GALLERY_STORAGE_KEY);
        }
      }
    } catch (error) {
        console.error("Failed to load gallery from localStorage:", error);
        // Optionally clear corrupted data
        localStorage.removeItem(GALLERY_STORAGE_KEY);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- Callback Handlers ---
  const handleImageUpload = useCallback((imageData: string | null) => {
    setUploadedImageData(imageData);
    setErrorMessage(null); // Clear generation error on new upload
    setUploadError(null); // Clear upload error on new upload
    // Clear generated image view and prompt if a new image is uploaded
    setGeneratedImageRelativePath(null);
    setGeneratedPrompt(null);
  }, []);

  const handleModelSettingsChange = useCallback((settings: ModelSettingsState) => {
    setModelSettings(settings);
  }, []);

  const handleEnvironmentSettingsChange = useCallback((settings: EnvironmentSettingsState) => {
    setEnvironmentSettings(settings);
  }, []);

  const handleGenerateClick = useCallback(async () => {
    if (!uploadedImageData || !modelSettings || !environmentSettings) {
      setErrorMessage('Please upload an image and ensure all settings are selected.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setGeneratedImageRelativePath(null); // Clear previous image while generating
    setGeneratedPrompt(null); // Clear previous prompt

    const payload = {
      settings: { modelSettings, environmentSettings },
      imageData: uploadedImageData,
    };

    console.log("Sending payload to backend:", payload);

    // --- API Interaction (Item 3.97) ---
    try {
      // Call the API service - it now returns an object { imageUrl, promptUsed }
      const { imageUrl: imageRelativePath, promptUsed } = await generateImage(payload);
      console.log("API Success. Image Relative Path:", imageRelativePath);
      console.log("API Success. Prompt Used:", promptUsed); // Log the received prompt
      setGeneratedImageRelativePath(imageRelativePath); // Store the relative path
      setGeneratedPrompt(promptUsed); // Store the prompt

      // --- Update Gallery & localStorage ---
      // Store relative paths in state and localStorage
      setGalleryImageRelativePaths(prevPaths => {
        const newPaths = [imageRelativePath, ...prevPaths].slice(0, MAX_GALLERY_ITEMS); // Add relative path
        try {
          localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(newPaths)); // Save relative paths
        } catch (storageError) {
          console.error("Failed to save gallery to localStorage:", storageError);
          setErrorMessage("Generated image displayed, but failed to save to local gallery.");
        }
        return newPaths;
      });

    } catch (error) {
      console.error("Generation API Error:", error);
      // Set the error message from the caught error
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('An unknown error occurred during image generation.');
      }
    } finally {
      setIsLoading(false);
    }

  }, [uploadedImageData, modelSettings, environmentSettings]); // Dependencies for the generation logic

  const handleThumbnailClick = useCallback((url: string) => {
    // url here is the full URL constructed by the Gallery component mapping
    // We need to extract the relative path to set the state correctly
    try {
        const urlObject = new URL(url);
        const relativePath = urlObject.pathname; // Extracts path like /images/uuid.jpg
        setGeneratedImageRelativePath(relativePath); // Set the relative path state
        setGeneratedPrompt(null); // Clear prompt when selecting from gallery (it wasn't saved with gallery items)
    } catch (e) {
        console.error("Invalid URL clicked in gallery:", url, e);
        setErrorMessage("Could not display the selected gallery image.");
        setGeneratedImageRelativePath(null);
        setGeneratedPrompt(null);
    }
    setErrorMessage(null); // Clear any previous errors
  }, []);

  const handleDismissError = useCallback(() => {
    setErrorMessage(null);
    setUploadError(null); // Also clear upload error
  }, []);

  const toggleSettingsPanel = useCallback(() => {
    setIsSettingsPanelOpen(prev => !prev);
  }, []);

  const handleClearGallery = useCallback(() => {
    // Clear gallery from state and localStorage
    setGalleryImageRelativePaths([]);
    localStorage.removeItem(GALLERY_STORAGE_KEY);
  }, []);

  // --- Upload Logic (moved from ImageUploader) ---
  const processFile = useCallback((file: File | null) => {
    setUploadError(null); // Clear previous errors

    if (!file) {
        handleImageUpload(null); // Clear image data in parent if file is null
        return;
    }

    // Validate file type
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      setUploadError(`Invalid format. Use ${ACCEPTED_FORMATS.map(f => f.split('/')[1]).join(', ')}.`);
      handleImageUpload(null);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(`File too large. Max ${MAX_FILE_SIZE_MB}MB.`);
      handleImageUpload(null);
      return;
    }

    // Read file as Data URL
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      handleImageUpload(base64String); // Pass base64 data up
      setUploadError(null); // Clear error on success
    };
    reader.onerror = () => {
      setUploadError('Failed to read file.');
      handleImageUpload(null);
    };
    reader.readAsDataURL(file);
  }, [handleImageUpload]); // Include handleImageUpload dependency

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
    processFile(null); // This calls handleImageUpload(null) and clears errors
    // No need to clear generated image/prompt here, handleImageUpload already does it
    // Ensure the hidden file input is cleared if needed, though processFile(null) should suffice
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = '';
    }
  }, [processFile]);
  // --- End Upload Logic ---

  // Determine if generate button should be disabled
  const isGenerateDisabled = !uploadedImageData || isLoading;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md p-4 sticky top-0 z-10 transition-colors duration-200">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400 transition-colors duration-200">
            AI Fashion Image Generator
          </h1>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow p-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-6"> {/* Removed container mx-auto, added padding */}

        {/* Settings Panel (Left Column - takes 3/12) */}
        <section className="md:col-span-3 lg:max-w-sm bg-white dark:bg-gray-800 p-4 rounded shadow flex flex-col space-y-4 self-start md:sticky top-[calc(4rem+1rem)] transition-colors duration-200">
          <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
            <h2 className="text-xl font-semibold">Settings</h2>
            {/* Mobile toggle button */}
            <button
              className="md:hidden text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              onClick={toggleSettingsPanel}
              aria-expanded={isSettingsPanelOpen}
              aria-controls="settings-panel"
            >
              {isSettingsPanelOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
          </div>

          {/* Settings content - collapsible on mobile */}
          <div id="settings-panel" className={`${isSettingsPanelOpen ? 'block' : 'hidden md:block'} space-y-4 animate-fade-in`}>
            {handleModelSettingsChange && <ModelSettings onChange={handleModelSettingsChange} />}
            {handleEnvironmentSettingsChange && <EnvironmentSettings onChange={handleEnvironmentSettingsChange} />}
            <div className="mt-auto pt-4"> {/* Push button to bottom */}
              <GenerationButton
                  onClick={handleGenerateClick}
                  isLoading={isLoading}
                  isDisabled={isGenerateDisabled}
              />
            </div>
          </div>
        </section>

        {/* Comparison Area (Center/Right Columns - takes 9/12) */}
        <section className="md:col-span-9 bg-white dark:bg-gray-800 p-4 rounded shadow flex flex-col transition-colors duration-200">
            <h2 className="text-xl font-semibold mb-3 border-b border-gray-200 dark:border-gray-700 pb-2 w-full">Comparison</h2>
            {/* Grid for side-by-side images */}
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-4 relative min-h-[400px] lg:min-h-[500px]"> {/* Changed md: to lg: for better tablet experience */}

              {/* Original Image Area (Now includes Upload) */}
              <div className="border border-gray-200 dark:border-gray-700 rounded p-4 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 relative group min-h-[300px] sm:min-h-[350px] md:min-h-[400px] lg:min-h-[500px] transition-colors duration-200">
                 <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 w-full text-center transition-colors duration-200">Original</h3>
                 {/* Hidden File Input */}
                 <input
                    id="fileInput"
                    type="file"
                    accept={ACCEPTED_FORMATS_STRING}
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
                        <p className="text-xs mt-1">({ACCEPTED_FORMATS.map(f => f.split('/')[1].toUpperCase()).join(', ')} up to {MAX_FILE_SIZE_MB}MB)</p>
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
                 {/* Upload Error Display - Positioned at the bottom */}
                 {uploadError && (
                    <div className="absolute bottom-2 left-2 right-2 p-1 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded text-center transition-colors duration-200">
                        {uploadError}
                    </div>
                  )}
              </div>

              {/* Generated Image Area & Prompt */}
              <div className="border border-gray-200 dark:border-gray-700 rounded p-4 flex flex-col items-center justify-start bg-gray-50 dark:bg-gray-800 relative h-full transition-colors duration-200">
                 <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 w-full text-center transition-colors duration-200">Generated</h3>
                 {/* Image container */}
                 <div className="relative w-full flex-grow flex items-center justify-center overflow-hidden p-1">
                    <LoadingIndicator isActive={isLoading} /> {/* Overlay */}
                    {/* ImageViewer handles its own placeholder */}
                    <ImageViewer imageUrl={generatedImageRelativePath ? `${API_BASE_URL}${generatedImageRelativePath}` : null} isLoading={isLoading} />
                 </div>
                 {/* Prompt Display Area - Conditionally render below image */}
                 {generatedPrompt && !isLoading && generatedImageRelativePath && (
                    <div className="w-full mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 transition-colors duration-200">
                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1 px-1 transition-colors duration-200">Prompt Used:</h4>
                        <pre className="text-xs bg-white dark:bg-gray-900 p-2 rounded overflow-x-auto whitespace-pre-wrap break-words font-mono border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-300 transition-colors duration-200">
                            {generatedPrompt}
                        </pre>
                    </div>
                 )}
                 {/* Placeholder logic is now handled entirely by ImageViewer */}
              </div>
            </div>
             {/* Generation Error Message below the comparison area */}
            <div className="mt-4">
                <ErrorMessage message={errorMessage} onDismiss={handleDismissError} />
            </div>
          </section>

      </main>

      {/* Gallery Section */}
      <section className="p-4 sm:px-6 lg:px-8 mt-4 bg-white dark:bg-gray-800 rounded shadow transition-colors duration-200">
         <h2 className="text-xl font-semibold mb-3 border-b border-gray-200 dark:border-gray-700 pb-2 transition-colors duration-200">Recent Generations</h2>
         <Gallery
            imageUrls={galleryImageRelativePaths.map(relPath => `${API_BASE_URL}${relPath}`)}
            onThumbnailClick={handleThumbnailClick}
            onClearGallery={handleClearGallery}
         />
      </section>

      {/* Footer */}
      <footer className="text-center p-4 sm:px-6 lg:px-8 mt-4 text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200">
        Fashion AI V1
      </footer>
    </div>
  );
}

export default App;
