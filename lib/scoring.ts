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

  // Filtre : même commission + fenêtre temporelle
  const sameCommission = existingEntries.filter(e =>
    e.commission.trim().toLowerCase() === newEntry.commission.trim().toLowerCase() &&
    getTemporalWeight(e.date_passage, newEntry.date_passage) > 0
  )

  const withReal = sameCommission.filter(e => e.spe_passee)
  const withoutReal = sameCommission.filter(e => !e.spe_passee)

  const speScores: Record<string, number> = {}
  let hasRealData = false

  // ── Modèle 1 : données réelles (spe_passee renseignée) ──────────────────
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

  // ── Modèle 2 : spé distinctive par commission ────────────────────────────
  // Logique : dans une commission, la spé présente chez TOUS les élèves
  // est probablement la spé "commune" du jury. La spé distinctive (qui varie)
  // est le vrai signal. On pondère en conséquence.
  if (!hasRealData && withoutReal.length > 0) {

    // Compte la fréquence de chaque spé dans cette commission
    const speCount: Record<string, number> = {}
    let totalEleves = 0
    for (const entry of withoutReal) {
      const w = getTemporalWeight(entry.date_passage, newEntry.date_passage)
      speCount[entry.spe1] = (speCount[entry.spe1] || 0) + w
      speCount[entry.spe2] = (speCount[entry.spe2] || 0) + w
      totalEleves += w
    }

    // Calcule le taux de présence de chaque spé (0 à 1)
    const speRate: Record<string, number> = {}
    for (const [spe, count] of Object.entries(speCount)) {
      speRate[spe] = count / totalEleves
    }

    // Pour chaque spé de l'utilisateur, calcule un score
    // Une spé présente chez 100% = spé commune = score faible (jury déjà "saturé")
    // Une spé présente chez 50-80% = spé distinctive = score fort
    // Une spé présente chez <20% = bruit = score très faible
    const mySpes = [newEntry.spe1.trim(), newEntry.spe2.trim()]
    for (const spe of mySpes) {
      const rate = speRate[spe.trim()] || 0
      if (rate === 0) continue

      // Si 100% des élèves ont cette spé → c'est la spé commune, score réduit
      // Si ~50-80% → c'est le vrai signal distinctif, score max
      let distinctiveScore: number
      if (rate >= 0.95) {
        // Spé universelle dans cette commission → très peu distinctive
        distinctiveScore = 0.3
      } else if (rate >= 0.5) {
        // Spé majoritaire mais pas universelle → bon signal
        distinctiveScore = 1.5
      } else if (rate >= 0.2) {
        // Spé minoritaire → signal moyen
        distinctiveScore = 1.0
      } else {
        // Trop rare → bruit
        distinctiveScore = 0.2
      }

      // Pondère aussi par le nombre d'observations (confiance)
      const confidence = Math.min(Math.log(1 + speCount[spe] || 0), 3)
      const finalScore = distinctiveScore * confidence * 100

      speScores[spe] = (speScores[spe] || 0) + finalScore
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

  // Normalise à 100
  const sumPct = breakdown.reduce((a, b) => a + b.pct, 0)
  if (breakdown.length > 0 && sumPct !== 100) {
    breakdown[0].pct += 100 - sumPct
  }

  // Plafond 90%
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
    totalSimilarProfiles: withReal.length + withoutReal.length,
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