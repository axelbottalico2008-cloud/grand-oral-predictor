'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function RefreshButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleReset = async () => {
    setLoading(true)
    const oldId = localStorage.getItem('gop_result_id')
    await fetch('/api/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: oldId }),
    })
    localStorage.removeItem('gop_result_id')
    router.push('/form')
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => router.refresh()}
        className="w-full border border-surface-border bg-surface-raised hover:bg-surface-high text-ink-300 font-display font-bold text-sm rounded-xl py-3.5 px-5 transition-all duration-200 flex items-center justify-center gap-2"
      >
        Actualiser les probabilites
      </button>
      <button
        onClick={handleReset}
        disabled={loading}
        className="w-full border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-display font-bold text-sm rounded-xl py-3.5 px-5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? 'Suppression...' : 'Refaire ma prediction'}
      </button>
    </div>
  )
}