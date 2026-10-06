/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Local development: route /api/v1 and /ws to Spring backend (port 8082 for Antigravity)
  async rewrites() {
    const backend = process.env.BACKEND_URL || 'http://localhost:8082';
    return [
      { source: '/api/v1/:path*', destination: `${backend}/api/v1/:path*` },
      { source: '/ws/:path*', destination: `${backend}/ws/:path*` },
    ];
  },
  webpack: (config) => {
    // Optional dependency of `debug` (pulled in by sockjs-client); not needed in either bundle
    config.resolve.fallback = { ...config.resolve.fallback, 'supports-color': false };
    return config;
  },
  images: {
    domains: ['images.unsplash.com', 'avatar.vercel.sh', 'ui-avatars.com'],
  },
};

module.exports = nextConfig;
