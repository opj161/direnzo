import { useState, useCallback, useEffect } from 'react';

// Import Components
import ImageUploader from './components/ImageUploader';
import ModelSettings, { ModelSettingsState } from './components/ModelSettings';
import EnvironmentSettings, { EnvironmentSettingsState } from './components/EnvironmentSettings';
import GenerationButton from './components/GenerationButton';
import ImageViewer from './components/ImageViewer';
import Gallery from './components/Gallery';
import LoadingIndicator from './components/LoadingIndicator';
import ErrorMessage from './components/ErrorMessage';
import { generateImage } from './services/api';

// Get the backend URL from environment variables (Vite specific)
// Fallback to localhost for local development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// LocalStorage key
const GALLERY_STORAGE_KEY = 'aiFashionGallery_v1';
const MAX_GALLERY_ITEMS = 20; // As per PRD

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
    setErrorMessage(null); // Clear error on new upload
    // Optionally clear generated image view if a new image is uploaded
     setGeneratedImageRelativePath(null);
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

    const payload = {
      settings: { modelSettings, environmentSettings },
      imageData: uploadedImageData,
    };

    console.log("Sending payload to backend:", payload);

    // --- API Interaction (Item 3.97) ---
    try {
      // Call the actual API service - it returns the relative path
      const imageRelativePath = await generateImage(payload);
      console.log("API Success. Image Relative Path:", imageRelativePath);
      setGeneratedImageRelativePath(imageRelativePath); // Store the relative path

      // --- Update Gallery & localStorage (Item 3.101-3.104) ---
      // --- Update Gallery & localStorage (Item 3.101-3.104) ---
      // Store relative paths in state and localStorage
      setGalleryImageRelativePaths(prevPaths => {
        const newPaths = [imageRelativePath, ...prevPaths].slice(0, MAX_GALLERY_ITEMS); // Add relative path
        try {
          localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(newPaths)); // Save relative paths
        } catch (storageError) {
          console.error("Failed to save gallery to localStorage:", storageError);
          // Display a non-blocking error message if localStorage fails
          setErrorMessage("Generated image displayed, but failed to save to local gallery.");
        }
        return newPaths; // Fix: Use the correct variable name
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
    } catch (e) {
        console.error("Invalid URL clicked in gallery:", url, e);
        setErrorMessage("Could not display the selected gallery image.");
        setGeneratedImageRelativePath(null);
    }
    setErrorMessage(null); // Clear any previous errors
  }, []);

  const handleDismissError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  // Determine if generate button should be disabled
  const isGenerateDisabled = !uploadedImageData || isLoading;
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col">
      {/* Header (Optional) */}
      <header className="bg-white shadow-md p-4">
        <h1 className="text-2xl font-bold text-center text-blue-600">
          AI Fashion Image Generator (V1)
        </h1>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow container mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Settings Panel (Left Column) */}
        <section className="md:col-span-1 bg-white p-4 rounded shadow flex flex-col space-y-4">
          <h2 className="text-xl font-semibold mb-2 border-b pb-2">Settings</h2>
          <ImageUploader onImageUpload={handleImageUpload} />
          {/* Conditionally render settings once callbacks are ready */}
          {handleModelSettingsChange && <ModelSettings onChange={handleModelSettingsChange} />}
          {handleEnvironmentSettingsChange && <EnvironmentSettings onChange={handleEnvironmentSettingsChange} />}
          <div className="mt-auto pt-4"> {/* Push button to bottom */}
            <GenerationButton
                onClick={handleGenerateClick}
                isLoading={isLoading}
                isDisabled={isGenerateDisabled}
            />
          </div>
        </section>

        {/* Main Image Display (Center Column) */}
        <section className="md:col-span-2 bg-white p-4 rounded shadow flex flex-col relative"> {/* Added relative positioning for LoadingIndicator */}
          <h2 className="text-xl font-semibold mb-4 border-b pb-2 w-full">Generated Image</h2>
          <div className="flex-grow flex items-center justify-center text-gray-500 relative min-h-[300px] md:min-h-[400px] lg:min-h-[500px]">
             {/* Loading Indicator overlays the image viewer area */}
            <LoadingIndicator isActive={isLoading} />
            {/* Construct full URL for ImageViewer */}
            <ImageViewer imageUrl={generatedImageRelativePath ? `${API_BASE_URL}${generatedImageRelativePath}` : null} isLoading={isLoading} />
          </div>
           {/* Error Message below the image viewer */}
          <ErrorMessage message={errorMessage} onDismiss={handleDismissError} />
        </section>

      </main>

      {/* Gallery Section (Below Main Content) */}
      <section className="container mx-auto p-4 mt-4 bg-white rounded shadow">
         <h2 className="text-xl font-semibold mb-2 border-b pb-2">Recent Generations</h2>
         {/* Construct full URLs for Gallery thumbnails */}
         <Gallery
            imageUrls={galleryImageRelativePaths.map(relPath => `${API_BASE_URL}${relPath}`)}
            onThumbnailClick={handleThumbnailClick}
         />
      </section>

      {/* Footer (Optional) */}
      <footer className="text-center p-4 mt-4 text-sm text-gray-500">
        Fashion AI V1
      </footer>
    </div>
  );
}

export default App;
