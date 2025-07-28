interface ImportMetaEnv {
  readonly VITE_GEMINI_API: string;
  readonly VITE_IMAGEN_API_KEY: string;
  // Add any other environment variables your app uses
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
