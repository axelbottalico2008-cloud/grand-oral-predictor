'use client'

import { useRouter } from 'next/navigation'

export default function RefreshButton() {
  const router = useRouter()
  return (
    <button
      onClick={() => router.refresh()}
      className="w-full border border-surface-border bg-surface-raised hover:bg-surface-high text-ink-300 font-display font-bold text-sm rounded-xl py-3.5 px-5 transition-all duration-200 flex items-center justify-center gap-2"
    >
      Actualiser les probabilites
    </button>
  )
}