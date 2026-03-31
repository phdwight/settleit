import type { NextConfig } from "next";

const isGHPages = process.env.GITHUB_ACTIONS === 'true';
const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Singapore' }));
const pad = (n: number) => String(n).padStart(2, '0');
const buildVersion = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}GMT+8`;

const nextConfig: NextConfig = {
  output: 'export',
  basePath: isGHPages ? '/settleit' : '',
  assetPrefix: isGHPages ? '/settleit/' : undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: isGHPages ? '/settleit' : '',
    NEXT_PUBLIC_BUILD_VERSION: buildVersion,
  },
};

export default nextConfig;
