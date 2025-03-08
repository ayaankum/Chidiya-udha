"use client"

import type { Metadata } from 'next'
import './globals.css'
import { useEffect } from 'react'

const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.dev',
}

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
      <body>{children}</body>
    </html>
  )
}
