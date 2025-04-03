// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Initialize Express app
const app = express();

// --- Local Storage Setup ---
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const IMAGES_DIR = path.join(UPLOADS_DIR, 'images');
const METADATA_FILE = path.join(UPLOADS_DIR, 'metadata.json');
const IMAGE_ROUTE_PREFIX = '/images';

// --- Directory/File Setup ---
try {
    if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
    if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR);
    if (!fs.existsSync(METADATA_FILE)) fs.writeFileSync(METADATA_FILE, JSON.stringify([]), 'utf8');
    console.log(`Uploads directory: ${UPLOADS_DIR}`);
    console.log(`Metadata file: ${METADATA_FILE}`);
} catch (err) {
    console.error("FATAL ERROR: Could not create upload directories or metadata file.", err);
    process.exit(1);
}

// --- Gemini Client Initialization ---
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  console.error("FATAL ERROR: GEMINI_API_KEY environment variable not set.");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(geminiApiKey);
const modelName = "gemini-2.0-flash-exp-image-generation";

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- Static File Serving ---
app.use(IMAGE_ROUTE_PREFIX, express.static(IMAGES_DIR));
console.log(`Serving static images from ${IMAGES_DIR} at route ${IMAGE_ROUTE_PREFIX}`);

// --- Helper Function for Background Descriptions ---
// (Mimics logic from the successful frontend component)
function getBackgroundDescription(settings) {
    const custom = settings?.environmentSettings?.backgroundCustom;
    if (custom) {
        return `Custom setting: ${custom}`; // Use custom description directly if provided
    }

    const preset = settings?.environmentSettings?.backgroundPreset || 'studio-white'; // Default to studio white

    switch (preset) {
        case 'studio-white': return 'Clean, professional white studio background';
        case 'studio-gradient': return 'Clean, professional studio background with a subtle color gradient';
        case 'in-store': return 'Tasteful retail store environment with appropriate fixtures';
        case 'lifestyle-home': return 'Lifestyle home setting with tasteful, uncluttered interior design';
        case 'lifestyle-office': return 'Professional lifestyle office setting';
        case 'outdoor-urban': return 'Outdoor urban city setting with appropriate architecture';
        case 'outdoor-nature': return 'Outdoor nature setting with appropriate natural elements (trees, greenery, sky)';
        case 'seasonal-spring': return 'Outdoor setting with a bright, fresh Spring atmosphere';
        case 'seasonal-summer': return 'Outdoor setting with a warm, sunny Summer atmosphere';
        case 'seasonal-fall': return 'Outdoor setting with a crisp, colorful Autumn/Fall atmosphere';
        case 'seasonal-winter': return 'Outdoor setting with a cool, possibly snowy Winter atmosphere';
        default: return 'Clean, well-lit background'; // Fallback
    }
}

// --- Routes ---
app.get('/', (req, res) => {
  res.status(200).send('AI Fashion Image Generator Backend is running!');
});

