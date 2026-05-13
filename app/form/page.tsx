'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SPECIALITES = [
  'Mathématiques',
  'Physique-Chimie',
  'SVT',
  'NSI',
  'SES',
  'Histoire-Géographie',
  'HGGSP',
  'LLCE Anglais',
  'LLCE Espagnol',
  'LLCE Allemand',
  'HLP',
  'Arts',
  'EPS',
  'Philosophie',
  'Biologie-Écologie',
  'Sciences de l\'ingénieur',
  'Autre',
]

type FormData = {
  lycee: string
  classe: string
  spe1: string
  spe2: string
  commission: string
  date_passage: string
  heure_passage: string
}

export default function FormPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>({
    lycee: '',
    classe: '',
    spe1: '',
    spe2: '',
    commission: '',
    date_passage: '',
    heure_passage: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const isValid =
    form.lycee.trim() &&
    form.spe1 &&
    form.spe2 &&
    form.spe1 !== form.spe2 &&
    form.commission.trim() &&
    form.date_passage &&
    form.heure_passage

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || loading) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur serveur')
      }

      const { id } = await res.json()

      // Sauvegarde locale pour retrouver ses propres résultats
      const stored = JSON.parse(localStorage.getItem('gop_entries') || '[]')
      stored.push({ id, date: new Date().toISOString(), ...form })
      localStorage.setItem('gop_entries', JSON.stringify(stored.slice(-10)))

      router.push(`/result/${id}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(message)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen grid-bg flex flex-col items-center px-4 py-8">
      {/* Header */}
      <div className="w-full max-w-lg mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-ink-400 hover:text-ink-100 transition-colors text-sm font-body">
          ← Retour
        </Link>
      </div>

      <div className="w-full max-w-lg">
        {/* Title */}
        <div data-animate="1" className="mb-8">
          <h2 className="font-display font-800 text-3xl text-ink-50">
            Ton profil
          </h2>
          <p className="font-body text-sm text-ink-400 mt-1">
            Toutes les données sont anonymes. Aucun compte requis.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Lycée */}
          <div data-animate="1">
            <label className="gop-label">Lycée *</label>
            <input
              name="lycee"
              value={form.lycee}
              onChange={handleChange}
              placeholder="Ex: Lycée Henri IV"
              className="gop-input"
              required
            />
          </div>

          {/* Classe */}
          <div data-animate="2">
            <label className="gop-label">Classe <span className="text-ink-500 normal-case tracking-normal">(optionnel)</span></label>
            <input
              name="classe"
              value={form.classe}
              onChange={handleChange}
              placeholder="Ex: T°G1"
              className="gop-input"
            />
          </div>

          {/* Spécialités */}
          <div data-animate="3" className="grid grid-cols-2 gap-3">
            <div>
              <label className="gop-label">Spécialité 1 *</label>
              <select
                name="spe1"
                value={form.spe1}
                onChange={handleChange}
                className="gop-input"
                required
              >
                <option value="">Choisir…</option>
                {SPECIALITES.map((s) => (
                  <option key={s} value={s} disabled={s === form.spe2}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="gop-label">Spécialité 2 *</label>
              <select
                name="spe2"
                value={form.spe2}
                onChange={handleChange}
                className="gop-input"
                required
              >
                <option value="">Choisir…</option>
                {SPECIALITES.map((s) => (
                  <option key={s} value={s} disabled={s === form.spe1}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {form.spe1 && form.spe2 && form.spe1 === form.spe2 && (
            <p className="text-xs text-red-400 -mt-2">Les deux spécialités doivent être différentes.</p>
          )}

          {/* Commission */}
          <div data-animate="4">
            <label className="gop-label">Numéro de commission *</label>
            <input
              name="commission"
              value={form.commission}
              onChange={handleChange}
              placeholder="Ex: 3 ou Commission B"
              className="gop-input"
              required
            />
          </div>

          {/* Date & Heure */}
          <div data-animate="5" className="grid grid-cols-2 gap-3">
            <div>
              <label className="gop-label">Date de passage *</label>
              <input
                type="date"
                name="date_passage"
                value={form.date_passage}
                onChange={handleChange}
                className="gop-input"
                required
              />
            </div>
            <div>
              <label className="gop-label">Heure de passage *</label>
              <input
                type="time"
                name="heure_passage"
                value={form.heure_passage}
                onChange={handleChange}
                className="gop-input"
                required
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <div data-animate="6" className="pt-2">
            <button
              type="submit"
              className="gop-btn font-display font-bold text-ink"
              disabled={!isValid || loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Analyse en cours…
                </span>
              ) : (
                'Obtenir ma prédiction →'
              )}
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-ink-500 mt-6 font-body">
          Aucun compte • Données anonymes • Outil sans valeur officielle
        </p>
      </div>
    </main>
  )
}
