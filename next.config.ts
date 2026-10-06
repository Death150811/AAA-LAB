import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Dev-сервер Next 16 блокирует свои служебные ресурсы для любого origin, кроме localhost: без этого на 127.0.0.1,
  // в локальной сети или через проброс портов IDE не запускается весь клиентский JS (поиск, тема, «Заметка дня»).
  allowedDevOrigins: ["127.0.0.1", "192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
