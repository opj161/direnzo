# Product Requirements Document: AI Fashion Image Generator (V1)

**Version:** 1.0
**Date:** 2025-04-02
**Status:** Draft

## 1. Introduction

This document outlines the requirements for the first version (V1) of the AI Fashion Image Generator, a web-based Software-as-a-Service (SaaS) application. The application allows users to upload an image of a clothing item and generate visuals of a customizable virtual model wearing that item in a specified environment. This V1 focuses on core functionality for anonymous users, leveraging Google's Gemini AI for image generation.

## 2. Goals

*   **Goal 1:** Provide a functional single-page web application for generating fashion images using AI.
*   **Goal 2:** Enable users to upload a clothing item image as visual input for the AI.
*   **Goal 3:** Allow customization of model characteristics (gender, body type, age, ethnicity) and environment settings (background, lighting, style).
*   **Goal 4:** Utilize Google Gemini 2.0 Flash (exp) via its API for multimodal (image + text) input to generate the final image.
*   **Goal 5:** Implement permanent server-side storage for all generated images.
*   **Goal 6:** Provide a client-side gallery showcasing recently generated images using browser local storage for anonymous users.
*   **Goal 7:** Deliver a modern, responsive user interface.

## 3. Features

### 3.1. Clothing Image Upload

*   **Description:** Users can upload an image of a single clothing item.
*   **Requirements:**
    *   Support drag-and-drop and traditional file input (`<input type="file">`).
    *   Accept `.jpg`, `.png`, `.webp` file formats.
    *   Implement a client-side file size limit (e.g., 10MB).
    *   Display a preview thumbnail of the uploaded image.
    *   Provide clear feedback on successful upload or errors (e.g., wrong format, too large).

### 3.2. Model Customization

*   **Description:** Users can define the characteristics of the virtual model wearing the clothing.
*   **Requirements:**
    *   Provide a dedicated UI panel for model settings.
    *   Use dropdown selectors for the following options:
        *   **Gender:** Female, Male, Androgynous
        *   **Body Type:** Slim, Average, Athletic, Curvy, Plus-size
        *   **Age Range:** 18-25, 26-35, 36-45, 46-55, 55+
        *   **Ethnicity:** Caucasian, Black/African Descent, East Asian, South Asian, Hispanic/Latino, Middle Eastern, Ambiguous/Mixed
    *   Selections should update the parameters sent to the backend for prompt generation.

### 3.3. Environment Customization

*   **Description:** Users can define the background, lighting, and overall style of the generated image.
*   **Requirements:**
    *   Provide a dedicated UI panel for environment settings.
    *   **Background:**
        *   Offer a dropdown selector with pre-defined scene presets:
            *   Simple White Studio
            *   Simple Grey Studio
            *   Outdoor - City Street
            *   Outdoor - Beach Sunset
            *   Outdoor - Park (Daylight)
            *   Abstract Gradient
        *   Provide a text input field for a brief "Custom Description".
        *   The UI should make it clear that either a Preset OR a Custom Description is used, not both.
    *   **Lighting:** Offer a dropdown selector with options:
        *   Studio Softbox
        *   Natural Daylight
        *   Golden Hour Sunlight
        *   Dramatic Rim Lighting
        *   Cinematic Moody
    *   **Lens/Style:** Offer a dropdown selector with options:
        *   Fashion Magazine (Standard)
        *   Portrait (Shallow DoF)
        *   Wide Angle Environmental
        *   Cinematic Look
    *   Selections should update the parameters sent to the backend for prompt generation.

### 3.4. AI Prompt Engineering (Backend Logic)

*   **Description:** Internal backend process to create the optimal input for the Gemini API based on user selections and the uploaded image.
*   **Requirements:**
    *   Receive user settings (model, environment) and the uploaded clothing image data (e.g., base64 encoded) from the frontend API call.
    *   Construct a descriptive text prompt incorporating the selected settings (e.g., "Generate a photorealistic image of a [Gender] model, [Age Range], [Ethnicity], with a [Body Type] body type, wearing the clothing item shown in the provided image. Setting: [Selected Preset Name OR Custom Description]. Lighting: [Lighting Style]. Style: [Lens/Style]. High detail, fashion photography.")
    *   Prepare the final multimodal input payload for the Gemini API, including both the generated text prompt and the provided image data.

