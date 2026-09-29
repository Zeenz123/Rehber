import type { Metadata } from 'next';
import './globals.css';
import ClientLayout from './ClientLayout';

export const metadata: Metadata = {
  title: 'Rehber Educator Portal',
  description: 'AI Personalized Learning & Offline Sync Supervision Platform for Rural Schools',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
