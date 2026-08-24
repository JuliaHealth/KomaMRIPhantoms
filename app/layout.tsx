import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://juliahealth.org/KomaMRIPhantoms/'),
  title: 'KomaMRI Phantom Library',
  description: 'Community-contributed digital phantoms tested with KomaMRI and archived on Zenodo.',
  openGraph: {
    title: 'KomaMRI Phantom Library',
    description: 'Find open digital phantoms for reproducible MRI simulation.',
    type: 'website',
    images: [{ url: 'https://juliahealth.org/KomaMRIPhantoms/og.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KomaMRI Phantom Library',
    description: 'Find open digital phantoms for reproducible MRI simulation.',
    images: ['https://juliahealth.org/KomaMRIPhantoms/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