### 3.5. Image Generation

*   **Description:** The core process of triggering the AI, handling the request, and displaying the result.
*   **Requirements:**
    *   A clear "Generate Image" button in the UI.
    *   Button should trigger an asynchronous request to the backend API, sending settings and image data.
    *   Frontend should display a clear loading indicator while waiting for the backend response. Button should be disabled during generation.
    *   Backend API endpoint receives the request, performs Prompt Engineering (3.4), and calls the Google Gemini 2.0 Flash (exp) API using the `@google/generative-ai` SDK with the multimodal payload.
    *   Backend awaits the response from the Gemini API.
    *   **On Success:** Backend receives the generated image data.
    *   **On Failure (API Error, Content Filter, Network Issue):** Backend logs the error internally and returns a simple, standardized error status/message to the frontend (e.g., `{ success: false, message: 'Generation failed' }`).
    *   Frontend receives the response:
        *   **On Success:** Displays the newly generated image prominently. Hides loading indicator, re-enables button. Triggers gallery update (3.7).
        *   **On Failure:** Displays a simple, user-friendly error message (e.g., "Image generation failed. Please try again."). Hides loading indicator, re-enables button.

### 3.6. Image Storage (Local Server-Side)

*   **Description:** All successfully generated images are stored persistently on the local filesystem of the server running the backend application. **Note:** This approach has significant implications for deployment and scalability compared to cloud storage.
*   **Requirements:**
    *   Upon successful generation by Gemini, the backend service must save the image data (binary/buffer) to a designated directory on the server's local filesystem (e.g., `backend/uploads/images/`).
    *   Images should be saved with unique identifiers (e.g., UUIDs) as filenames (e.g., `some-uuid.jpg`).
    *   A simple JSON file (e.g., `backend/uploads/metadata.json`) will be used to store metadata for each successfully generated image as an array of records, storing:
        *   `generationId` (Unique ID, matches filename)
        *   `createdAt` (ISO Timestamp string)
        *   `settingsUsed` (JSON object capturing model/environment selections)
        *   `imagePath` (Relative path to the image file, e.g., `/images/some-uuid.jpg`)
        *   `status` ('completed')
    *   The backend must implement basic file reading/writing logic for the metadata JSON file, handling potential concurrent access issues simplistically for V1 (e.g., read-modify-write, acknowledging potential race conditions under high load).
    *   The backend must serve the stored images via a static file route (e.g., `/images/:filename`).
    *   This storage is anonymous; no user identifiers are stored in V1.
    *   **Limitation:** Local filesystem storage is ephemeral on platforms like standard Cloud Run. Deployment requires persistent storage (e.g., a VM, server with persistent disk, or Cloud Run with mounted persistent volume). Data will be lost if the container/server restarts without persistent storage configured.

### 3.7. Results Gallery (Local Persistence)

*   **Description:** A gallery displaying thumbnails of the user's most recent generations during their session and across sessions on the same browser.
*   **Requirements:**
    *   A dedicated UI section (e.g., a horizontal scroll area below or sidebar next to the main image) to display gallery thumbnails.
    *   Use browser `localStorage` to persist gallery data.
    *   When an image is successfully generated (3.5):
        *   Its relative image path (e.g., `/images/some-uuid.jpg`) received from the backend is added to a list in `localStorage`. The frontend will construct the full URL for display.
        *   The gallery UI updates to show the new thumbnail at the beginning of the list.
    *   Limit the number of items stored in `localStorage` (e.g., max 20 items). When the limit is reached, adding a new item removes the oldest item from the list.
    *   On application load, read the list from `localStorage` and populate the gallery UI.
    *   Clicking a thumbnail in the gallery should display the corresponding larger image in the main view area (implementation detail: might just re-display the image URL, or could fetch associated settings if stored locally too).
    *   No explicit "delete" functionality for gallery items in V1. Persistence is per-browser.

## 4. Design & UX

