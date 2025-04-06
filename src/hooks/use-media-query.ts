"use client"

import { useState, useEffect } from "react"

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)

    // İlk yükleme için değeri ayarla
    if (media.matches !== matches) {
      setMatches(media.matches)
    }

    // Değişiklikleri dinle
    const listener = () => {
      setMatches(media.matches)
    }

    // Modern API kullanımı
    media.addEventListener("change", listener)

    // Temizleme
    return () => {
      media.removeEventListener("change", listener)
    }
  }, [matches, query])

  return matches
}

