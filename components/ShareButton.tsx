'use client'

import { useState } from 'react'

interface Props {
  url: string
}

export default function ShareButton({ url }: Props) {
  const [copied, setCopied] = useState(false)

  const fullUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}${url}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // fallback
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mon résultat Grand Oral Predictor',
          text: 'Découvre ma prédiction pour le Grand Oral !',
          url: fullUrl,
        })
      } catch {
        handleCopy()
      }
    } else {
      handleCopy()
    }
  }

  return (
    <button
      onClick={handleShare}
      className="w-full border border-surface-border bg-surface-raised hover:bg-surface-high
                 text-ink-100 font-display font-600 text-sm rounded-xl py-3.5 px-5
                 transition-all duration-200 flex items-center justify-center gap-2"
    >
      {copied ? (
        <>
          <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Lien copié !
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          Partager mon résultat
        </>
      )}
    </button>
  )
}
