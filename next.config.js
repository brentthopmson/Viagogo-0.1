/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: async () => {
    return [
      {
        source: "/api/:path*",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://127.0.0.1:8000/api/:path*"
            : "/api/",
      },
      {
        source: "/docs",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://127.0.0.1:8000/docs"
            : "/api/docs",
      },
      {
        source: "/openapi.json",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://127.0.0.1:8000/openapi.json"
            : "/api/openapi.json",
      },
    ];
  },
  images: {
    domains: [
      'cdn.debounce.io',
      'snworksceo.imgix.net',
      'drive.google.com',
      'lh3.googleusercontent.com', // For Google Drive images
      'placehold.co',
      'i.imgur.com',
      'images.unsplash.com',
      'storage.googleapis.com',
      'res.cloudinary.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      }
    ],
    unoptimized: true // This allows any external image to be used without optimization
  },
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium-min'],
  },
  webpack(config, { isServer }) {
    if (isServer) {
      // Handle modern JavaScript features for Puppeteer
      config.module.rules.push({
        test: /\.js$/,
        include: /node_modules\/puppeteer-core/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      });
    }
    return config;
  },
};

module.exports = nextConfig;
