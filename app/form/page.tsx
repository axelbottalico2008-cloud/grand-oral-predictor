'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SPECIALITES = [
  'Mathematiques',
  'Physique-Chimie',
  'SVT',
  'NSI',
  'SES',
  'HGGSP',
  'LLCE Anglais',
  'LLCE Espagnol',
  'LLCE Allemand',
  'HLP',
  'Arts',
  'Sciences de l ingenieur',
  'Autre',
]

const CLASSES = [
  'TG1','TG2','TG3','TG4','TG5',
  'TG6','TG7','TG8','TG9','TG10',
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

export const revalidate = 30
export default function FormPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>({
    lycee: '', classe: '', spe1: '', spe2: '',
    commission: '', date_passage: '', heure_passage: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const existingId = localStorage.getItem('gop_result_id')
    if (existingId) {
      router.replace(`/result/${existingId}`)
    }
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const isValid =
    form.lycee.trim() && form.spe1 && form.spe2 &&
    form.spe1 !== form.spe2 && form.commission.trim() &&
    form.date_passage && form.heure_passage

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
      const data = await res.json()
      if (res.status === 409 && data.error === 'already_submitted') {
        localStorage.setItem('gop_result_id', data.id)
        router.push(`/result/${data.id}`)
        return
      }
      if (!res.ok) throw new Error(data.error || 'Erreur serveur')
      localStorage.setItem('gop_result_id', data.id)
      router.push(`/result/${data.id}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(message)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen grid-bg flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-lg mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-ink-400 hover:text-ink-100 transition-colors text-sm font-body">
          &larr; Retour
        </Link>
      </div>
      <div className="w-full max-w-lg">
        <div data-animate="1" className="mb-8">
          <h2 className="font-display font-bold text-3xl text-ink-50">Ton profil</h2>
          <p className="font-body text-sm text-ink-400 mt-1">Donnees anonymes · aucun compte requis</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div data-animate="1">
            <label className="gop-label">Lycee *</label>
            <select name="lycee" value={form.lycee} onChange={handleChange} className="gop-input" required>
              <option value="">Choisir un lycee...</option>
              <option value="Sainte-Anne">Sainte-Anne</option>
            </select>
          </div>
          <div data-animate="2">
            <label className="gop-label">Classe <span className="text-ink-500 normal-case tracking-normal">(optionnel)</span></label>
            <select name="classe" value={form.classe} onChange={handleChange} className="gop-input">
              <option value="">Choisir une classe...</option>
              {CLASSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div data-animate="3" className="grid grid-cols-2 gap-3">
            <div>
              <label className="gop-label">Specialite 1 *</label>
              <select name="spe1" value={form.spe1} onChange={handleChange} className="gop-input" required>
                <option value="">Choisir...</option>
                {SPECIALITES.map((s) => (
                  <option key={s} value={s} disabled={s === form.spe2}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="gop-label">Specialite 2 *</label>
              <select name="spe2" value={form.spe2} onChange={handleChange} className="gop-input" required>
                <option value="">Choisir...</option>
                {SPECIALITES.map((s) => (
                  <option key={s} value={s} disabled={s === form.spe1}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div data-animate="4">
            <label className="gop-label">Numero de commission *</label>
            <input name="commission" value={form.commission} onChange={handleChange} placeholder="Ex: 3 ou Commission B" className="gop-input" required />
          </div>
          <div data-animate="5" className="grid grid-cols-2 gap-3">
            <div>
              <label className="gop-label">Date de passage *</label>
              <input type="date" name="date_passage" value={form.date_passage} onChange={handleChange} className="gop-input" required />
            </div>
            <div>
              <label className="gop-label">Heure de passage *</label>
              <input type="time" name="heure_passage" value={form.heure_passage} onChange={handleChange} className="gop-input" required />
            </div>
          </div>
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">{error}</div>
          )}
          <div data-animate="6" className="pt-2">
            <button type="submit" className="gop-btn font-display font-bold text-ink" disabled={!isValid || loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Analyse en cours...
                </span>
              ) : 'Obtenir ma prediction →'}
            </button>
          </div>
        </form>
        <p className="text-center text-xs text-ink-500 mt-6 font-body">
          Aucun compte · Donnees anonymes · Outil sans valeur officielle
        </p>
      </div>
    </main>
  )
}