// Generation route
app.post('/generate', async (req, res) => {
  console.log('Received /generate request');
  const { settings, imageData } = req.body;

  // Validation
  if (!settings || !imageData || !imageData.startsWith('data:image/') || !settings.modelSettings || !settings.environmentSettings) {
    console.error('Validation Error: Invalid request body structure or data.');
    return res.status(400).json({ success: false, message: 'Invalid request: Ensure settings (modelSettings, environmentSettings) and imageData (data URI) are provided correctly.' });
  }

  console.log('Settings received:', settings);

  try {
    // --- 1. Construct the IMPROVED Prompt ---
    const { modelSettings } = settings;

    // Start building subject description, conditionally adding details
    let subjectAttributes = [];

    // Add ethnicity if specified and meaningful (not default/ambiguous)
    if (modelSettings.ethnicity && modelSettings.ethnicity.toLowerCase() !== 'default' && modelSettings.ethnicity.toLowerCase() !== 'ambiguous ethnicity' && modelSettings.ethnicity.toLowerCase() !== 'unspecified') {
        if (modelSettings.ethnicity.toLowerCase() === 'diverse') {
             subjectAttributes.push("with diverse ethnic features");
        } else {
            subjectAttributes.push(modelSettings.ethnicity); // Use the provided ethnicity label directly
        }
    }

    // Add body type if specified and meaningful (not default/average)
    if (modelSettings.bodyType && modelSettings.bodyType.toLowerCase() !== 'default' && modelSettings.bodyType.toLowerCase() !== 'average') {
        // Add descriptive phrasing
        subjectAttributes.push(`with ${modelSettings.bodyType} body proportions`);
    }

     // Add age range if specified and meaningful (not default/generic)
     // Assuming 'default' age might be represented by '26-35' or similar, or just absence.
     // Be more specific if frontend sends clear non-default indicators.
     // For now, include if present and seems specific.
    if (modelSettings.ageRange && modelSettings.ageRange.toLowerCase() !== 'default' && modelSettings.ageRange !== '26-35' /* Example default */) {
        subjectAttributes.push(`in the ${modelSettings.ageRange} age range`);
    }

    // Construct the subject string
    const attributeString = subjectAttributes.length > 0 ? subjectAttributes.join(', ') + ' ' : '';
    const gender = modelSettings.gender || 'female'; // Default to female if not specified
    // Basic pose instruction - could be expanded if pose setting is added
    const poseDescription = "standing in a natural, relaxed pose";

    const subjectSection = `a ${attributeString}${gender} fashion model ${poseDescription} wearing the clothing item shown in the provided image`;

    // Get the descriptive setting string
    const settingSection = getBackgroundDescription(settings);

    // Define the crucial Style section (taken from successful frontend prompt)
    const styleSection = `The model should look authentic and relatable with a natural expression and a subtle smile. The clothing must fit perfectly and be the visual focus of the image.`;

    // Define the crucial Technical details section (taken from successful frontend prompt)
    // Note: We ignore the old simple 'lighting' and 'lensStyle' settings as this paragraph is better.
    const technicalSection = `Professional fashion photography lighting with perfect exposure and color accuracy.`;

    // Assemble the final structured prompt
    const textPrompt = `CREATE A PHOTOREALISTIC IMAGE of ${subjectSection}\n\nSetting: ${settingSection}\n\nStyle: ${styleSection}\n\nTechnical details: ${technicalSection}`;

    console.log("Constructed Structured Prompt:\n", textPrompt); // Log the improved prompt

    // --- Prepare Image Input (Remains the same) ---
    const match = imageData.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
        console.error('Error parsing imageData URI');
        return res.status(400).json({ success: false, message: 'Invalid image data format.' });
    }
    const mimeType = match[1];
    const base64Data = match[2];
    const imagePart = { inlineData: { data: base64Data, mimeType: mimeType } };

    // Prepare content parts for API
    const contents = [ { text: textPrompt }, imagePart ];

    // --- 2. Initialize Model & Call API (Remains the same) ---
    console.log(`Initializing model: ${modelName}`);
    const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseModalities: ["Text", "Image"] },
        // Default safety settings
    });

    console.log('Calling Gemini API...');
    const TIMEOUT_MS = 45000;
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Request timed out after ${TIMEOUT_MS / 1000} seconds`)), TIMEOUT_MS);
    });

    let result;
    try {
        result = await Promise.race([
            model.generateContent(contents),
            timeoutPromise
        ]);
    } catch (apiError) {
        // Specific API Error Handling (Remains the same)
        console.error('Gemini API call failed or timed out:', apiError);
        const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
        let userMessage = `Image generation failed: ${errorMessage}`;
        let statusCode = 500;
        // ... (status code logic based on error message remains the same) ...
        if (errorMessage.includes('timed out')) { statusCode = 504; userMessage = 'Image generation failed: The request took too long.'; }
        else if (errorMessage.toLowerCase().includes('permission') || errorMessage.includes('not found') || errorMessage.includes('not available')) { statusCode = 403; userMessage = 'Image generation failed: Model access denied or not found.'; }
        else if (errorMessage.toLowerCase().includes('content') || errorMessage.toLowerCase().includes('policy') || errorMessage.toLowerCase().includes('safety')) { statusCode = 400; userMessage = 'Image generation failed due to content policy violation.'; }
        else if (apiError.message?.includes('API key not valid')) { statusCode = 401; userMessage = 'Image generation failed: Invalid API Key.'; }
        return res.status(statusCode).json({ success: false, message: userMessage });
    }

    // --- 3. Handle Gemini Response (Remains the same) ---
    const response = result.response;
    const candidate = response?.candidates?.[0];

     if (!candidate || (candidate.finishReason && candidate.finishReason !== "STOP")) {
        // Handle blocked/failed responses (Remains the same)
        console.error('Gemini API Error: Request may have been blocked or failed post-call.', { finishReason: candidate?.finishReason, safetyRatings: candidate?.safetyRatings, promptFeedback: response?.promptFeedback });
        const blockReason = response?.promptFeedback?.blockReason || candidate?.finishReason || 'Unknown';
        const safetyRatings = candidate?.safetyRatings || response?.promptFeedback?.safetyRatings;
        let message = `Image generation failed. Reason: ${blockReason}.`;
         if (safetyRatings) message += ` Details: ${JSON.stringify(safetyRatings)}`;
        return res.status(500).json({ success: false, message: message });
    }
    if (!candidate.content?.parts?.length) {
        // Handle empty responses (Remains the same)
        console.error('Gemini API Error: No content parts received.', response);
        return res.status(500).json({ success: false, message: 'Image generation failed: Received an empty response from the API.' });
    }

    // --- 4. Process Generated Content Parts (Remains the same) ---
    let generatedImageData = null;
    let generatedMimeType = null;
    let textResponse = null;
    console.log("Iterating through response parts...");
    for (const part of candidate.content.parts) {
        // ... (logic to find image and text parts remains the same) ...
         if (part.inlineData && part.inlineData.data && part.inlineData.mimeType?.startsWith('image/')) {
            generatedImageData = part.inlineData.data;
            generatedMimeType = part.inlineData.mimeType;
            console.log(`Found image part with mimeType: ${generatedMimeType}`);
        } else if (part.text) {
            textResponse = part.text;
            console.log(`Found text part: "${textResponse}"`);
        }
    }

    // --- 5. Handle Outcome (Prioritize Image - Remains the same logic) ---
    if (generatedImageData) {
        console.log('Gemini API Success: Found generated image data.');
        if (textResponse) console.warn('Received text alongside image:', textResponse);

        // --- 5a. Save Image (Remains the same) ---
        const generationId = uuidv4();
        const fileExtension = generatedMimeType ? generatedMimeType.split('/')[1] || 'jpg' : 'jpg';
        const fileName = `${generationId}.${fileExtension}`;
        const imagePath = path.join(IMAGES_DIR, fileName);
        const imageUrlRelative = `${IMAGE_ROUTE_PREFIX}/${fileName}`;
        const imageBuffer = Buffer.from(generatedImageData, 'base64');

        console.log(`Saving image to local path: ${imagePath}`);
        try {
            fs.writeFileSync(imagePath, imageBuffer);
            console.log(`Successfully saved ${fileName} locally.`);
        } catch (writeError) {
            console.error(`Error saving image file ${fileName}:`, writeError);
            return res.status(500).json({ success: false, message: 'Failed to save generated image to server.' });
        }

        // --- 5b. Save Metadata (Remains the same) ---
        const metadataRecord = { /* ... (metadata structure remains the same) ... */
            generationId: generationId,
            createdAt: new Date().toISOString(),
            // Store the actual settings used for traceability
            settingsUsed: settings,
             // Add the generated prompt to metadata for debugging/review
            promptUsed: textPrompt,
            imagePath: imageUrlRelative,
            status: 'completed'
        };
        console.log(`Appending metadata to ${METADATA_FILE}`);
        try {
            // ... (metadata reading/writing logic remains unchanged) ...
            let metadata = [];
            try {
                const rawData = fs.readFileSync(METADATA_FILE, 'utf8');
                metadata = JSON.parse(rawData);
                if (!Array.isArray(metadata)) metadata = [];
            } catch (readError) {
                if (readError.code !== 'ENOENT') console.error(`Error reading metadata file ${METADATA_FILE}:`, readError);
                else console.warn(`${METADATA_FILE} not found. Initializing.`);
                metadata = [];
            }
            metadata.unshift(metadataRecord);
            fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2), 'utf8');
            console.log('Successfully updated metadata file.');
        } catch (metadataError) {
            console.error(`Error updating metadata file ${METADATA_FILE}:`, metadataError);
        }

        // --- 5c. Return Success Response (Remains the same) ---
        console.log(`Sending success response with relative URL: ${imageUrlRelative}`);
        res.status(200).json({ success: true, imageUrl: imageUrlRelative });

    } else {
        // --- Handle case where NO image was generated (Remains the same logic) ---
        console.error('Gemini API Error: No image data found in the response parts.');
        let message = 'Image generation failed: No image data received from API.';
        if (textResponse) message += ` Model response: "${textResponse}"`;
        else if(response?.promptFeedback?.blockReason) message += ` Reason potentially related to: ${response.promptFeedback.blockReason}.`;
        return res.status(500).json({ success: false, message: message });
    }

  } catch (error) {
    // --- Outer Catch Block (Remains the same) ---
    console.error('Unhandled error during /generate processing:', error);
    console.error('Detailed error object:', JSON.stringify(error, null, 2));
    res.status(500).json({ success: false, message: `Image generation failed due to an unexpected internal server error: ${error.message || error}` });
  }
});

// --- Server Start (Remains the same) ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});