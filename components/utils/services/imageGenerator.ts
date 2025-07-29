



import { GoogleGenAI } from "@google/genai";

// The API key is sourced exclusively from the `API_KEY` environment variable.
// This is required for the AI Studio environment and deployment.

/**
 * Lazily initializes and returns a GoogleGenAI client instance.
 * This prevents the app from crashing on load if the API key is not set.
 * @returns {GoogleGenAI} An instance of the GoogleGenAI client.
 */
const getAiClient = () => {
    // Prioritize environment variable, then fall back to session storage (for E2E tests).
    const apiKey = process.env.API_KEY || (typeof window !== 'undefined' ? sessionStorage.getItem('GEMINI_API_KEY') : null);

    if (!apiKey) {
        const errorMessage = "CRITICAL: Image Generation API key is missing. Set `API_KEY` env var or provide it via 'apiKey' URL param for tests.";
        console.error(errorMessage);
        throw new Error(errorMessage);
    }
    return new GoogleGenAI({ apiKey });
};


/*
 * ============================================================================================
 *  The SCAT Principle: Concise AI Image Prompt Guideline
 * ============================================================================================
 * To generate precise images, use the SCAT Principle:
 *
 * S - Subject: Clearly state the main object(s) or character(s).
 *
 * C - Context/Action: Describe what the subject is doing or its environment.
 *
 * A - Atmosphere/Details: Convey mood, style, lighting, colors, and specific visual
 *     elements. Focus on positive descriptions to guide the AI.
 *
 * T - Type/Format: Specify technical requirements like aspect ratio or image type.
 *
 * By focusing purely on these desired elements, you guide the AI to create images
 * that naturally omit anything you haven't described.
 * ============================================================================================
*/


/**
 * Generates an image from a text prompt using the Imagen 3 model.
 * @param prompt A descriptive prompt for the image, ideally following the SCAT principle.
 * @returns A Promise that resolves to a base64 data URL string of the generated image.
 */
export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              // Use an aspect ratio that is close to the target area in the canvas (1080x756)
              // 4:3 (1.33) is a good fit.
              aspectRatio: '4:3',
            },
        });

        if (!response.generatedImages || response.generatedImages.length === 0) {
            throw new Error("API did not return any generated images.");
        }

        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        // Return as a data URL, which can be used as an `src` for an HTMLImageElement
        return `data:image/png;base64,${base64ImageBytes}`;

    } catch (error) {
        console.error("Error generating image from prompt:", error);
        throw new Error(`Failed to generate AI image. ${error instanceof Error ? error.message : ''}`);
    }
};