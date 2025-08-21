const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic Next.js configuration
  reactStrictMode: true,
  // Configure webpack to handle src directory and import alias
  webpack: (config, { isServer }) => {
    // Add src directory to module resolution
    config.resolve.modules.push('src')
    
    // Configure alias for @ imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(process.cwd(), 'src')
    }
    
    return config
  }
}

module.exports = nextConfig
