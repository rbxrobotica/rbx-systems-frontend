/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "eu2.contabostorage.com",
        pathname: "/rbx-content/**",
      },
    ],
  },
};

export default nextConfig;
