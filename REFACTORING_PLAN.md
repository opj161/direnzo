# Frontend Refactoring Plan

**Overall Goal:** Refactor the React frontend application to improve state management, component structure, maintainability, testability, and user experience based on the previous analysis.

**Guiding Principles:**

*   **Incremental Changes:** Break down refactoring into logical, smaller steps to reduce risk and allow for easier review.
*   **Maintain Functionality:** Ensure the application remains functional after each phase.
*   **Leverage Existing Stack:** Utilize React, TypeScript, Tailwind CSS, and Vite effectively.
*   **Simplicity:** Prefer simpler solutions where appropriate (e.g., choosing Zustand for state management initially due to lower boilerplate).

---

## Phase 1: Foundational Codebase Cleanup & Structure

*   **Objective:** Improve code organization and prepare for larger refactoring steps.
*   **Tasks:**
    1.  **Centralize Constants:**
        *   Create `src/constants.ts`. Move hardcoded values (`GALLERY_STORAGE_KEY`, `MAX_GALLERY_ITEMS`, `MAX_FILE_SIZE_MB`, `MAX_FILE_SIZE_BYTES`, `ACCEPTED_FORMATS`, `ACCEPTED_FORMATS_STRING`) from `App.tsx` to this new file. Export them.
        *   Update `App.tsx` to import and use these constants.
        *   Consolidate `API_BASE_URL` logic. Primarily rely on `import.meta.env.VITE_API_BASE_URL`. Remove the fallback logic from `App.tsx` and `api.ts`. Ensure a `.env` file or environment setup provides this variable during development and build. Update `api.ts` and `App.tsx` (for gallery URL construction) accordingly.
    2.  **Encapsulate Upload Logic:**
        *   Create a new component `src/components/ImageUploader.tsx`.
        *   Define props: `onImageUpload: (imageData: string | null) => void` and `onError: (error: string | null) => void`.
        *   Move upload state (`isDragging`, `uploadError`) and related handlers (`processFile`, `handleFileChange`, `handleDragOver`, `handleDragLeave`, `handleDrop`, `handleClearUpload`) from `App.tsx` into `ImageUploader.tsx`.
        *   Move the JSX related to the file input and drop zone from `App.tsx` into `ImageUploader.tsx`.
        *   Inside `ImageUploader.tsx`, call the `onImageUpload` and `onError` props when appropriate.
        *   In `App.tsx`, replace the original upload JSX with `<ImageUploader onImageUpload={handleImageUpload} onError={setUploadError} />`. Simplify the `handleImageUpload` callback in `App.tsx`.
    3.  **Streamline Gallery Data Flow:**
        *   Modify `Gallery.tsx` props: Change `imageUrls: string[]` to `imageRelativePaths: string[]` and add `apiBaseUrl: string`.
        *   Inside `Gallery.tsx`, construct the full image URL using `apiBaseUrl` and the relative path only when rendering the `<img>` tag's `src` attribute.
        *   Modify the `onThumbnailClick` prop in `Gallery.tsx` to accept the *relative path*: `onThumbnailClick: (relativePath: string) => void`. Update the component to pass the relative path when clicked.
        *   Update `App.tsx`: Pass `galleryImageRelativePaths` and the `API_BASE_URL` constant to `<Gallery />`. Update the `handleThumbnailClick` callback in `App.tsx` to directly receive and set the `generatedImageRelativePath` state.

---

## Phase 2: State Management Refactoring

