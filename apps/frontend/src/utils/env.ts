// Utility to read environment variables from either window.env (production) or import.meta.env (development)

interface WindowWithEnv extends Window {
  env?: Record<string, string>
}

declare const window: WindowWithEnv

export function getEnv(key: string, defaultValue?: string): string {
  // In production, read from window.env (injected by Docker)
  if (window.env && window.env[key]) {
    return window.env[key]
  }
  
  // In development, read from Vite's import.meta.env (.env.local file)
  if (import.meta.env[key]) {
    return import.meta.env[key]
  }
  
  // Return default value or empty string
  return defaultValue || ''
}

// Convenience getters for common env vars
export const env = {
  BACKEND_URL: getEnv('BACKEND_URL', 'http://localhost:3010'),
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  IS_PRODUCTION: getEnv('NODE_ENV') === 'production',
}