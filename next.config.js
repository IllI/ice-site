// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: false, // Disable strict mode to prevent double mounting
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  output: 'standalone', // This ensures all necessary dependencies are included
  poweredByHeader: false,
  generateEtags: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  serverExternalPackages: ['leaflet', 'leaflet-geosearch'],
  images: {
    domains: ['tile.openstreetmap.org'],
  }
};

module.exports = nextConfig;
