import { useCallback, useEffect, useState } from 'react';

// Import Components
import ModelSettings from './components/ModelSettings'; // Removed unused ModelSettingsState import
import EnvironmentSettings from './components/EnvironmentSettings'; // Removed unused EnvironmentSettingsState import
import GenerationButton from './components/GenerationButton';
import ImageViewer from './components/ImageViewer';
import Gallery from './components/Gallery';
import LoadingIndicator from './components/LoadingIndicator';
import ErrorMessage from './components/ErrorMessage';
import ThemeToggle from './components/ThemeToggle';
import ImageUploader from './components/ImageUploader';
import { generateImage } from './services/api';
import { initializeTheme } from './utils/themeUtils';
import useSettingsStore from './store/settingsStore'; // Import stores
import useGenerationStore from './store/generationStore';
import useGalleryStore from './store/galleryStore';
import IconContentCopy from '@material-design-icons/svg/filled/content_copy.svg'; // Import copy icon
import {
  API_BASE_URL,
  // GALLERY_STORAGE_KEY and MAX_GALLERY_ITEMS are now used within galleryStore
} from './constants';

function App() {
  // --- State from Stores ---
  const { modelSettings, environmentSettings } = useSettingsStore(state => ({
    modelSettings: state.modelSettings,
    environmentSettings: state.environmentSettings,
  }));
  const {
    uploadedImageData,
    generatedImageRelativePath,
    generatedPrompt,
    isLoading,
    errorMessage,
    // uploadError, // Removed as it's handled within ImageUploader
    setUploadedImageData,
    setGeneratedImageRelativePath,
    setGeneratedPrompt,
    setIsLoading,
    setErrorMessage,
    setUploadError, // Keep setUploadError as it's passed to ImageUploader
    clearGenerationState,
  } = useGenerationStore();
  const { galleryItems, addImage, clearGallery } = useGalleryStore(); // Use galleryItems instead

  // --- Local UI State ---
  // Upload error state is managed by generationStore now
  // isDragging state is managed within ImageUploader
  // --- Responsive UI State ---
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState<boolean>(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle'); // State for copy feedback

  // Initialize theme on component mount
  useEffect(() => {
    initializeTheme();
  }, []);

  // Gallery loading is handled by persist middleware in galleryStore
  // Effect to potentially load the latest gallery image into the viewer on initial load
  useEffect(() => {
    // Zustand ensures stores are hydrated before effects run
    // Update to use galleryItems
    if (galleryItems.length > 0 && !generatedImageRelativePath) {
      setGeneratedImageRelativePath(galleryItems[0].relativePath); // Get path from first item
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount after hydration

  // --- Callback Handlers ---
  // Use actions from generationStore
  const handleImageUpload = useCallback((imageData: string | null) => {
    setUploadedImageData(imageData);
    setErrorMessage(null);
    setUploadError(null);
    // Clear previous generation output if new image is uploaded
    if (imageData) {
       clearGenerationState();
    }
  }, [setUploadedImageData, setErrorMessage, setUploadError, clearGenerationState]);

  // Settings components will interact directly with settingsStore, remove these handlers
  // const handleModelSettingsChange = ...
  // const handleEnvironmentSettingsChange = ...

  const handleGenerateClick = useCallback(async () => {
    // Access settings directly from the store
    if (!uploadedImageData || !modelSettings || !environmentSettings) {
      setErrorMessage('Please upload an image and ensure all settings are selected.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    // Clear previous generation state using action
    clearGenerationState();

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
      setGeneratedImageRelativePath(imageRelativePath); // Use store action
      setGeneratedPrompt(promptUsed); // Use store action

      // --- Update Gallery Store ---
      addImage(imageRelativePath); // Use gallery store action

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

  // Dependencies now include store actions and state values used in the check
  }, [
    uploadedImageData,
    modelSettings,
    environmentSettings,
    setIsLoading,
    setErrorMessage,
    setGeneratedImageRelativePath,
    setGeneratedPrompt,
    addImage,
    clearGenerationState
  ]);

  // Updated to accept relativePath directly from Gallery component
  // Use store actions
  const handleThumbnailClick = useCallback((relativePath: string) => {
    setGeneratedImageRelativePath(relativePath);
    setGeneratedPrompt(null);
    setErrorMessage(null);
  }, [setGeneratedImageRelativePath, setGeneratedPrompt, setErrorMessage]);

  // Use store actions
  const handleDismissError = useCallback(() => {
    setErrorMessage(null);
    setUploadError(null);
  }, [setErrorMessage, setUploadError]);

  const toggleSettingsPanel = useCallback(() => {
    setIsSettingsPanelOpen(prev => !prev);
  }, []);

  // Use store action (already includes clearing state)
  const handleClearGallery = useCallback(() => {
    clearGallery();
  }, [clearGallery]);

  // --- Upload Logic is now encapsulated in ImageUploader ---
  // The handleImageUpload callback is still needed to receive the data
  // The setUploadError callback is passed to ImageUploader to report errors

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
            {/* Remove onChange props, components will use store directly */}
            <ModelSettings />
            <EnvironmentSettings />
            <div className="mt-auto pt-4"> {/* Push button to bottom */}
              <GenerationButton
                  onClick={handleGenerateClick}
                  isLoading={isLoading} // Get from store
                  isDisabled={isGenerateDisabled} // Calculated from store state
              />
            </div>
          </div>
        </section>

        {/* Comparison Area (Center/Right Columns - takes 9/12) */}
        <section className="md:col-span-9 bg-white dark:bg-gray-800 p-4 rounded shadow flex flex-col transition-colors duration-200">
            <h2 className="text-xl font-semibold mb-3 border-b border-gray-200 dark:border-gray-700 pb-2 w-full">Comparison</h2>
            {/* Grid for side-by-side images */}
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 relative min-h-[400px] lg:min-h-[500px]"> {/* Changed lg: to md: for earlier breakpoint */}

              {/* Render the new ImageUploader component */}
              <ImageUploader
                uploadedImageData={uploadedImageData} // Get from store
                onImageUpload={handleImageUpload} // Use App's handler (calls store action)
                onError={setUploadError} // Use store action directly
              />
              {/* Display upload error reported by the uploader */}
              {/* Upload error display is now part of ImageUploader, but we still need the state for the generation error message below */}

              {/* Generated Image Area & Prompt */}
              <div className="border border-gray-200 dark:border-gray-700 rounded p-4 flex flex-col items-center justify-start bg-gray-50 dark:bg-gray-800 relative h-full transition-colors duration-200">
                 <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 w-full text-center transition-colors duration-200">Generated</h3>
                 {/* Image container */}
                 <div className="relative w-full flex-grow flex items-center justify-center overflow-hidden p-1">
                    <LoadingIndicator isActive={isLoading} /> {/* Get from store */}
                    {/* ImageViewer handles its own placeholder */}
                    {/* Pass state from store */}
                    <ImageViewer imageUrl={generatedImageRelativePath ? `${API_BASE_URL}${generatedImageRelativePath}` : null} isLoading={isLoading} />
                 </div>
                 {/* Prompt Display Area - Conditionally render below image */}
                 {/* Use state from store */}
                 {generatedPrompt && !isLoading && generatedImageRelativePath && (
                    <div className="w-full mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 transition-colors duration-200 relative group/prompt"> {/* Added relative positioning and group */}
                        <div className="flex justify-between items-center mb-1 px-1">
                            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors duration-200">Prompt Used:</h4>
                            <button
                                onClick={() => {
                                    if (generatedPrompt) {
                                        navigator.clipboard.writeText(generatedPrompt);
                                        setCopyStatus('copied');
                                        setTimeout(() => setCopyStatus('idle'), 1500); // Reset after 1.5s
                                    }
                                }}
                                className="p-1 rounded text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover/prompt:opacity-100 transition-all duration-150"
                                aria-label="Copy prompt"
                                title="Copy prompt"
                            >
                                {copyStatus === 'copied' ? (
                                    <span className="text-xs text-primary-600 dark:text-primary-400">Copied!</span>
                                ) : (
                                    <img src={IconContentCopy} alt="Copy" className="w-4 h-4" />
                                )}
                            </button>
                        </div>
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
                {/* Use state and action from store */}
                <ErrorMessage message={errorMessage} onDismiss={handleDismissError} />
            </div>
          </section>

      </main>

      {/* Gallery Section */}
      <section className="p-4 sm:px-6 lg:px-8 mt-4 bg-white dark:bg-gray-800 rounded shadow transition-colors duration-200">
         <h2 className="text-xl font-semibold mb-3 border-b border-gray-200 dark:border-gray-700 pb-2 transition-colors duration-200">Recent Generations</h2>
         <Gallery
            galleryItems={galleryItems} // Pass the full items array
            apiBaseUrl={API_BASE_URL} // Constant
            onThumbnailClick={handleThumbnailClick} // Use App's handler (calls store action)
            onClearGallery={handleClearGallery} // Use App's handler (calls store action)
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
