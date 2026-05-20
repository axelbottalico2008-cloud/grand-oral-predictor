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
  spe1: string
  spe2: string
  commission: string
  heure_passage: string
  date_passage: string
}

function getTemporalWeight(dateA: string, dateB: string): number {
  const diff = Math.abs(
    new Date(dateA).getTime() - new Date(dateB).getTime()
  ) / (1000 * 60 * 60 * 24)
  if (diff === 0) return 1.0
  if (diff <= 1) return 0.7
  if (diff <= 2) return 0.4
  return 0
}

export function computePrediction(
  newEntry: NewEntry,
  existingEntries: Entry[]
): PredictionResult {

  const sameCommission = existingEntries.filter(e =>
    e.commission.trim().toLowerCase() === newEntry.commission.trim().toLowerCase()
  )

  const withReal = sameCommission.filter(e => e.spe_passee &&
    getTemporalWeight(e.date_passage, newEntry.date_passage) > 0)
  const withoutReal = sameCommission.filter(e => !e.spe_passee)

  const speScores: Record<string, number> = {}
  let hasRealData = false

  // ── Modèle 1 : données réelles ───────────────────────────────────────────
  if (withReal.length >= 2) {
    hasRealData = true
    for (const entry of withReal) {
      const weight = getTemporalWeight(entry.date_passage, newEntry.date_passage)
      const spePassed = entry.spe_passee!.trim()
      const mySpes = [newEntry.spe1.trim().toLowerCase(), newEntry.spe2.trim().toLowerCase()]
      if (mySpes.includes(spePassed.toLowerCase())) {
        speScores[spePassed] = (speScores[spePassed] || 0) + (100 * weight)
      }
    }
  }

  // ── Modèle 2 : bayésien combiné (global + temporel) ──────────────────────
  // Score global  : fréquence dans TOUTE la commission
  // Score temporel: fréquence dans la fenêtre ±2 jours autour de la date
  // Score final   : global × 1.0 + temporel × 2.0
  // Le temporel pèse 2x plus car il reflète le jury actuel
  if (!hasRealData && withoutReal.length > 0) {

    // Fréquences globales (tout le dataset)
    const globalCount: Record<string, number> = {}
    let totalGlobal = 0
    for (const entry of existingEntries) {
      globalCount[entry.spe1.trim()] = (globalCount[entry.spe1.trim()] || 0) + 1
      globalCount[entry.spe2.trim()] = (globalCount[entry.spe2.trim()] || 0) + 1
      totalGlobal += 2
    }

    // Fréquences globales commission (tous les jours)
    const localAllCount: Record<string, number> = {}
    let totalLocalAll = 0
    for (const entry of withoutReal) {
      localAllCount[entry.spe1.trim()] = (localAllCount[entry.spe1.trim()] || 0) + 1
      localAllCount[entry.spe2.trim()] = (localAllCount[entry.spe2.trim()] || 0) + 1
      totalLocalAll += 2
    }

    // Fréquences temporelles commission (±2 jours)
    const localTempCount: Record<string, number> = {}
    let totalLocalTemp = 0
    for (const entry of withoutReal) {
      const w = getTemporalWeight(entry.date_passage, newEntry.date_passage)
      if (w > 0) {
        localTempCount[entry.spe1.trim()] = (localTempCount[entry.spe1.trim()] || 0) + w
        localTempCount[entry.spe2.trim()] = (localTempCount[entry.spe2.trim()] || 0) + w
        totalLocalTemp += 2 * w
      }
    }

    const mySpes = [newEntry.spe1.trim(), newEntry.spe2.trim()]
    for (const spe of mySpes) {
      const globalRate = (globalCount[spe] || 1) / totalGlobal

      // Score global commission
      let scoreGlobal = 0
      const countAll = localAllCount[spe] || 0
      if (totalLocalAll > 0 && countAll >= 2) {
        const localRate = countAll / totalLocalAll
        scoreGlobal = (localRate / globalRate) * (countAll / 2)
      }

      // Score temporel commission
      let scoreTemp = 0
      const countTemp = localTempCount[spe] || 0
      if (totalLocalTemp > 0 && countTemp >= 1) {
        const localRateTemp = countTemp / totalLocalTemp
        scoreTemp = (localRateTemp / globalRate) * (countTemp / 2)
      }

      // Combinaison pondérée : temporel compte 2x plus
      const finalScore = scoreGlobal * 1.0 + scoreTemp * 2.0
      if (finalScore > 0) {
        speScores[spe] = finalScore
      }
    }
  }

  if (Object.keys(speScores).length === 0) {
    return {
      topSpecialite: 'Indetermine',
      confidence: 0,
      breakdown: [],
      totalSimilarProfiles: 0,
      hasRealData: false,
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
    totalSimilarProfiles: sameCommission.length,
    hasRealData,
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