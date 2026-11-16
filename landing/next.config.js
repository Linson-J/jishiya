/** @type {import('next').NextConfig} */

// Allow next/image to optimise images served by the backend (/uploads/...).
// The host comes from NEXT_PUBLIC_API_URL, so it works for localhost and for
// the deployed Railway URL without code changes.
function backendPattern() {
  try {
    const u = new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');
    const pattern = {
      protocol: u.protocol.replace(':', ''),
      hostname: u.hostname,
      pathname: '/uploads/**',
    };
    if (u.port) pattern.port = u.port;
    return pattern;
  } catch (e) {
    return null;
  }
}

const remotePatterns = [
  backendPattern(),
  // Any Railway-generated domain (https://<service>.up.railway.app)
  { protocol: 'https', hostname: '**.up.railway.app', pathname: '/uploads/**' },
  // Images uploaded from the admin panel are stored in Vercel Blob.
  { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
].filter(Boolean);

const BACKEND = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
const ADMIN_DEV = (process.env.ADMIN_DEV_URL || 'http://localhost:5173').replace(/\/+$/, '');
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Vite redirects /admin-panel -> /admin-panel/ itself; don't fight it.
  skipTrailingSlashRedirect: true,
  // One origin for everything:
  //   /            -> landing page (this app)
  //   /admin-panel -> admin dashboard (Vite dev server in dev, static build in prod)
  //   /api, /uploads -> Express backend (and so the MySQL database behind it)
  async rewrites() {
    const api = [
      { source: '/api/:path*', destination: `${BACKEND}/api/:path*` },
      { source: '/uploads/:path*', destination: `${BACKEND}/uploads/:path*` },
    ];
    if (!isProd) {
      return {
        beforeFiles: [
          { source: '/admin-panel', destination: `${ADMIN_DEV}/admin-panel/` },
          { source: '/admin-panel/:path*', destination: `${ADMIN_DEV}/admin-panel/:path*` },
          ...api,
        ],
      };
    }
    // Production: `npm run build` in admin/ writes the SPA into landing/public/admin-panel.
    // Real files are served first; any other /admin-panel/* path falls back to the SPA shell.
    return {
      beforeFiles: api,
      fallback: [{ source: '/admin-panel/:path*', destination: '/admin-panel/index.html' }],
    };
  },
  images: {
    remotePatterns,
    formats: ['image/avif', 'image/webp'],
  },
};

module.exports = nextConfig;
