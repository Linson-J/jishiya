import { Libre_Baskerville, Inter } from 'next/font/google';
import './globals.css';

const serif = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const TITLE = 'Dr. Jishya — AI + Digital Marketing Workshop';
const DESCRIPTION = 'PhD-led live training to get leads, build income and grow your brand online.';

export const metadata = {
  metadataBase: new URL('https://jishya.com'),
  title: TITLE,
  description: DESCRIPTION,
  keywords: ['digital marketing', 'SEO', 'personal brand', 'AI marketing', 'workshop', 'Tamil'],
  alternates: {
    canonical: 'https://jishya.com',
  },
  openGraph: {
    title: 'Dr. Jishya — AI + Digital Marketing',
    description: DESCRIPTION,
    url: 'https://jishya.com',
    siteName: 'Dr. Jishya',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Dr. Jishya — AI + Digital Marketing Workshop' }],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dr. Jishya — AI + Digital Marketing',
    description: DESCRIPTION,
    images: ['/og-image.jpg'],
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f8f6f1',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-IN">
      <body className={`${serif.variable} ${sans.variable} bg-paper font-sans text-ink antialiased`}>
        {/* Without JS the reveal animations must not hide content */}
        <noscript>
          <style>{`.reveal{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
