import type { Entry } from './supabase'

export type PredictionResult = {
  topSpecialite: string
  confidence: number
  breakdown: { specialite: string; score: number; pct: number }[]
  totalSimilarProfiles: number
}

type NewEntry = {
  lycee: string
  spe1: string
  spe2: string
  commission: string
  heure_passage: string
  date_passage: string
}

export function computePrediction(
  newEntry: NewEntry,
  existingEntries: Entry[]
): PredictionResult {
  const speScores: Record<string, number> = {}

  for (const entry of existingEntries) {
    let score = 0

    // Commission différente = jury différent = on ignore complètement
    if (entry.commission.trim().toLowerCase() !== newEntry.commission.trim().toLowerCase()) {
      continue
    }

    // +60 : même commission (déjà vérifiée)
    score += 60

    // +20 : même date (confirmation même jury)
    if (entry.date_passage?.slice(0, 10) === newEntry.date_passage?.slice(0, 10)) {
      score += 20
    }

    // +50 : spécialité commune
    const mySpes = [
      newEntry.spe1.trim().toLowerCase(),
      newEntry.spe2.trim().toLowerCase(),
    ]
    const theirSpes = [
      entry.spe1.trim().toLowerCase(),
      entry.spe2.trim().toLowerCase(),
    ]
    const hasCommon = mySpes.some((s) => theirSpes.includes(s))
    if (hasCommon) {
      score += 50
    }

    if (score === 0) continue

    const commonSpes = mySpes.filter((s) => theirSpes.includes(s))
    for (const spe of commonSpes) {
      const originalName = [newEntry.spe1, newEntry.spe2].find(
        (s) => s.trim().toLowerCase() === spe
      ) ?? spe
      const key = originalName.trim()
      speScores[key] = (speScores[key] || 0) + score
    }
  }

  if (Object.keys(speScores).length === 0) {
    return {
      topSpecialite: 'Indetermine',
      confidence: 0,
      breakdown: [],
      totalSimilarProfiles: 0,
    }
  }

  const totalScore = Object.values(speScores).reduce((a, b) => a + b, 0)

  const breakdown = Object.entries(speScores)
    .map(([specialite, score]) => ({
      specialite,
      score,
      pct: Math.round((score / totalScore) * 100),
    }))
    .sort((a, b) => b.score - a.score)

  const sumPct = breakdown.reduce((a, b) => a + b.pct, 0)
  if (breakdown.length > 0 && sumPct !== 100) {
    breakdown[0].pct += 100 - sumPct
  }

  const MAX_CONFIDENCE = 90
  if (breakdown[0].pct > MAX_CONFIDENCE) {
    const excess = breakdown[0].pct - MAX_CONFIDENCE
    breakdown[0].pct = MAX_CONFIDENCE
    if (breakdown.length > 1) {
      const otherTotal = breakdown.slice(1).reduce((s, b) => s + b.pct, 0)
      let distributed = 0
      for (let i = 1; i < breakdown.length; i++) {
        const share = otherTotal > 0
          ? Math.round((breakdown[i].pct / otherTotal) * excess)
          : Math.floor(excess / (breakdown.length - 1))
        breakdown[i].pct += share
        distributed += share
      }
      breakdown[breakdown.length - 1].pct += excess - distributed
    } else {
      breakdown.push({ specialite: 'Autre specialite', score: 0, pct: excess })
    }
  }

  return {
    topSpecialite: breakdown[0].specialite,
    confidence: breakdown[0].pct,
    breakdown,
    totalSimilarProfiles: existingEntries.length,
  }
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