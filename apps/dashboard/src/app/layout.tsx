import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'Smart Pickup — لوحة التحكم',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-gray-50 font-sans antialiased">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
