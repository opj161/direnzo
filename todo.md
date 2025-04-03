# AI Fashion Image Generator (V1) - Step-by-Step Build Checklist

This checklist outlines the steps to build Version 1 of the AI Fashion Image Generator, based on the PRD and specified tech stack (React/Vite, Tailwind, Node.js/Express, Gemini, Local File Storage). **Note:** Local storage impacts deployment options.

**Legend:**
*   `[ ]` To Do
*   `[x]` Done

---

## Phase 1: Setup & Foundation

*   [ ] **Version Control:**
    *   [ ] Create a monorepo or two separate Git repositories (e.g., `fashion-ai-frontend`, `fashion-ai-backend`).
    *   [ ] Initialize Git in the chosen structure.
    *   [ ] Create initial `README.md` files for both frontend and backend.
*   [ ] **Google Cloud Project:**
    *   [ ] Create a new Google Cloud Project or use an existing one.
    *   [ ] Enable necessary APIs:
        *   [ ] AI Platform (or Vertex AI) API (for Gemini access)
        *   [ ] ~~Cloud Storage API~~ (Removed - Using local storage)
        *   [ ] ~~Firestore API~~ (Removed - Using local storage)
        *   [ ] Cloud Run API
        *   [ ] Cloud Build API (optional, for automated builds)
        *   [ ] Artifact Registry API (or Container Registry)
    *   [ ] Configure Billing for the project.
*   [ ] **Local Storage Setup:**
    *   [ ] Define backend directory structure for uploads (e.g., `backend/uploads/images/`).
    *   [ ] Define structure for metadata JSON file (e.g., `backend/uploads/metadata.json`).
    *   [ ] Ensure backend process has write permissions to the `uploads` directory.
    *   [ ] ~~Set up Authentication: Create a Service Account key or configure Application Default Credentials (ADC) for local backend development access to Google Cloud APIs.~~ (Not needed for local storage)
*   [ ] **API Keys & Secrets:**
    *   [ ] Obtain your Google Gemini API Key.
    *   [ ] Store secrets securely (DO NOT commit them):
        *   Use environment variables (`.env` file locally, added to `.gitignore`).
        *   Plan for secret management in the chosen deployment environment (e.g., VM environment variables).
*   [ ] **Local Development Environment:**
    *   [ ] Ensure Node.js (LTS version recommended) and npm/yarn are installed.
    *   [ ] Clone the repository/repositories.
    *   [ ] Install backend dependencies (`npm install` or `yarn install` in the backend directory).
    *   [ ] Install frontend dependencies (`npm install` or `yarn install` in the frontend directory).

## Phase 2: Backend Development (Node.js/Express on Cloud Run)

*   [ ] **Basic Server Setup:**
    *   [ ] Initialize Node.js project (`npm init`).
    *   [ ] Install core dependencies: `express`, `dotenv`, `@google/generative-ai`, `cors`, `uuid` (for unique filenames). (Removed GCS/Firestore libs). Add `fs-extra` for potentially easier file operations (optional).
    *   [ ] Create basic Express server structure (`server.js` or `index.js`).
    *   [ ] Set up environment variable handling (using `dotenv` locally).
    *   [ ] Implement basic CORS configuration (`cors` middleware).
*   [ ] **API Endpoint (`/generate`):**
    *   [ ] Define the `POST /generate` route in Express.
    *   [ ] Implement logic to receive request body (expecting JSON with settings and base64 image data). Add basic validation.
*   [ ] **Gemini Integration:**
    *   [ ] Implement Gemini API client initialization using `@google/generative-ai` and the API key from environment variables.
    *   [ ] Implement logic to construct the multimodal prompt: combine text prompt derived from settings + image data (decode base64).
    *   [ ] Implement the call to `gemini-2.0-flash-exp` model's `generateContent` method with the multimodal payload.
    *   [ ] Handle the Gemini API response: extract the generated image data (likely base64).
