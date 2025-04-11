import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GALLERY_STORAGE_KEY, MAX_GALLERY_ITEMS } from '../constants'; // Trying relative path from src

// Define the structure for each gallery item
export interface GalleryItem {
  relativePath: string;
  timestamp: number; // Store timestamp for sorting or display
}

interface GalleryState {
  galleryItems: GalleryItem[]; // Changed state name and type
  addImage: (relativePath: string) => void;
  clearGallery: () => void;
  deleteImage: (relativePath: string) => void; // Action to delete an image
}

const useGalleryStore = create<GalleryState>()(
  persist(
    (set, get) => ({
      galleryItems: [], // Initial state

      addImage: (relativePath: string) => {
        const currentItems = get().galleryItems;
        // Prevent duplicates based on relativePath (optional)
        // if (currentItems.some(item => item.relativePath === relativePath)) {
        //   return;
        // }
        const newItem: GalleryItem = {
          relativePath: relativePath,
          timestamp: Date.now(), // Add timestamp when adding
        };
        const newItems = [newItem, ...currentItems].slice(0, MAX_GALLERY_ITEMS);
        set({ galleryItems: newItems });
      },

      clearGallery: () => set({ galleryItems: [] }),

      deleteImage: (relativePath: string) => {
        set((state) => ({
          galleryItems: state.galleryItems.filter(item => item.relativePath !== relativePath)
        }));
      },
    }),
    {
      name: GALLERY_STORAGE_KEY, // Use constant for localStorage key
      // By default, persist middleware saves the entire state.
      // We only need galleryImageRelativePaths here.
      partialize: (state) => ({ galleryItems: state.galleryItems }), // Persist galleryItems
    }
  )
);

export default useGalleryStore;