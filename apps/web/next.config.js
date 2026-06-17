/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@brandflow/core', '@brandflow/payments'],
}

module.exports = nextConfig