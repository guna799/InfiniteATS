import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { TenantProvider } from '@/context/TenantContext';
import QueryProvider from '@/providers/QueryProvider';
import AppLayout from '@/components/layout/AppLayout';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'InfiniteCareers | Enterprise ATS & Recruitment SaaS Platform',
  description: 'From First Application to First Day — One Intelligent Hiring Platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-slate-50 text-slate-900`}>
        <QueryProvider>
          <TenantProvider>
            <AppLayout>{children}</AppLayout>
          </TenantProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
