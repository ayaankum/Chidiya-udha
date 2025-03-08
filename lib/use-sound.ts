"use client"

import { useEffect, useRef } from "react"

export function useSound(url: string) {
  const audio = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audio.current = new Audio(url)
    return () => {
      if (audio.current) {
        audio.current.pause()
        audio.current = null
      }
    }
  }, [url])

  const play = () => {
    if (audio.current) {
      audio.current.currentTime = 0
      audio.current.play().catch((e) => console.error("Error playing sound:", e))
    }
  }

  return { play }
}

