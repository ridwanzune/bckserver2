// Set a password to protect the app. 
// For cron jobs, you can pass it as a query parameter: ?action=start&password=YOUR_PASSWORD
// This has been removed for simplicity. If needed, re-implement the PasswordScreen component.
export const APP_PASSWORD = 'Dhakadispatch11@'; 

// API key for APITube.io (Primary News Source)
export const APITUBE_API_KEY = 'api_live_wC4Hy2HwWXt8vtmwfI0FPrP3kTix1pHiX68shxhzhS89erTfOAGH0AERrRG4';

// API key for NewsAPI.org (Fallback News Source)
export const NEWSAPI_ORG_KEY = '0766a80e4d474937a6a8b4f8055c8e3e';

// --- NEW: CLOUDINARY & WEBHOOK CONSTANTS ---
export const CLOUDINARY_CLOUD_NAME = 'dukaroz3u';
export const CLOUDINARY_API_KEY = '151158368369834';
// IMPORTANT: This upload preset must be created in your Cloudinary account
// and configured for unsigned uploads for this to work.
export const CLOUDINARY_UPLOAD_PRESET = 'Autoupload'; 
export const MAKE_WEBHOOK_URL = 'https://hook.eu2.make.com/mvsz33n18i6dl18xynls7ie9gnoxzghl';
export const MAKE_WEBHOOK_AUTH_TOKEN = 'xR@7!pZ2#qLd$Vm8^tYe&WgC*oUeXsKv';

// --- NEW: STATUS REPORTING WEBHOOK ---
// Create a new, separate webhook in Make.com for receiving status updates.
// This is critical for monitoring and debugging the cron job.
// Paste the new webhook URL here.
export const MAKE_STATUS_WEBHOOK_URL = 'https://hook.eu2.make.com/0ui64t2di3wvvg00fih0d32qp9i9jgme';

// --- NEW: FINAL BUNDLE WEBHOOK ---
// This webhook receives a single payload with all generated content at the end of the automation.
export const MAKE_FINAL_BUNDLE_WEBHOOK_URL = 'https://hook.eu2.make.com/iynaiqae3cig9urc9klykd3oj2tb9prq';


// --- NEW: NEWS CATEGORIES FOR BATCH PROCESSING ---
// Defines the 6 content pieces to be generated in each run.
// 'type' is used to determine which API endpoint to call.
export const NEWS_CATEGORIES = [
  { id: 'bd_trending_1', name: 'Bangladesh Trending 1', type: 'bangladesh' },
  { id: 'bd_trending_2', name: 'Bangladesh Trending 2', type: 'bangladesh' },
  { id: 'world_trending_1', name: 'World Trending 1', type: 'world' },
  { id: 'world_trending_2', name: 'World Trending 2', type: 'world' },
  { id: 'geopolitics_1', name: 'Geopolitics 1', type: 'geopolitics' },
  { id: 'geopolitics_2', name: 'Geopolitics 2', type: 'geopolitics' },
];

// The delay in milliseconds between fetching news for each category.
// No longer needed due to the new, more efficient architecture.
export const API_FETCH_DELAY_MS = 0;


// URL for the new logo image
export const LOGO_URL = 'https://res.cloudinary.com/dy80ftu9k/image/upload/v1753507647/scs_cqidjz.png';

// Text to be displayed on the bottom right of the image
export const BRAND_TEXT = 'Dhaka Dispatch';

// URL for the visual overlay
export const OVERLAY_IMAGE_URL = 'https://res.cloudinary.com/dy80ftu9k/image/upload/v1753644798/Untitled-1_hxkjvt.png';