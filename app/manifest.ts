import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'My PWA',
    short_name: 'MyPWA',
    description: 'A Progressive Web App built with Next.js',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      { src: '/icon-192x192.jpg', sizes: '192x192', type: 'image/jpg' },
      { src: '/icon-512x512.jpg', sizes: '512x512', type: 'image/jpg' },
    ],
  }
}