/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Bu satırı kaldırıyoruz - database kullanan uygulamalar static olamaz
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['@neondatabase/serverless'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // assetPrefix kaldırıldı çünkü static export yok
};

export default nextConfig;
