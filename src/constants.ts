/**
 * Application-wide constants
 */

// --- API ---
// Ensure VITE_API_BASE_URL is set in your .env file for development
// and provided during the build process for production.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'; // Fallback only for safety, should be set via env

// --- Gallery ---
export const GALLERY_STORAGE_KEY = 'aiFashionGallery_v1';
export const MAX_GALLERY_ITEMS = 20; // As per PRD

// --- Upload ---
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const ACCEPTED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
export const ACCEPTED_IMAGE_FORMATS_STRING = ACCEPTED_IMAGE_FORMATS.join(',');