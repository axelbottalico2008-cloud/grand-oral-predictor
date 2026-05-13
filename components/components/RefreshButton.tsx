'use client'

import { useRouter } from 'next/navigation'

export default function RefreshButton() {
  const router = useRouter()

  const handleReset = () => {
    localStorage.removeItem('gop_result_id')
    router.push('/form')
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => router.refresh()}
        className="w-full border border-surface-border bg-surface-raised hover:bg-surface-high text-ink-300 font-display font-bold text-sm rounded-xl py-3.5 px-5 transition-all duration-200 flex items-center justify-center gap-2"
      >
        🔄 Actualiser les probabilites
      </button>
      <button
        onClick={handleReset}
        className="w-full border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-display font-bold text-sm rounded-xl py-3.5 px-5 transition-all duration-200 flex items-center justify-center gap-2"
      >
        🗑️ Refaire ma prediction
      </button>
    </div>
  )
}