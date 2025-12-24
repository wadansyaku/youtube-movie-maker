/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable server actions
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
    },
    // Allow local file serving for assets
    images: {
        remotePatterns: [],
    },
};

export default nextConfig;
