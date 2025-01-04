/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ✅ Disable ESLint during builds (if not using ESLint actively)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
