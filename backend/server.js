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

// --- Helper Functions for Prompt Generation ---
// Background description function
function getBackgroundDescription(settings) {
    const custom = settings?.environmentSettings?.backgroundCustom;
    if (custom) {
        return `Custom setting: ${custom}`; // Use custom description directly if provided
    }

    const preset = settings?.environmentSettings?.backgroundPreset || 'studio-white'; // Default to studio white
    const season = settings?.environmentSettings?.season || '';

    // Start with the base description
    let description = '';

    switch (preset) {
        case 'studio-white': description = 'Clean, professional white studio background'; break;
        case 'studio-gradient': description = 'Clean, professional studio background with a subtle color gradient'; break;
        case 'in-store': description = 'Tasteful retail store environment with appropriate fixtures'; break;
        case 'lifestyle-home': description = 'Lifestyle home setting with tasteful, uncluttered interior design'; break;
        case 'lifestyle-office': description = 'Professional lifestyle office setting'; break;
        case 'outdoor-urban': description = 'Outdoor urban city setting with appropriate architecture'; break;
        case 'outdoor-nature': description = 'Outdoor nature setting with appropriate natural elements (trees, greenery, sky)'; break;
        case 'seasonal-spring': description = 'Outdoor setting with a bright, fresh Spring atmosphere'; break;
        case 'seasonal-summer': description = 'Outdoor setting with a warm, sunny Summer atmosphere'; break;
        case 'seasonal-fall': description = 'Outdoor setting with a crisp, colorful Autumn/Fall atmosphere'; break;
        case 'seasonal-winter': description = 'Outdoor setting with a cool, possibly snowy Winter atmosphere'; break;
        default: description = 'Clean, well-lit background'; // Fallback
    }

    // Add season if it's specified and not already included in the preset - ensure it's a string
    if (season && typeof season === 'string' && !preset.includes('seasonal')) {
        description += ` during ${season} season`;
    }

    return description;
}

// Weather and time of day description function
function getAtmosphericDescription(settings) {
    // Safely check if properties exist
    const timeOfDay = settings?.environmentSettings?.timeOfDay || '';
    const weather = settings?.environmentSettings?.weather || '';

    let description = '';

    // Add time of day if specified and is a string
    if (timeOfDay && typeof timeOfDay === 'string') {
        description += `during ${timeOfDay.toLowerCase()}`;
    }

    // Add weather if specified and is a string
    if (weather && typeof weather === 'string') {
        if (description) {
            description += ` with ${weather.toLowerCase()} weather conditions`;
        } else {
            description += `With ${weather.toLowerCase()} weather conditions`;
        }
    }

    return description;
}

// Camera and lighting description function
function getTechnicalDescription(settings) {
    // Safely get properties with defaults
    const lighting = settings?.environmentSettings?.lighting || 'Studio Softbox';
    const lensStyle = settings?.environmentSettings?.lensStyle || 'Fashion Magazine (Standard)';
    const cameraAngle = settings?.environmentSettings?.cameraAngle || 'Eye Level';

    let description = 'Professional fashion photography with ';

    // Add lighting - ensure it's a string
    description += `${typeof lighting === 'string' ? lighting : 'Studio Softbox'} lighting, `;

    // Add lens style - ensure it's a string
    description += `shot with a ${typeof lensStyle === 'string' ? lensStyle : 'Fashion Magazine (Standard)'} lens style, `;

    // Add camera angle - ensure it's a string
    description += `from a ${typeof cameraAngle === 'string' ? cameraAngle : 'Eye Level'} angle, `;

    // Add final technical details
    description += 'with perfect exposure and color accuracy.';

    return description;
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
    if (modelSettings.ageRange && modelSettings.ageRange.toLowerCase() !== 'default' && modelSettings.ageRange !== '26-35' /* Example default */) {
        subjectAttributes.push(`in the ${modelSettings.ageRange} age range`);
    }

    // Add height if specified - safely check if property exists
    if (modelSettings.height && typeof modelSettings.height === 'string' && modelSettings.height.toLowerCase() !== 'average') {
        subjectAttributes.push(`of ${modelSettings.height.toLowerCase()} height`);
    }

    // Add hair style if specified - safely check if property exists
    if (modelSettings.hairStyle && typeof modelSettings.hairStyle === 'string') {
        // Add hair color if specified
        if (modelSettings.hairColor && typeof modelSettings.hairColor === 'string') {
            subjectAttributes.push(`with ${modelSettings.hairStyle.toLowerCase()}, ${modelSettings.hairColor.toLowerCase()} hair`);
        } else {
            subjectAttributes.push(`with ${modelSettings.hairStyle.toLowerCase()} hair`);
        }
    } else if (modelSettings.hairColor && typeof modelSettings.hairColor === 'string') {
        // Only hair color specified
        subjectAttributes.push(`with ${modelSettings.hairColor.toLowerCase()} hair`);
    }

    // Add accessories if specified and not 'None' - safely check if property exists
    if (modelSettings.accessories && typeof modelSettings.accessories === 'string' && modelSettings.accessories.toLowerCase() !== 'none') {
        subjectAttributes.push(`wearing ${modelSettings.accessories.toLowerCase()}`);
    }

    // Construct the subject string
    const attributeString = subjectAttributes.length > 0 ? subjectAttributes.join(', ') + ' ' : '';
    const gender = modelSettings.gender || 'female'; // Default to female if not specified

    // Use the pose setting if available, otherwise default - safely check if property exists
    const poseDescription = (modelSettings.pose && typeof modelSettings.pose === 'string')
        ? `in a ${modelSettings.pose.toLowerCase()} pose`
        : "standing in a natural, relaxed pose";

    const subjectSection = `a ${attributeString}${gender} fashion model ${poseDescription} wearing the clothing item shown in the provided image`;

    // Get the descriptive setting string
    const settingSection = getBackgroundDescription(settings);

    // Get atmospheric conditions (time of day, weather)
    const atmosphericSection = getAtmosphericDescription(settings);

    // Combine setting and atmospheric conditions if both exist
    const fullSettingSection = atmosphericSection
        ? `${settingSection} ${atmosphericSection}`
        : settingSection;

    // Define the crucial Style section
    const styleSection = `The model should look authentic and relatable with a natural expression and a subtle smile. The clothing must fit perfectly and be the visual focus of the image.`;

    // Get the technical details with camera and lighting settings
    const technicalSection = getTechnicalDescription(settings);

    // Assemble the final structured prompt
    const textPrompt = `CREATE A PHOTOREALISTIC IMAGE of ${subjectSection}\n\nSetting: ${fullSettingSection}\n\nStyle: ${styleSection}\n\nTechnical details: ${technicalSection}`;

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
        res.status(200).json({ success: true, imageUrl: imageUrlRelative, promptUsed: textPrompt });

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