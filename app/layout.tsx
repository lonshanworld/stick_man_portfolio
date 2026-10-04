import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import './portfolio.css';
import './identity.css';

const SITE_URL = 'https://lonshan.com';
const SITE_TITLE = 'Lon Shan | Full-Stack & Creative Software Engineer';
const SITE_DESCRIPTION =
  'Lon Shan is a Bangkok-based full-stack and mobile software engineer building high-performance Next.js, Flutter, AI, and 3D WebGL products.';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#101016',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: '%s | Lon Shan',
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'Lon Shan',
    'Software Engineer',
    'Full Stack Developer',
    'Flutter',
    'Next.js',
    'Three.js',
    'WebGL',
    'React',
    '3D Portfolio',
    'Creative Developer',
  ],
  authors: [{ name: 'Lon Shan' }],
  creator: 'Lon Shan',
  publisher: 'Lon Shan',
  applicationName: 'Lon Shan Portfolio',
  category: 'technology',
  classification: 'Portfolio website',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'Lon Shan Portfolio',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Lon Shan — Full-Stack and Creative Software Engineer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ProfilePage',
      '@id': `${SITE_URL}/#profile`,
      url: SITE_URL,
      name: SITE_TITLE,
      isPartOf: { '@id': `${SITE_URL}/#website` },
      about: { '@id': `${SITE_URL}/#person` },
      mainEntity: { '@id': `${SITE_URL}/#person` },
    },
    {
      '@type': 'Person',
      '@id': `${SITE_URL}/#person`,
      name: 'Lon Shan',
      url: SITE_URL,
      jobTitle: 'Full-Stack & Creative Software Engineer',
      description: SITE_DESCRIPTION,
      email: 'mailto:lonshan3010@gmail.com',
      image: `${SITE_URL}/opengraph-image`,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Bangkok',
        addressCountry: 'TH',
      },
      sameAs: [
        'https://linkedin.com/in/lon-shan-336699db',
        'https://github.com/lonshanworld',
      ],
      knowsAbout: [
        'Full-stack software engineering',
        'Next.js',
        'React',
        'TypeScript',
        'Flutter',
        'Three.js and WebGL',
        'AI integrations',
        'Cloud architecture',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'Lon Shan Portfolio',
      description: SITE_DESCRIPTION,
      publisher: { '@id': `${SITE_URL}/#person` },
      inLanguage: 'en-US',
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t;try{t=localStorage.getItem('portfolio-theme')}catch(e){}if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;})()` }} />
      </head>
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
          }}
        />
        {children}
      </body>
    </html>
  );
}
