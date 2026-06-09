import type { Entry } from './supabase'

export type PredictionResult = {
  topSpecialite: string
  confidence: number
  breakdown: { specialite: string; score: number; pct: number }[]
  totalSimilarProfiles: number
  hasRealData: boolean
}

type NewEntry = {
  lycee: string
  classe: string
  spe1: string
  spe2: string
  commission: string
  heure_passage: string
  date_passage: string
}

function sameDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10)
}

function sameTimeSlot(a: string, b: string): boolean {
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + (m || 0)
  }
  return Math.abs(toMin(a) - toMin(b)) <= 60
}

function commonSpes(target: NewEntry, other: Entry): string[] {
  const t = [target.spe1.trim().toLowerCase(), target.spe2.trim().toLowerCase()]
  const o = [other.spe1.trim().toLowerCase(), other.spe2.trim().toLowerCase()]
  return t.filter(s => o.includes(s))
}

function displayName(normalized: string, target: NewEntry, other: Entry): string {
  const all = [target.spe1, target.spe2, other.spe1, other.spe2]
  return all.find(s => s.trim().toLowerCase() === normalized) ?? normalized
}

export function computePrediction(
  newEntry: NewEntry,
  existingEntries: Entry[]
): PredictionResult {

  const sameCommission = existingEntries.filter(e =>
    e.commission.trim().toLowerCase() === newEntry.commission.trim().toLowerCase()
  )

  if (sameCommission.length === 0) {
    return { topSpecialite: 'Indetermine', confidence: 0, breakdown: [], totalSimilarProfiles: 0, hasRealData: false }
  }

  const speScores: Record<string, number> = {}
  let hasRealData = false

  // ── Phase 1 : données réelles (spe_passee) ───────────────────────────────
  for (const entry of sameCommission.filter(e => e.spe_passee && e.spe_passee.trim() !== '')) {
    const spePassed = entry.spe_passee!.trim().toLowerCase()
    const mySpEs = [newEntry.spe1.trim().toLowerCase(), newEntry.spe2.trim().toLowerCase()]
    if (!mySpEs.includes(spePassed)) continue
    hasRealData = true
    let w = 3.0
    if (sameDay(entry.date_passage, newEntry.date_passage)) w *= 2.0
    const d = displayName(spePassed, newEntry, entry)
    speScores[d] = (speScores[d] || 0) + w
  }

  // ── Phase 2 : déduction par intersection ─────────────────────────────────
  const base = hasRealData ? 0.4 : 1.0
  for (const entry of sameCommission) {
    const shared = commonSpes(newEntry, entry)
    if (shared.length === 0) continue
    let m = 1.0
    if (sameDay(entry.date_passage, newEntry.date_passage)) m *= 2.5
    if (entry.classe && entry.classe.trim().toLowerCase() === newEntry.classe.trim().toLowerCase()) m *= 1.4
    if (entry.heure_passage && sameTimeSlot(entry.heure_passage, newEntry.heure_passage)) m *= 1.2
    const score = base * m * (shared.length === 1 ? 1.0 : 0.5)
    for (const spe of shared) {
      const d = displayName(spe, newEntry, entry)
      speScores[d] = (speScores[d] || 0) + score
    }
  }

  if (Object.keys(speScores).length === 0) {
    return { topSpecialite: 'Indetermine', confidence: 0, breakdown: [], totalSimilarProfiles: sameCommission.length, hasRealData: false }
  }

  const total = Object.values(speScores).reduce((a, b) => a + b, 0)
  const breakdown = Object.entries(speScores)
    .map(([specialite, score]) => ({ specialite, score, pct: Math.round((score / total) * 100) }))
    .sort((a, b) => b.score - a.score)

  // Correction arrondi
  const sumPct = breakdown.reduce((a, b) => a + b.pct, 0)
  if (sumPct !== 100) breakdown[0].pct += 100 - sumPct

  // Plafond 90%
  const MAX_CONFIDENCE = 90
  if (breakdown[0].pct > MAX_CONFIDENCE) {
    const excess = breakdown[0].pct - MAX_CONFIDENCE
    breakdown[0].pct = MAX_CONFIDENCE
    if (breakdown.length > 1) {
      const otherTotal = breakdown.slice(1).reduce((s, b) => s + b.pct, 0)
      let dist = 0
      for (let i = 1; i < breakdown.length; i++) {
        const share = otherTotal > 0 ? Math.round((breakdown[i].pct / otherTotal) * excess) : Math.floor(excess / (breakdown.length - 1))
        breakdown[i].pct += share
        dist += share
      }
      breakdown[breakdown.length - 1].pct += excess - dist
    } else {
      breakdown.push({ specialite: 'Autre specialite', score: 0, pct: excess })
    }
  }

  return { topSpecialite: breakdown[0].specialite, confidence: breakdown[0].pct, breakdown, totalSimilarProfiles: sameCommission.length, hasRealData }
}

export function confidenceLabel(pct: number): string {
  if (pct >= 70) return 'Tres probable'
  if (pct >= 50) return 'Probable'
  if (pct >= 30) return 'Possible'
  return 'Incertain'
}

export function confidenceColor(pct: number): string {
  if (pct >= 70) return 'text-accent'
  if (pct >= 50) return 'text-green-400'
  if (pct >= 30) return 'text-yellow-400'
  return 'text-ink-300'
}
