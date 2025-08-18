/**
 * Next.js Performance Configuration
 * Emergency Optimization by Worker3
 * Maximum performance settings
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,
  
  // SWC minification for better performance
  swcMinify: true,
  
  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
    
    // React Remove Properties
    reactRemoveProperties: process.env.NODE_ENV === 'production' ? {
      properties: ['^data-test']
    } : false,
    
    // Emotion support if needed
    emotion: true,
    
    // Styled Components support
    styledComponents: {
      displayName: process.env.NODE_ENV !== 'production',
      ssr: true,
      fileName: false
    }
  },
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },
  
  // Webpack configuration
  webpack: (config, { dev, isServer, webpack }) => {
    // Production optimizations
    if (!dev) {
      // Enable tree shaking
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // Split chunks
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          
          // Framework chunk
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true
          },
          
          // Library chunk
          lib: {
            test(module) {
              return module.size() > 160000 &&
                /node_modules[\\/]/.test(module.identifier());
            },
            name(module) {
              const hash = crypto.createHash('sha1');
              hash.update(module.identifier());
              return hash.digest('hex').substring(0, 8);
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true
          },
          
          // Commons chunk
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
            priority: 20
          },
          
          // Shared chunk
          shared: {
            name(module, chunks) {
              return crypto
                .createHash('sha1')
                .update(chunks.reduce((acc, chunk) => acc + chunk.name, ''))
                .digest('hex') + (isServer ? '-server' : '');
            },
            priority: 10,
            minChunks: 2,
            reuseExistingChunk: true
          }
        },
        
        // Max requests
        maxAsyncRequests: 25,
        maxInitialRequests: 20
      };
      
      // Minimize
      config.optimization.minimize = true;
      
      // Module concatenation
      config.optimization.concatenateModules = true;
    }
    
    // Bundle analyzer
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: isServer
            ? '../analyze/server.html'
            : './analyze/client.html'
        })
      );
    }
    
    // Ignore certain modules
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/
      })
    );
    
    // Alias for faster builds
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname,
      'lodash': 'lodash-es'
    };
    
    return config;
  },
  
  // Experimental features
  experimental: {
    // Optimize CSS
    optimizeCss: true,
    
    // Modern JS for modern browsers
    legacyBrowsers: false,
    
    // Optimize package imports
    optimizePackageImports: [
      'lodash',
      'date-fns',
      '@mui/material',
      '@mui/icons-material',
      'd3',
      'react-icons'
    ],
    
    // Server Components
    serverComponents: true,
    
    // Incremental Static Regeneration
    isrMemoryCacheSize: 0,
    
    // Web Vitals attribution
    webVitalsAttribution: ['CLS', 'LCP', 'FCP', 'FID', 'TTFB'],
    
    // Partial Prerendering
    ppr: true
  },
  
  // Headers for caching and security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate'
          }
        ]
      }
    ];
  },
  
  // Redirects
  async redirects() {
    return [];
  },
  
  // Rewrites
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        {
          source: '/api/:path*',
          destination: `${process.env.API_URL || 'http://localhost:3001'}/api/:path*`
        }
      ]
    };
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_WS_URL: process.env.WS_URL || 'ws://localhost:3001'
  },
  
  // Production settings
  productionBrowserSourceMaps: false,
  compress: true,
  generateEtags: true,
  poweredByHeader: false,
  
  // Output configuration
  output: 'standalone',
  distDir: '.next',
  
  // TypeScript
  typescript: {
    ignoreBuildErrors: false
  },
  
  // ESLint
  eslint: {
    ignoreDuringBuilds: false
  }
};

// Performance monitoring
if (process.env.NODE_ENV === 'production') {
  // Add performance monitoring
  nextConfig.experimental.instrumentationHook = true;
}

module.exports = nextConfig;