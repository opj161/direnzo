import { ModelSettingsState } from '../components/ModelSettings';
import { EnvironmentSettingsState } from '../components/EnvironmentSettings';
import { API_BASE_URL } from '../constants'; // Trying relative path from src

// Define the expected structure of the backend request payload
interface GenerateApiPayload {
  settings: {
    modelSettings: ModelSettingsState;
    environmentSettings: EnvironmentSettingsState;
  };
  imageData: string; // Base64 data URI
}

// Define the expected structure of a successful backend response
interface GenerateApiSuccessResponse {
  success: true;
  imageUrl: string;
  promptUsed: string; // Add prompt field
}

// Define the expected structure of a failed backend response
interface GenerateApiErrorResponse {
  success: false;
  message: string;
}

// Type guard to check for success response
function isSuccessResponse(response: unknown): response is GenerateApiSuccessResponse {
    return typeof response === 'object' && response !== null &&
           'success' in response && response.success === true &&
           'imageUrl' in response && typeof response.imageUrl === 'string' &&
           'promptUsed' in response && typeof response.promptUsed === 'string'; // Check for prompt field
}

// Type guard to check for error response
function isErrorResponse(response: unknown): response is GenerateApiErrorResponse {
    return typeof response === 'object' && response !== null &&
           'success' in response && response.success === false &&
           'message' in response && typeof response.message === 'string';
}


// API_BASE_URL is now imported from constants.ts

/**
 * Calls the backend API to generate an image.
 * @param payload - The settings and image data.
 * @returns The URL of the generated image.
 * @throws An error with a message if the API call fails or returns an error.
 */
export const generateImage = async (payload: GenerateApiPayload): Promise<{ imageUrl: string, promptUsed: string }> => {
  const apiUrl = `${API_BASE_URL}/generate`;
  console.log(`Sending request to: ${apiUrl}`);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Check if the response status code indicates an error
    if (!response.ok) {
      // Try to parse error message from backend if available
      let errorMessage = `API request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        if (isErrorResponse(errorData)) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        // Ignore if response body is not JSON or empty
        console.error("Could not parse error response body:", parseError);
      }
      throw new Error(errorMessage);
    }

    // Parse the successful JSON response
    const data = await response.json();

    // Validate the success response structure
    if (isSuccessResponse(data)) {
      // Return the object containing both URL and prompt
      return { imageUrl: data.imageUrl, promptUsed: data.promptUsed };
    } else {
      // Handle cases where the status code was ok, but the body is unexpected
      console.error("Unexpected successful response format:", data);
      throw new Error('Received an unexpected response format from the server.');
    }

  } catch (error) {
    console.error('Error calling generate API:', error);
    // Re-throw the error to be caught by the calling component
    // If it's already an Error object, re-throw it, otherwise wrap it
    if (error instanceof Error) {
        throw error;
    } else {
        throw new Error('An unknown error occurred during the API call.');
    }
  }
};