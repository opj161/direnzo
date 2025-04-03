// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai'); // Updated import
const { v4: uuidv4 } = require('uuid'); // For generating unique IDs
const fs = require('fs'); // Node.js File System module
const path = require('path'); // Node.js Path module

// Initialize Express app
const app = express();

// --- Local Storage Setup ---
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const IMAGES_DIR = path.join(UPLOADS_DIR, 'images');
const METADATA_FILE = path.join(UPLOADS_DIR, 'metadata.json');
const IMAGE_ROUTE_PREFIX = '/images'; // How images will be accessed via URL

// Ensure upload directories exist
try {
    if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR);
        console.log(`Created directory: ${UPLOADS_DIR}`);
    }
    if (!fs.existsSync(IMAGES_DIR)) {
        fs.mkdirSync(IMAGES_DIR);
        console.log(`Created directory: ${IMAGES_DIR}`);
    }
    // Initialize metadata file if it doesn't exist
    if (!fs.existsSync(METADATA_FILE)) {
        fs.writeFileSync(METADATA_FILE, JSON.stringify([]), 'utf8');
        console.log(`Created metadata file: ${METADATA_FILE}`);
    }
} catch (err) {
    console.error("FATAL ERROR: Could not create upload directories or metadata file.", err);
    process.exit(1);
}


// --- Gemini Client Initialization ---
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  console.error("FATAL ERROR: GEMINI_API_KEY environment variable not set.");
  process.exit(1); // Exit if API key is missing
}
// Initialize with new SDK syntax
const genAI = new GoogleGenAI({apiKey: geminiApiKey}); // Correct: Pass API key in an options object
// Model selection remains similar, but access via genAI instance directly
const modelName = "gemini-2.0-flash-exp"; // Or "gemini-pro-vision" if needed, check compatibility
// --- Middleware ---

// Enable CORS for all origins (adjust for production later)
app.use(cors());

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' })); // Set limit for base64 image data

// --- Static File Serving ---
// Serve images from the uploads/images directory via the /images route
app.use(IMAGE_ROUTE_PREFIX, express.static(IMAGES_DIR));
console.log(`Serving static images from ${IMAGES_DIR} at route ${IMAGE_ROUTE_PREFIX}`);

// --- Routes ---

// Basic health check route
app.get('/', (req, res) => {
  res.status(200).send('AI Fashion Image Generator Backend is running!');
});

