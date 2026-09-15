import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Lon Shan | Full-Stack & Creative Software Engineer',
    short_name: 'Lon Shan',
    description:
      'The portfolio of Lon Shan, a full-stack and mobile software engineer building interactive digital products.',
    start_url: '/',
    display: 'standalone',
    background_color: '#050711',
    theme_color: '#050711',
    lang: 'en-US',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
