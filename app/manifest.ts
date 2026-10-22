import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Lon Shan | Full-Stack Developer',
    short_name: 'Lon Shan',
    description:
      'The portfolio of Lon Shan, a full-stack developer building and maintaining production web and mobile applications.',
    start_url: '/',
    display: 'standalone',
    background_color: '#101016',
    theme_color: '#101016',
    lang: 'en-US',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
