import type { Entry } from './supabase'

/**
 * Algorithme de scoring pour estimer la spécialité probable.
 *
 * Logique :
 * Pour chaque entrée existante dans la BDD, on calcule un score de similarité
 * avec le profil soumis. Plus le score est élevé, plus cette entrée est
 * "comparable" à l'utilisateur. On agrège ensuite les spécialités pondérées
 * par ces scores pour obtenir des probabilités.
 *
 * Barème :
 * +50 pts  → même commission
 * +25 pts  → même heure de passage
 * +20 pts  → même lycée
 * +40 pts  → spécialité en commun (spe1 ou spe2)
 */

export type PredictionResult = {
  topSpecialite: string
  confidence: number // 0-100
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
  // Accumule les scores par spécialité
  const speScores: Record<string, number> = {}

  for (const entry of existingEntries) {
    let score = 0

    // +50 : même commission
    if (
      entry.commission.trim().toLowerCase() ===
      newEntry.commission.trim().toLowerCase()
    ) {
      score += 50
    }

    // +25 : même heure de passage (on compare les 5 premiers chars HH:MM)
    if (entry.heure_passage?.slice(0, 5) === newEntry.heure_passage?.slice(0, 5)) {
      score += 25
    }

    // +20 : même lycée
    if (
      entry.lycee.trim().toLowerCase() === newEntry.lycee.trim().toLowerCase()
    ) {
      score += 20
    }

    // +40 : spécialité commune
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
      score += 40
    }

    // On ne garde que les profils avec au moins un point commun
    if (score === 0) continue

    // On attribue le score UNIQUEMENT aux spécialités que l'utilisateur a choisies.
    // On ne score que l'intersection entre ses spés et celles du profil similaire.
    // Exemple : moi = [Maths, Physique], autre = [Maths, SVT] → seul Maths est scoré.
    const commonSpes = mySpes.filter((s) => theirSpes.includes(s))
    for (const spe of commonSpes) {
      // On retrouve le nom original (avec casse) depuis newEntry
      const originalName = [newEntry.spe1, newEntry.spe2].find(
        (s) => s.trim().toLowerCase() === spe
      ) ?? spe
      const key = originalName.trim()
      speScores[key] = (speScores[key] || 0) + score
    }
  }

  // Si aucun profil similaire → résultat indéterminé
  if (Object.keys(speScores).length === 0) {
    return {
      topSpecialite: 'Indéterminé',
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

  // Normalise pour que la somme soit exactement 100
  const sumPct = breakdown.reduce((a, b) => a + b.pct, 0)
  if (breakdown.length > 0 && sumPct !== 100) {
    breakdown[0].pct += 100 - sumPct
  }

  // Plafond à 90 % : on refuse d'afficher une certitude >= 90 %
  // L'excédent est redistribué sur les autres spécialités pour maintenir la somme à 100.
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
      // Arrondi résiduel sur la dernière entrée
      breakdown[breakdown.length - 1].pct += excess - distributed
    } else {
      breakdown.push({ specialite: 'Autre spécialité', score: 0, pct: excess })
    }
  }

  return {
    topSpecialite: breakdown[0].specialite,
    confidence: breakdown[0].pct,
    breakdown,
    totalSimilarProfiles: existingEntries.length,
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

/** Retourne un label de confiance lisible */
export function confidenceLabel(pct: number): string {
  if (pct >= 70) return 'Très probable'
  if (pct >= 50) return 'Probable'
  if (pct >= 30) return 'Possible'
  return 'Incertain'
}

/** Retourne une couleur Tailwind selon le niveau de confiance */
export function confidenceColor(pct: number): string {
  if (pct >= 70) return 'text-accent'
  if (pct >= 50) return 'text-green-400'
  if (pct >= 30) return 'text-yellow-400'
  return 'text-ink-300'
}
