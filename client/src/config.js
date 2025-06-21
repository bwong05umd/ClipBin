// Configuration for the application
export const config = {
  // API URL - this should be set in Vercel environment variables
  API_BASE_URL: import.meta.env.VITE_API_URL || 'https://my-render-backend.onrender.com',
  
  // Frontend URL for generating share links
  FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || 'https://clip-bin.vercel.app',
  
  // Environment
  NODE_ENV: import.meta.env.MODE || 'development',
  
  // Debug mode
  DEBUG: import.meta.env.MODE === 'development'
};

// Validate required configuration
if (!config.API_BASE_URL) {
  console.error('VITE_API_URL environment variable is not set');
}

export default config; 