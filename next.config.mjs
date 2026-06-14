import path from "node:path";

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  turbopack: {
    root: path.resolve("."),
  },
  experimental: {
    // Default is 1MB, which silently rejects image uploads larger than that
    // before the action's own size check runs. Keep this above MAX_IMAGE_BYTES.
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
