
import { APITUBE_API_KEY, NEWSAPI_ORG_KEY } from '../constants';
import type { NewsDataArticle } from '../types';

// --- Interfaces for APITube.io (Primary Source) ---
interface ApiTubeArticle {
  title: string; url: string; published_at: string; summary: string | null; content: string | null;
  image: { url: string | null; } | null; source: { name: string; };
}

// --- Interfaces for NewsAPI.org (Fallback Source) ---
interface NewsApiArticle {
  title: string; url: string; publishedAt: string; source: { name: string; };
  urlToImage: string | null; description: string | null; content: string | null;
}

// --- Helper to get date for API filtering ---
const getTwoDaysAgoDateString = (): string => {
    const date = new Date();
    date.setDate(date.getDate() - 2);
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
};


// --- Data Mapping Functions ---
const mapApiTubeToNewsDataArticle = (articles: ApiTubeArticle[]): NewsDataArticle[] => {
    return articles.map(article => ({
        title: article.title, link: article.url, pubDate: article.published_at,
        source_id: article.source.name, image_url: article.image?.url || null,
        description: article.summary, content: article.content || article.summary,
    }));
};

const mapNewsApiToNewsDataArticle = (articles: NewsApiArticle[]): NewsDataArticle[] => {
    return articles.map(article => ({
        title: article.title, link: article.url, pubDate: article.publishedAt,
        source_id: article.source.name, image_url: article.urlToImage,
        description: article.description, content: article.content || article.description,
    }));
};


// --- Fetching Logic for Each Service using a more reliable proxy and headers ---

const fetchFromApiTube = async (categoryType: string): Promise<NewsDataArticle[]> => {
  const PROXY_PREFIX = 'https://corsproxy.io/?';
  const BASE_URL = 'https://api.apitube.io/v1/news/';
  let queryParams = '';
  const twoDaysAgo = getTwoDaysAgoDateString();
  const commonParams = `limit=10&language.code=en&published_at.after=${twoDaysAgo}`;

  switch (categoryType) {
    case 'bangladesh': queryParams = `everything?countries=BD&${commonParams}`; break;
    case 'world': queryParams = `everything?q=world%20news&${commonParams}`; break;
    case 'geopolitics': queryParams = `everything?q=geopolitics%20OR%20international%20relations&${commonParams}`; break;
    default: return [];
  }
  
  const encodedTargetUrl = encodeURIComponent(`${BASE_URL}${queryParams}`);
  const finalUrl = `${PROXY_PREFIX}${encodedTargetUrl}`;
  
  try {
    const response = await fetch(finalUrl, {
      headers: { 'X-API-Key': APITUBE_API_KEY },
    });

    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }

    const apiData = await response.json();
    
    if (!apiData || !Array.isArray(apiData.data)) {
        if (apiData.errors) {
            throw new Error(`APITube API Error: ${apiData.errors[0]?.message || 'Unknown error'}`);
        }
        throw new Error('Unexpected format in APITube response.');
    }
    return mapApiTubeToNewsDataArticle(apiData.data);
  } catch (error) {
    console.error(`APITube request for '${categoryType}' failed:`, error);
    return []; // Return empty array on failure
  }
};

const fetchFromNewsApi = async (categoryType: string): Promise<NewsDataArticle[]> => {
    const PROXY_PREFIX = 'https://corsproxy.io/?';
    const BASE_URL = 'https://newsapi.org/v2/everything';
    let q = '';
    const twoDaysAgo = getTwoDaysAgoDateString();

    switch (categoryType) {
        case 'bangladesh': q = 'Bangladesh'; break;
        case 'world': q = 'world'; break;
        case 'geopolitics': q = 'geopolitics OR "international relations"'; break;
        default: return [];
    }
    
    const queryParams = `q=${encodeURIComponent(q)}&language=en&pageSize=10&from=${twoDaysAgo}`;
    const encodedTargetUrl = encodeURIComponent(`${BASE_URL}?${queryParams}`);
    const finalUrl = `${PROXY_PREFIX}${encodedTargetUrl}`;

    try {
        const response = await fetch(finalUrl, {
            headers: { 'X-Api-Key': NEWSAPI_ORG_KEY },
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const apiData = await response.json();

        if (apiData.status !== 'ok') {
            throw new Error(`NewsAPI.org API Error: ${apiData.message}`);
        }
        
        if (!apiData || !Array.isArray(apiData.articles)) throw new Error('Unexpected format from NewsAPI.org.');
        return mapNewsApiToNewsDataArticle(apiData.articles);
    } catch (error) {
        console.error(`NewsAPI.org request for '${categoryType}' failed:`, error);
        return []; // Return empty array on failure
    }
};

/**
 * Fetches news from both APITube and NewsAPI for a list of categories, then
 * combines and deduplicates them into a single large list.
 * @param categoryTypes An array of categories to fetch.
 * @returns A promise that resolves with a large, combined array of unique news articles.
 */
export const fetchAllNewsFromSources = async (categoryTypes: string[]): Promise<NewsDataArticle[]> => {
    console.log("Starting to fetch news from all sources...");
    const promises: Promise<NewsDataArticle[]>[] = [];

    // Create all fetch promises to run in parallel
    for (const type of categoryTypes) {
        promises.push(fetchFromApiTube(type));
        promises.push(fetchFromNewsApi(type));
    }

    const results = await Promise.all(promises);
    
    // Flatten the array of arrays into a single array
    const allArticles = results.flat();
    
    console.log(`Fetched a total of ${allArticles.length} articles before deduplication.`);

    // Deduplicate articles based on the link to avoid sending the same story to the AI
    const uniqueArticlesMap = new Map<string, NewsDataArticle>();
    allArticles.forEach(article => {
        if (article.link && !uniqueArticlesMap.has(article.link)) {
            uniqueArticlesMap.set(article.link, article);
        }
    });

    const uniqueArticles = Array.from(uniqueArticlesMap.values());
    console.log(`Returning ${uniqueArticles.length} unique articles for analysis.`);
    
    return uniqueArticles;
};
