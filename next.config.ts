import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "ofood-media-961470857140.s3.ap-south-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.ap-south-1.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
