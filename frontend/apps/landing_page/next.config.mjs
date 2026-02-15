/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@skolist/ui", "@skolist/auth", "@skolist/utils"],
  images: {
    domains: ["firebasestorage.googleapis.com", "lh3.googleusercontent.com"],
  },
};

export default nextConfig;