*   **Objective:** Decouple state logic from `App.tsx`, reduce prop drilling, and make state management more scalable.
*   **Approach:** Introduce Zustand for its simplicity and minimal boilerplate.
*   **Tasks:**
    1.  **Install & Setup Zustand:**
        *   Run `npm install zustand`.
        *   Create a `src/store` directory.
    2.  **Create State Stores:**
        *   Create `src/store/settingsStore.ts`. Define state slices for `modelSettings` and `environmentSettings`, including initial states and actions to update them.
        *   Create `src/store/generationStore.ts`. Define state for `uploadedImageData`, `generatedImageRelativePath`, `generatedPrompt`, `isLoading`, `errorMessage`, `uploadError`. Include actions for setting/clearing these values.
        *   Create `src/store/galleryStore.ts`. Define state for `galleryImageRelativePaths`. Include actions for adding images (handling the max limit), clearing the gallery, and initializing/saving state to `localStorage` (using Zustand's `persist` middleware).
    3.  **Integrate Stores into Components:**
        *   Refactor `App.tsx`: Remove local state now managed by the stores. Use Zustand hooks to access state and actions. Connect component event handlers to call store actions.
        *   Refactor `ModelSettings.tsx` & `EnvironmentSettings.tsx`: Remove `onChange` prop. Use `useSettingsStore` hooks to directly read/update state.
        *   Refactor `Gallery.tsx`: Remove `onClearGallery` prop. Use `useGalleryStore` to get paths and call clear action. Keep `onThumbnailClick`.
        *   Refactor other components (`ImageViewer`, `GenerationButton`, etc.) to pull state directly from stores.
    4.  **Persist User Settings:**
        *   Apply Zustand's `persist` middleware to `settingsStore.ts` to save/rehydrate settings from `localStorage`.

---

## Phase 3: UI/UX Enhancements & Testing Foundation

*   **Objective:** Improve the user interface based on feedback and establish a testing baseline.
*   **Tasks:**
    1.  **Implement Visual Selector Icons (UI):**
        *   Source/create SVGs for Hair Style, Hair Color, Time of Day, Weather.
        *   Update `*_VISUAL_OPTIONS` arrays in settings components to include icons. Update `VisualOptionSelector.tsx` to render them.
    2.  **Improve Prompt Display (UI):**
        *   Add a "Copy" button next to the "Prompt Used" display.
        *   Implement copy-to-clipboard logic (`navigator.clipboard.writeText`).
    3.  **Gallery Improvements (UI & Code):**
        *   Modify `galleryStore.ts` to store `{ relativePath: string, timestamp: number }`.
        *   Add tooltips to gallery thumbnails showing the timestamp.
        *   Add 'X' buttons to thumbnails to delete individual images (with confirmation). Implement `deleteImage` action in `galleryStore.ts`.
    4.  **Settings Feedback Refinement (UI):**
        *   Review and adjust Tailwind classes for disabled states on background preset/custom inputs for better clarity.
    5.  **Mobile Layout Refinements (UI):**
        *   Change comparison grid breakpoint from `lg:grid-cols-2` to `md:grid-cols-2`. Test on tablet sizes.
    6.  **Establish Testing Foundation (Code):**
        *   Install `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@testing-library/user-event`.
        *   Configure Vitest.
        *   Write initial unit tests for utilities (`themeUtils.ts`, `constants.ts`) and API service (mocking).
        *   Write basic component tests for simple UI components.
    7.  **Accessibility Review (UI):**
        *   Audit using browser tools/extensions (axe DevTools).
        *   Check keyboard navigation, focus states, semantic HTML, ARIA usage, and color contrast. Fix identified issues.

---

## Mermaid Diagram (Simplified Component Interaction Post-Refactor)

```mermaid
graph TD
    subgraph UI Components
        App[App Layout]
        SettingsPanel[Settings Panel] --> SettingsStore
        Uploader[ImageUploader] -- Emits ImageData --> GenerationStore
        Comparison[Comparison Area]
        Viewer[ImageViewer] --> GenerationStore
        GalleryComp[Gallery] --> GalleryStore
        GalleryComp -- Triggers Select --> GenerationStore
        GenButton[GenerationButton] --> GenerationStore
        ErrorMsg[ErrorMessage] --> GenerationStore
    end

    subgraph State Stores (Zustand)
        SettingsStore[(Settings Store)] <--> LocalStorage
        GenerationStore[(Generation Store)]
        GalleryStore[(Gallery Store)] <--> LocalStorage
    end

    GenerationStore -- Triggers API Call --> API[api.ts]
    API --> Backend[(Backend API)]

    SettingsStore --> App
    GenerationStore --> App
    GalleryStore --> App

    App --> Comparison
    Comparison --> Uploader
    Comparison --> Viewer