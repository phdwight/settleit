import type { NextConfig } from "next";

const isGHPages = process.env.GITHUB_ACTIONS === 'true';
const now = new Date();
const buildVersion = `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}.${now.getTime()}`;

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