*   **Layout:** Single-Page Application (SPA). Aim for an intuitive multi-section layout (e.g., Settings | Main Image | Gallery).
*   **Responsiveness:** Mobile-first design. The application must be usable and look professional on common screen sizes (mobile, tablet, desktop). Use responsive design techniques (CSS Flexbox/Grid, media queries).
*   **Styling:** Clean, modern, minimalist aesthetic suitable for a creative tool. Leverage Tailwind CSS utility classes for consistency and rapid development.
*   **Interaction:** Provide clear visual feedback for user actions: file upload progress/success/error, loading states during generation, clear interactive elements (buttons, dropdowns).

## 5. Technology Stack (Specific V1 Choice)

*   **Frontend Framework:** React (using Vite for development server and build)
*   **Frontend Styling:** Tailwind CSS
*   **Backend Runtime/Framework:** Node.js + Express.js
*   **AI Model:** Google Gemini 2.0 Flash (exp)
*   **AI SDK:** `@google/generative-ai` Node.js package
*   **Metadata Storage:** Local JSON file (`metadata.json`) on the backend server.
*   **Image Storage:** Local filesystem directory (`uploads/images/`) on the backend server.
*   **Deployment:**
    *   Backend: Containerized Node.js/Express app. **Deployment Note:** Requires a host with persistent filesystem storage (e.g., VM, dedicated server, or Cloud Run with persistent volume mount). Standard Cloud Run is unsuitable due to ephemeral storage.
    *   Frontend: Any static hosting provider (e.g., Firebase Hosting, Netlify, Vercel, GCS Static Hosting).

## 6. Workflow

1.  User navigates to the application URL.
2.  Frontend loads, checks `localStorage` for existing gallery items, and displays them.
3.  User uploads a clothing image (via drag-drop or file input). Image preview is shown.
4.  User configures Model settings via dropdowns.
5.  User configures Environment settings (choosing a background preset or entering custom text, choosing lighting, choosing style) via dropdowns/input.
6.  User clicks "Generate Image". UI enters loading state.
7.  Frontend sends image data and selected settings (JSON) to the backend API endpoint.
8.  Backend API receives the request.
9.  Backend constructs the text prompt and prepares the multimodal payload (text + image data).
10. Backend calls the Gemini API using the Node.js SDK.
11. **If Gemini call succeeds:**
    *   Backend receives image data.
    *   Backend saves the image buffer to the local `uploads/images/` directory.
    *   Backend reads `metadata.json`, adds a new record (settings, relative image path, timestamp), and writes the file back.
    *   Backend responds to the frontend with `{ success: true, imageUrl: '/images/some-uuid.jpg' }` (relative path).
12. **If Gemini call fails:**
    *   Backend logs the internal error.
    *   Backend responds to the frontend with `{ success: false, message: 'Generation failed' }`.
13. Frontend receives the backend response.
14. **On Success:** Hides loading state, constructs the full image URL (backend base URL + relative path), displays the image, adds the *relative path* to the `localStorage` gallery list, and updates the gallery UI.
15. **On Failure:** Hides loading state, shows the generic error message.
16. The user can view the generated image and the updated gallery. The gallery state persists in their browser via `localStorage`.

## 7. Release Criteria / Scope (V1)

*   All features listed in Section 3 are implemented and functional according to their requirements.
*   The application is deployed and accessible via a public URL.
*   Basic functionality works reliably on latest versions of major browsers (Chrome, Firefox, Safari, Edge).
*   The application is responsive across common device sizes.
*   Server-side image storage to the local filesystem and metadata logging to a local JSON file are operational.
*   Client-side gallery using `localStorage` works as described.

## 8. Out of Scope (V1)

*   User accounts, authentication, and login.
*   Server-side storage of user-specific galleries or preferences.
*   Monetization features (payments, subscriptions, credits, usage limits).
*   Advanced image editing features (inpainting, outpainting, upscaling).
*   Ability to save/manage setting presets.
*   Batch image generation.
*   Deleting specific images from storage or the local gallery via UI interaction.
*   Detailed error reporting or automated retries for the user.
*   Specific image resolution or quality controls exposed to the user.
*   API access for third-party developers.
*   Team or collaboration features.
