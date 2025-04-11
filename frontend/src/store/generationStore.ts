import { create } from 'zustand';

interface GenerationState {
  // Input
  uploadedImageData: string | null;
  setUploadedImageData: (data: string | null) => void;

  // Output
  generatedImageRelativePath: string | null;
  setGeneratedImageRelativePath: (path: string | null) => void;
  generatedPrompt: string | null;
  setGeneratedPrompt: (prompt: string | null) => void;

  // Status & Errors
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  errorMessage: string | null; // Error from generation API
  setErrorMessage: (message: string | null) => void;
  uploadError: string | null; // Error from ImageUploader component
  setUploadError: (error: string | null) => void;

  // Combined action to clear generation-related state
  clearGenerationState: () => void;
}

const useGenerationStore = create<GenerationState>((set) => ({
  // Initial State
  uploadedImageData: null,
  generatedImageRelativePath: null,
  generatedPrompt: null,
  isLoading: false,
  errorMessage: null,
  uploadError: null,

  // Actions
  setUploadedImageData: (data) => set({ uploadedImageData: data }),
  setGeneratedImageRelativePath: (path) => set({ generatedImageRelativePath: path }),
  setGeneratedPrompt: (prompt) => set({ generatedPrompt: prompt }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setErrorMessage: (message) => set({ errorMessage: message }),
  setUploadError: (error) => set({ uploadError: error }),

  // Combined clear action
  clearGenerationState: () => set({
    generatedImageRelativePath: null,
    generatedPrompt: null,
    isLoading: false,
    errorMessage: null,
    // Keep uploadedImageData and uploadError separate as they relate to input
  }),
}));

export default useGenerationStore;