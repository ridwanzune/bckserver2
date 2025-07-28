
import { GoogleGenAI, Type } from "@google/genai";
import type { SelectedArticleAnalysis, NewsDataArticle } from '../types';

// In a Vite project, environment variables must be prefixed with VITE_ to be exposed to the client.
// This key is sourced from the `VITE_GEMINI_API` environment variable.
// It must be set in your deployment environment (e.g., Vercel) or a local .env file.
const GEMINI_API_KEY = import.meta.env?.VITE_GEMINI_API;

if (!GEMINI_API_KEY) {
    const errorMessage = "CRITICAL: Gemini API key is missing. Ensure the `VITE_GEMINI_API` environment variable is set. This can be caused by: 1) The variable not being defined in your .env file or deployment environment. 2) The app not being run through Vite, which is required to expose environment variables.";
    console.error(errorMessage);
    throw new Error(errorMessage);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// The schema that defines the structure of the JSON object the AI must return.
// This makes the AI's output predictable and reliable, removing the need for fragile text parsing.
const responseSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            originalArticleId: {
                type: Type.INTEGER,
                description: 'The original ID number of the article from the provided list that was selected.',
            },
            category: {
                type: Type.STRING,
                enum: ['bangladesh', 'world', 'geopolitics'],
                description: 'The category this article was selected for.',
            },
            headline: {
                type: Type.STRING,
                description: 'A new, compelling headline created based on the IMPACT principle.',
            },
            highlightPhrases: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'An array of key phrases from the new headline.',
            },
            imagePrompt: {
                type: Type.STRING,
                description: 'A safe-for-work, symbolic image prompt based on the SCAT principle, avoiding specific people, violence, or sensitive topics.',
            },
            caption: {
                type: Type.STRING,
                description: 'A social media caption of about 50 words with 3-5 relevant hashtags. The source name should NOT be in the caption.',
            },
            sourceName: {
                type: Type.STRING,
                description: "The name of the original news source (e.g., 'thedailystar'). This is a separate, mandatory field.",
            },
        },
        required: ['originalArticleId', 'category', 'headline', 'highlightPhrases', 'imagePrompt', 'caption', 'sourceName'],
    },
};

/**
 * Reviews a large list of news articles and uses a single AI call to select and analyze the 6 best ones.
 * @param articles A large list of potential news articles.
 * @returns A Promise resolving to an array of 6 analyzed articles.
 */
export const selectAndAnalyzeSixBestArticles = async (
  articles: NewsDataArticle[]
): Promise<SelectedArticleAnalysis[]> => {
    const model = 'gemini-2.5-flash';

    // We assign a simple index as an ID for each article so the AI can reference it.
    const articleListForPrompt = articles
        .map((article, index) => `
ARTICLE ${index}:
ID: ${index}
Title: ${article.title}
Content: ${article.content || article.description}
Source: ${article.source_id}
---`
        ).join('\n');
    
    const prompt = `
You are an expert news editor for a social media channel. Your goal is to curate a batch of 6 top-tier news stories from a large, combined list of recent articles.

**Your Task:**
1.  **Review the entire list** of articles provided below.
2.  **Select exactly 6 articles** that are the most impactful and **recent** (published in the last 48 hours). The distribution must be:
    -   **2 articles** that are most newsworthy, impactful, and socially relevant to a **BANGLADESHI** audience. The article's main subject MUST be Bangladesh.
    -   **2 articles** with the most **GLOBAL** significance, interesting to a wide, international audience.
    -   **2 articles** that are most significant to **GEOPOLITICS**, international relations, or diplomacy.
3.  For EACH of the 6 articles you select, you must perform a full analysis.

**Analysis Steps for Each Selected Article:**
1.  **Headline Generation (IMPACT Principle):** Informative, Main Point, Prompting Curiosity, Active Voice, Concise, Targeted.
2.  **Highlight Phrase Identification:** Identify key phrases from your new headline that capture critical information.
3.  **Image Prompt Generation (SCAT Principle & Safety):** Generate a concise, descriptive prompt for an AI image generator. The prompt MUST be safe for work and MUST NOT contain depictions of specific people, violence, or sensitive topics. Focus on symbolic or abstract representations.
4.  **Caption & Source:** Create a social media caption (~50 words) with 3-5 relevant hashtags. DO NOT include the source name in the caption itself. The source name will be a separate field.

**List of Available Articles:**
${articleListForPrompt}

**Output Instructions:**
Return a JSON array containing exactly 6 objects, one for each article you selected and analyzed. Adhere strictly to the provided JSON schema.
`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        const responseText = response.text?.trim();

        if (!responseText) {
            throw new Error("Received an empty text response from the API.");
        }

        const parsedResponse = JSON.parse(responseText);

        if (!Array.isArray(parsedResponse) || parsedResponse.length !== 6) {
             throw new Error(`AI returned an invalid response. Expected an array of 6 items, but got ${parsedResponse.length} items.`);
        }

        return parsedResponse as SelectedArticleAnalysis[];

    } catch (error) {
        let errorMessage = "Failed to analyze the news articles with Gemini.";
        if (error instanceof Error) {
            errorMessage = `Gemini analysis failed: ${error.message}`;
        }
        console.error("Error in selectAndAnalyzeSixBestArticles:", error);
        throw new Error(errorMessage);
    }
};