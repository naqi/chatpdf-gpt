/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true,
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack, nextRuntime }) => {
    config.resolve.alias.canvas = false
    config.resolve.alias.encoding = false
    config.experiments = { ...config.experiments, topLevelAwait: true }
    // Avoid AWS SDK Node.js require issue
    if (isServer && nextRuntime === "nodejs")
      config.plugins.push(
        new webpack.IgnorePlugin({ resourceRegExp: /^aws-crt$/ })
      );
    return config
  },
}

export default nextConfig
