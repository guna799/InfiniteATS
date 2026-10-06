/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Local development: rewrite only if an explicit BACKEND_URL is provided;
  // otherwise, Next.js built-in API routes handle the requests directly.
  async rewrites() {
    const backend = process.env.BACKEND_URL;
    if (backend) {
      return [
        { source: '/api/v1/:path*', destination: `${backend}/api/v1/:path*` },
        { source: '/ws/:path*', destination: `${backend}/ws/:path*` },
      ];
    }
    return [];
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
