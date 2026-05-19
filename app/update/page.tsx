'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SPECIALITES = [
  'Mathematiques', 'Physique-Chimie', 'SVT', 'NSI', 'SES',
  'HGGSP', 'LLCE Anglais', 'LLCE Espagnol', 'LLCE Allemand',
  'HLP', 'Arts', 'Sciences de l ingenieur', 'Autre',
]

export default function UpdatePage() {
  const router = useRouter()
  const [spe, setSpe] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [id, setId] = useState<string | null>(null)

  useEffect(() => {
    const storedId = localStorage.getItem('gop_result_id')
    if (!storedId) {
      router.replace('/form')
      return
    }
    setId(storedId)
  }, [router])

  const handleSubmit = async () => {
    if (!spe || !id) return
    setLoading(true)
    await fetch('/api/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, spe_passee: spe }),
    })
    setLoading(false)
    setDone(true)
  }

  if (done) {
    return (
      <main className="min-h-screen grid-bg flex flex-col items-center justify-center px-4">
        <div className="gop-card max-w-sm w-full text-center space-y-4">
          <p className="text-4xl">✅</p>
          <h1 className="font-display font-bold text-2xl text-ink-50">Merci !</h1>
          <p className="font-body text-sm text-ink-400">
            Ta spécialité de passage a été enregistrée. Tu aides les prochains élèves à mieux prédire !
          </p>
          <Link href="/stats" className="block text-accent text-sm hover:underline">
            Voir les stats des jurys →
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen grid-bg flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="font-display font-bold text-3xl text-ink-50">
            Ton oral est passé ?
          </h1>
          <p className="font-body text-sm text-ink-400 mt-1">
            Indique sur quelle spécialité tu as réellement été interrogé. Cela améliore les prédictions pour tout le monde.
          </p>
        </div>

        <div className="gop-card space-y-4">
          <div>
            <label className="gop-label">Spécialité interrogée *</label>
            <select
              value={spe}
              onChange={e => setSpe(e.target.value)}
              className="gop-input"
            >
              <option value="">Choisir...</option>
              {SPECIALITES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value="Jury annexe">Jury annexe (hors spécialité)</option>
            </select>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!spe || loading}
            className="gop-btn font-display font-bold text-ink"
          >
            {loading ? 'Enregistrement...' : 'Confirmer →'}
          </button>
        </div>

        <p className="text-xs text-ink-500 text-center font-body">
          Données anonymes · sans valeur officielle
        </p>
      </div>
    </main>
  )
}