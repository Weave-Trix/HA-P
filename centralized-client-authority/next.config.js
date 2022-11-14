/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['ipfs.io', 'thumbs.gfycat.com', 'mir-s3-cdn-cf.behance.net', 'cdn.dribbble.com']
  }
}

module.exports = nextConfig
