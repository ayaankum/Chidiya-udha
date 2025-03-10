"use client"

import './globals.css'
import { useEffect } from 'react'
import Footer from '@/components/footer'
import { developerInfo } from '@/lib/config'

// metadata is now a variable, not an export since we're using client component
const metadata = {
  title: 'Chidiya Udh Game',
  description: 'A multiplayer flying objects game',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  useEffect(() => {
    // Clear localStorage data when the user closes the tab/window
    const handleBeforeUnload = () => {
      // Only clear if there's player data stored
      if (localStorage.getItem("playerName") || localStorage.getItem("playerId")) {
        localStorage.removeItem("playerName");
        localStorage.removeItem("playerId");
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <html lang="en">
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
      </head>
      <body className="flex flex-col min-h-screen">
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  )
}
