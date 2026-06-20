/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  async rewrites() {
    const backendBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendBase.replace(/\/$/, "")}/:path*`,
      },
    ];
  },
};

export default nextConfig;
