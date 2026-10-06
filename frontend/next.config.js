/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Local development: the Spring API and its WebSocket endpoint are served same-origin through Next.
  // In Kubernetes the ingress routes /api/v1 and /ws to the backend before requests reach Next.
  async rewrites() {
    const backend = process.env.BACKEND_URL || 'http://localhost:8080';
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
