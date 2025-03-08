"use client"

import { useEffect } from 'react'

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
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

  return <>{children}</>;
}
