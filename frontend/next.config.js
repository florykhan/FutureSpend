/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Proxy /api/* requests to the FastAPI backend during development
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
