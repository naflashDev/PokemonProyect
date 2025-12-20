/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next 16 no longer accepts experimental.appDir key — appDir is the default App Router.
  // Keep this config minimal to avoid startup warnings.
  // experimental: { appDir: true }
}

module.exports = nextConfig