// Generation route
app.post('/generate', async (req, res) => {
  console.log('Received /generate request');
  const { settings, imageData } = req.body; // Expecting { settings: {...}, imageData: "data:image/..." }

  // Basic validation
  if (!settings || !imageData) {
    console.error('Validation Error: Missing settings or imageData in request body');
    return res.status(400).json({ success: false, message: 'Missing required fields: settings and imageData' });
  }

  // Validate imageData format (basic check for data URI)
  if (!imageData.startsWith('data:image/')) {
      console.error('Validation Error: Invalid imageData format');
      return res.status(400).json({ success: false, message: 'Invalid imageData format. Expected data URI (e.g., data:image/png;base64,...)' });
  }

  console.log('Settings received:', settings);
  // console.log('Image data received (first 50 chars):', imageData.substring(0, 50)); // Avoid logging full base64

  try {
    // --- 1. Construct Gemini Prompt (Item 2.55) ---
    const { modelSettings, environmentSettings } = settings; // Assuming settings structure { modelSettings: {...}, environmentSettings: {...} }

    // Basic validation for nested settings
    if (!modelSettings || !environmentSettings) {
        console.error('Validation Error: Missing modelSettings or environmentSettings');
        return res.status(400).json({ success: false, message: 'Missing required settings structure.' });
    }

    const backgroundDesc = environmentSettings.backgroundCustom || environmentSettings.backgroundPreset || 'simple white studio'; // Use custom, preset, or default
    const textPrompt = `Generate a photorealistic image of a ${modelSettings.gender || 'person'} model, age range ${modelSettings.ageRange || '26-35'}, ${modelSettings.ethnicity || 'ambiguous ethnicity'}, with a ${modelSettings.bodyType || 'average'} body type, wearing the clothing item shown in the provided image. Setting: ${backgroundDesc}. Lighting: ${environmentSettings.lighting || 'Studio Softbox'}. Style: ${environmentSettings.lensStyle || 'Fashion Magazine (Standard)'}. High detail, fashion photography.`;

    console.log("Constructed Text Prompt:", textPrompt);

    // --- 2. Prepare Multimodal Payload & Call Gemini API (Item 2.56) ---

    // Extract MIME type and base64 data from data URI
    const match = imageData.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
        console.error('Error parsing imageData URI');
        return res.status(400).json({ success: false, message: 'Invalid image data format.' });
    }
    const mimeType = match[1];
    const base64Data = match[2];

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    };

    // Define safety settings to minimize blocking
    const safetySettings = [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
    ];

    // Define generation config using responseModalities
    const generationConfig = {
        // Specify that we expect an image response modality
        responseModalities: ["Image"],
        // Optional: configure other generation parameters if needed
        // temperature: 0.4,
        // topK: 32,
        // topP: 1,
        // maxOutputTokens: 4096,
    };

    console.log(`Calling Gemini API with model: ${modelName}`);
    // Use the new SDK's generateContent method structure directly on genAI.models
    const result = await genAI.models.generateContent({
        model: modelName, // Pass model name here
        contents: [{ role: "user", parts: [imagePart, { text: textPrompt }] }],
        generationConfig, // Use the config with responseModalities
        safetySettings: safetySettings // Add the safety settings
    });

    // --- 3. Handle Gemini Response (Item 2.57) ---
    // Check for blocked content or other issues before accessing response
    // Response structure might be slightly different, adjust parsing
    // The core logic of checking candidates and parts should be similar,
    // but let's refine the check based on potential new SDK structure.
    // We primarily need the first candidate's first part's inlineData.
    const response = result.response; // Get the response object
    const candidate = response?.candidates?.[0];

    if (!candidate || !candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        console.error('Gemini API Error: Invalid response structure or content blocked.', response?.promptFeedback);
        const blockReason = response?.promptFeedback?.blockReason;
        const safetyRatings = response?.promptFeedback?.safetyRatings;
        let message = 'Image generation failed. The request might have been blocked due to safety policies.';
        if (blockReason) {
            message += ` Reason: ${blockReason}.`;
        }
        if (safetyRatings) {
            message += ` Details: ${JSON.stringify(safetyRatings)}`;
        }
        return res.status(500).json({ success: false, message: message });
    }

    // Find the part containing the image data
    const generatedImagePart = candidate.content.parts.find(part => part.inlineData && part.inlineData.mimeType.startsWith('image/'));

    // Ensure an image part was found and has the expected structure
    if (!generatedImagePart || !generatedImagePart.inlineData || !generatedImagePart.inlineData.data) {
        console.error('Gemini API Error: No valid image part found in response.', candidate.content.parts);
        return res.status(500).json({ success: false, message: 'Image generation failed: No image data received from API.' });
    }
    // We don't need to strictly check for jpeg here if the model might return png/webp sometimes,
    // but saving as .jpg is fine as browsers handle it.
    // if (generatedImagePart.inlineData.mimeType !== 'image/jpeg') { ... }

    const generatedImageData = generatedImagePart.inlineData.data; // Base64 encoded JPEG
    console.log('Gemini API Success: Received generated image data.');

    // --- 4. Save Image to Local Filesystem ---
    const generationId = uuidv4(); // Unique ID for this generation
    const fileName = `${generationId}.jpg`;
    const imagePath = path.join(IMAGES_DIR, fileName);
    const imageUrlRelative = `${IMAGE_ROUTE_PREFIX}/${fileName}`; // Relative URL path

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(generatedImageData, 'base64');

    console.log(`Saving image to local path: ${imagePath}`);
    try {
        fs.writeFileSync(imagePath, imageBuffer);
        console.log(`Successfully saved ${fileName} locally.`);
    } catch (writeError) {
        console.error(`Error saving image file ${fileName}:`, writeError);
        throw new Error('Failed to save generated image to server.'); // Throw specific error
    }

    // --- 5. Save Metadata to Local JSON File ---
    const metadataRecord = {
      generationId: generationId,
      createdAt: new Date().toISOString(), // Use ISO timestamp string
      settingsUsed: settings, // Store the exact settings used
      imagePath: imageUrlRelative, // Store the relative path
      status: 'completed'
    };

    console.log(`Appending metadata to ${METADATA_FILE}`);
    try {
        // Read existing data (handle potential read errors/empty file)
        let metadata = [];
        try {
            const rawData = fs.readFileSync(METADATA_FILE, 'utf8');
            metadata = JSON.parse(rawData);
            if (!Array.isArray(metadata)) { // Basic validation
                console.warn(`${METADATA_FILE} does not contain a valid JSON array. Resetting.`);
                metadata = [];
            }
        } catch (readError) {
            if (readError.code === 'ENOENT') {
                console.warn(`${METADATA_FILE} not found. Starting with empty metadata.`);
                metadata = []; // File doesn't exist yet
            } else {
                console.error(`Error reading metadata file ${METADATA_FILE}:`, readError);
                // Decide if we should proceed without saving metadata or throw
                throw new Error('Failed to read metadata file.');
            }
        }

        // Add new record and write back (simple approach, prone to race conditions)
        metadata.unshift(metadataRecord); // Add new record to the beginning
        // Optional: Limit the size of the metadata file if needed
        // metadata = metadata.slice(0, MAX_METADATA_RECORDS);

        fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2), 'utf8'); // Pretty print JSON
        console.log('Successfully updated metadata file.');

    } catch (metadataError) {
        console.error(`Error updating metadata file ${METADATA_FILE}:`, metadataError);
        // Decide how to handle - maybe log and continue, or return error?
        // For V1, log and continue, but the image is saved.
        // Consider returning a partial success or warning in a real app.
    }


    // --- 6. Return Success Response (Item 2.69 - Updated) ---
    console.log(`Sending success response with relative URL: ${imageUrlRelative}`);
    res.status(200).json({
      success: true,
      imageUrl: imageUrlRelative // Return the relative path
    });
  } catch (error) {
    console.error('Error during /generate processing:', error);
    // Return generic error (Item 2.69)
    res.status(500).json({ success: false, message: 'Image generation failed due to an internal server error.' });
  }
});


// --- Server Start ---

const PORT = process.env.PORT || 3001; // Use PORT from env or default to 3001

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});