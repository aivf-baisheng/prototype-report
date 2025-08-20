/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic Next.js configuration
  reactStrictMode: true,
  // Enable experimental features for better compatibility
  experimental: {
    appDir: false,
  },
  // Configure webpack to handle src directory
  webpack: (config, { isServer }) => {
    // Add src directory to module resolution
    config.resolve.modules.push('src')
    return config
  }
}

export default nextConfig
