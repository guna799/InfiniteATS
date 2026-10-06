/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: ['images.unsplash.com', 'avatar.vercel.sh', 'ui-avatars.com'],
  },
};

module.exports = nextConfig;