*   [ ] **Local File Storage Integration:**
    *   [ ] Implement logic to ensure the `uploads/images` directory exists (e.g., using `fs.mkdirSync` or `fs-extra.ensureDirSync`).
    *   [ ] Implement function to save the generated image buffer to `uploads/images/` with a unique filename (e.g., using `fs.writeFileSync`).
    *   [ ] Implement function to read the `uploads/metadata.json` file (handle case where it doesn't exist yet).
    *   [ ] Implement function to append new generation metadata (timestamp, settings used, relative image path, status) to the JSON data.
    *   [ ] Implement function to write the updated metadata back to `uploads/metadata.json` (handle potential race conditions simplistically for V1).
    *   [ ] Implement Express static middleware (`express.static`) to serve files from the `uploads/images` directory under a specific route (e.g., `/images`).
*   [ ] **Error Handling:**
    *   [ ] Wrap Gemini API calls and local file system operations (read/write image, read/write JSON) in `try...catch` blocks.
    *   [ ] Implement standardized success (`{ success: true, imageUrl: '/images/...' }`) (relative path) and error (`{ success: false, message: '...' }`) responses for the API endpoint.
    *   [ ] Add basic logging (e.g., `console.error`) for backend errors.
*   [ ] **Containerization:**
    *   [ ] Create a `Dockerfile` for the backend service (Node.js base image, copy code, install dependencies, expose port, define start command).
    *   [ ] Create a `.dockerignore` file.
    *   [ ] Build and test the Docker image locally.
*   [ ] **Local Testing:**
    *   [ ] Use tools like Postman or `curl` to send test requests to the local backend server, including sample base64 image data. Verify responses and check `uploads/images/` and `uploads/metadata.json` files.

## Phase 3: Frontend Development (React/Vite + Tailwind)

*   [ ] **Project Setup:**
    *   [ ] Create React project using Vite (`npm create vite@latest -- --template react`).
    *   [ ] Add and configure Tailwind CSS following its framework guide for Vite.
*   [ ] **Component Implementation:**
    *   [ ] Create `App.jsx` as the main container.
    *   [ ] Implement `ImageUploader.jsx`: file input, drag-drop handling (e.g., using `react-dropzone`), image preview, file validation (size/type). Store uploaded file data (e.g., base64) in state.
    *   [ ] Implement `ModelSettings.jsx`: dropdowns for Gender, Body Type, Age, Ethnicity. Manage selections in state.
    *   [ ] Implement `EnvironmentSettings.jsx`: dropdowns for Background Preset, Lighting, Lens/Style; text input for Custom Background. Add logic to use either preset or custom text. Manage selections in state.
    *   [ ] Implement `GenerationButton.jsx`: Button triggering the generation process. Handle loading/disabled states.
    *   [ ] Implement `ImageViewer.jsx`: Displays the main generated image based on a URL passed via props or state.
    *   [ ] Implement `Gallery.jsx`: Reads image URLs from `localStorage`, displays thumbnails, handles click to potentially update the main viewer (optional).
    *   [ ] Implement `LoadingIndicator.jsx`: Visual feedback during generation.
    *   [ ] Implement `ErrorMessage.jsx`: Displays errors returned from the backend.
*   [ ] **State Management:**
    *   [ ] Use `useState` hooks in components for managing form inputs, uploaded image data, loading state, error messages, current generated image URL, and gallery items list.
    *   [ ] Lift state up to common ancestor components as needed (likely `App.jsx` will hold most shared state).
*   [ ] **API Interaction:**
    *   [ ] Implement an API service function (e.g., `api.js`) using `fetch` or `axios` to make the `POST` request to the backend `/generate` endpoint.
    *   [ ] Pass the settings state and the base64 representation of the uploaded image in the request body.
    *   [ ] Handle the JSON response (`success`, `imageUrl` (relative path) or `message`).
    *   [ ] Update component state based on the API response (construct full image URL using backend base URL + relative path, set image URL, show error, update loading state).
*   [ ] **Local Storage Integration:**
    *   [ ] Implement utility functions to read from/write to `localStorage` for the gallery *relative image path* list.
    *   [ ] Call these functions on app load (`useEffect` in `App.jsx`) and after successful image generation.
    *   [ ] Implement the logic to limit the number of stored gallery items.
*   [ ] **Styling & Responsiveness:**
    *   [ ] Apply Tailwind CSS utility classes to all components for styling and layout.
    *   [ ] Use responsive prefixes (e.g., `md:`, `lg:`) to ensure the layout adapts to different screen sizes.
    *   [ ] Test responsiveness using browser developer tools.

## Phase 4: Integration & Testing

*   [ ] **Local End-to-End Testing:**
    *   [ ] Run both the frontend dev server (`npm run dev`) and the backend server (`node server.js` or similar) locally.
    *   [ ] Ensure the frontend API calls correctly hit the local backend endpoint (check CORS).
    *   [ ] Test the full user flow: Upload -> Settings -> Generate -> View Image -> Check Gallery -> Check `localStorage` (should store relative paths). Check `backend/uploads` directory and `metadata.json`.
    *   [ ] Test error conditions (e.g., failed generation response from backend).
    *   [ ] Test responsiveness across simulated device sizes.
*   [ ] **Code Review & Refinement:**
    *   [ ] Review frontend and backend code for clarity, efficiency, and adherence to requirements.
    *   [ ] Refactor as needed.

## Phase 5: Deployment

*   [ ] **Backend Deployment (Requires Persistent Storage):**
    *   [ ] Build the backend Docker image: `docker build -t your-image-repo/fashion-ai-backend:v1 .` (Adjust repo name)
    *   [ ] Push the image to a container registry (e.g., Docker Hub, GCR, Artifact Registry).
    *   [ ] Deploy the container to a host with **persistent storage** (e.g., VM, server, Kubernetes with PersistentVolume, Cloud Run with Volume Mount).
    *   [ ] **Crucially:** Mount a persistent volume to the container's `/usr/src/app/uploads` directory (or wherever uploads are stored).
    *   [ ] Configure environment variables on the host for `GEMINI_API_KEY`.
    *   [ ] Ensure the host firewall allows traffic to the backend port.
    *   [ ] Test the deployed backend endpoint URL and image serving route.
*   [ ] **Frontend Deployment (Firebase Hosting or GCS):**
    *   [ ] Update the frontend code (e.g., via environment variable `VITE_API_BASE_URL`) to point API requests to the deployed backend service URL.
    *   [ ] Build the static React application: `npm run build`.
    *   [ ] **Option A (Firebase Hosting):**
        *   [ ] Set up Firebase project (can link to existing Google Cloud project).
        *   [ ] Install Firebase CLI (`npm install -g firebase-tools`).
        *   [ ] Login (`firebase login`).
        *   [ ] Initialize Firebase in the frontend project directory (`firebase init hosting`). Configure it to use the `dist` (or build output) directory.
        *   [ ] Deploy (`firebase deploy`).
    *   [ ] **Option B (GCS Static Hosting):**
        *   [ ] Create a GCS bucket for the frontend.
        *   [ ] Upload the contents of the `dist` folder to the bucket.
        *   [ ] Configure the bucket for static website hosting (set main page, error page).
        *   [ ] Make bucket contents publicly readable.
*   [ ] **CORS Configuration:**
    *   [ ] Ensure the backend's CORS configuration in Express allows requests from the deployed frontend's domain (Firebase Hosting URL or GCS domain). Update and redeploy backend if needed.

## Phase 6: Post-Deployment & Final Checks

*   [ ] **Live Testing:**
    *   [ ] Thoroughly test the fully deployed application in a browser, performing all user actions.
    *   [ ] Test on different browsers (Chrome, Firefox, Safari) and devices/screen sizes.
*   [ ] **Monitoring Setup:**
    *   [ ] Review logs from the deployed backend container/service.
    *   [ ] Consider setting up basic Cloud Monitoring alerts (e.g., for high error rates > 5xx).
*   [ ] **Documentation:**
    *   [ ] Update `README.md` files with setup instructions, deployment notes, and API endpoint descriptions.
*   [ ] **Definition of Done:**
    *   [ ] All checklist items completed.
    *   [ ] V1 features match the PRD.
    *   [ ] Application is live and usable by anonymous users.

---