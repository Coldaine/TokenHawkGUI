import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'NVIDIA DEFT Autonomous Skill Architecture',
  description: 'Cinematic 3D interactive showcase of NVIDIA\'s DEFT autonomous skill runtime, disk-backed state machine, cryptographic commit gates, and progressive disclosure cards.',
  openGraph: {
    title: 'NVIDIA DEFT Autonomous Skill Architecture',
    description: 'Cinematic 3D interactive showcase of NVIDIA\'s DEFT autonomous skill runtime, disk-backed state machine, cryptographic commit gates, and progressive disclosure cards.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NVIDIA DEFT Autonomous Skill Architecture',
    description: 'Cinematic 3D interactive showcase of NVIDIA\'s DEFT autonomous skill runtime, disk-backed state machine, cryptographic commit gates, and progressive disclosure cards.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
