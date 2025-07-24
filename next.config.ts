import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
	// Experimental features
	//    reactStrictMode: true,
	//    swcMinify: true,
	//    experimental: {
	//       appDir: true,
	//       serverComponentsExternalPackages: ['@prisma/client'],
	//       serverActions: true,
	//    },
	// transpilePackages: ['@radix-ui/react-separator', '@radix-ui/react-tooltip'],
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: '**',
				// port: '',
				// pathname: '/**',
			},
			{
				protocol: 'http',
				hostname: '**',
			},
			// {
			//    protocol: 'https',
			//    hostname: 'cdn.pixabay.com',
			//    port: '',
			//    pathname: '/**',
			// },
      ],
      
	},
};

export default nextConfig;
