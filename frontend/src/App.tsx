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
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null); // State for the prompt

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
      {/* Use more columns for finer control, adjust gap */}
      <main className="flex-grow container mx-auto p-4 grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Settings Panel (Left Column - takes 3/12) */}
        <section className="md:col-span-3 bg-white p-4 rounded shadow flex flex-col space-y-4">
          <h2 className="text-xl font-semibold mb-2 border-b pb-2">Settings</h2>
          {/* Keep ImageUploader here for input, but its preview won't be the main display */}
          <ImageUploader onImageUpload={handleImageUpload} />
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

        {/* Comparison Area (Center/Right Columns - takes 9/12) */}
        <section className="md:col-span-9 bg-white p-4 rounded shadow flex flex-col">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2 w-full">Comparison</h2>
            {/* Grid for side-by-side images */}
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 relative min-h-[300px] md:min-h-[400px] lg:min-h-[500px]">

              {/* Original Image Area */}
              <div className="border rounded p-2 flex flex-col items-center justify-center bg-gray-50">
                 <h3 className="text-lg font-medium text-gray-700 mb-2">Original</h3>
                 <div className="flex-grow w-full flex items-center justify-center overflow-hidden p-1">
                   {uploadedImageData ? (
                     <img src={uploadedImageData} alt="Original Upload" className="max-w-full max-h-full object-contain rounded shadow-sm"/>
                   ) : (
                     <p className="text-gray-400 text-center px-4">Upload an image using the panel on the left.</p>
                   )}
                 </div>
              </div>

              {/* Generated Image Area & Prompt */}
              <div className="border rounded p-2 flex flex-col items-center justify-start bg-gray-50 relative">
                 <h3 className="text-lg font-medium text-gray-700 mb-2">Generated</h3>
                 {/* Image container */}
                 <div className="relative w-full flex-grow flex items-center justify-center overflow-hidden p-1 min-h-[250px]">
                    <LoadingIndicator isActive={isLoading} /> {/* Overlay */}
                    <ImageViewer imageUrl={generatedImageRelativePath ? `${API_BASE_URL}${generatedImageRelativePath}` : null} isLoading={isLoading} />
                 </div>
                 {/* Prompt Display Area - Conditionally render below image */}
                 {generatedPrompt && !isLoading && generatedImageRelativePath && (
                    <div className="w-full mt-3 pt-3 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-600 mb-1 px-1">Prompt Used:</h4>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto whitespace-pre-wrap break-words font-mono">
                            {generatedPrompt}
                        </pre>
                    </div>
                 )}
                 {!generatedPrompt && !isLoading && !generatedImageRelativePath && !uploadedImageData && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-gray-400 text-center px-4">Generated image and prompt will appear here.</p>
                    </div>
                 )}
              </div>
            </div>
             {/* Error Message below the comparison area */}
            <div className="mt-4">
                <ErrorMessage message={errorMessage} onDismiss={handleDismissError} />
            </div>
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
