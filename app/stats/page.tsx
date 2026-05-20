import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import StatsClient from '@/components/StatsClient'

export const revalidate = 60

function getTemporalWeight(dateA: string, dateB: string): number {
  const diff = Math.abs(
    new Date(dateA).getTime() - new Date(dateB).getTime()
  ) / (1000 * 60 * 60 * 24)
  if (diff === 0) return 1.0
  if (diff <= 1) return 0.7
  if (diff <= 2) return 0.4
  return 0
}

export default async function StatsPage() {
  const { data: entries } = await supabase
    .from('entries')
    .select('*')
    .order('date_passage', { ascending: true })

  if (!entries || entries.length === 0) {
    return (
      <main className="min-h-screen grid-bg flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-4xl">📊</p>
          <h1 className="font-display font-bold text-2xl text-ink-50">Pas encore de données</h1>
          <p className="text-ink-400 text-sm">Reviens quand plus d éleves auront soumis leur profil.</p>
          <Link href="/" className="text-accent text-sm">← Retour</Link>
        </div>
      </main>
    )
  }

  // Fréquences globales
  const globalCount: Record<string, number> = {}
  let totalGlobal = 0
  for (const e of entries) {
    globalCount[e.spe1.trim()] = (globalCount[e.spe1.trim()] || 0) + 1
    globalCount[e.spe2.trim()] = (globalCount[e.spe2.trim()] || 0) + 1
    totalGlobal += 2
  }
  const globalRate = (spe: string) => (globalCount[spe] || 1) / totalGlobal

  const allDates = Array.from(new Set(entries.map(e => e.date_passage))).sort()
  const allCommissions = Array.from(new Set(entries.map(e => e.commission))).sort()

  type SpeScore = { spe: string; pct: number; signal: 'fort' | 'moyen' | 'faible' }

  type CommissionDay = {
    commission: string
    date: string
    totalEleves: number
    hasRealData: boolean
    realSpes: { spe: string; pct: number }[]
    juryAnnexePct: number
    estimatedSpes: SpeScore[]
    plausibleJurys: { spe1: string; spe2: string; count: number }[]
  }

  const groups: CommissionDay[] = []

  for (const date of allDates) {
    for (const commission of allCommissions) {
      const sameComm = entries.filter(e =>
        e.commission.trim().toLowerCase() === commission.trim().toLowerCase()
      )
      if (sameComm.length === 0) continue

      const withReal = sameComm.filter(e =>
        e.spe_passee && getTemporalWeight(e.date_passage, date) > 0
      )
      const withoutReal = sameComm.filter(e => !e.spe_passee)

      // ── Données réelles ────────────────────────────────────────────────
      const realCount: Record<string, number> = {}
      let juryAnnexeCount = 0
      let totalReal = 0
      for (const e of withReal) {
        const w = getTemporalWeight(e.date_passage, date)
        const spe = e.spe_passee!.trim()
        if (spe === 'Jury annexe') juryAnnexeCount += w
        else realCount[spe] = (realCount[spe] || 0) + w
        totalReal += w
      }

      // ── Scores bayésiens combinés ──────────────────────────────────────
      // Même logique que le scoring de prédiction
      const localAllCount: Record<string, number> = {}
      let totalLocalAll = 0
      for (const e of withoutReal) {
        localAllCount[e.spe1.trim()] = (localAllCount[e.spe1.trim()] || 0) + 1
        localAllCount[e.spe2.trim()] = (localAllCount[e.spe2.trim()] || 0) + 1
        totalLocalAll += 2
      }

      const localTempCount: Record<string, number> = {}
      let totalLocalTemp = 0
      for (const e of withoutReal) {
        const w = getTemporalWeight(e.date_passage, date)
        if (w > 0) {
          localTempCount[e.spe1.trim()] = (localTempCount[e.spe1.trim()] || 0) + w
          localTempCount[e.spe2.trim()] = (localTempCount[e.spe2.trim()] || 0) + w
          totalLocalTemp += 2 * w
        }
      }

      const speRawScores: Record<string, number> = {}
      for (const spe of Object.keys(localAllCount)) {
        const gr = globalRate(spe)
        let scoreGlobal = 0
        const countAll = localAllCount[spe] || 0
        if (totalLocalAll > 0 && countAll >= 2) {
          scoreGlobal = (countAll / totalLocalAll / gr) * (countAll / 2)
        }
        let scoreTemp = 0
        const countTemp = localTempCount[spe] || 0
        if (totalLocalTemp > 0 && countTemp >= 1) {
          scoreTemp = (countTemp / totalLocalTemp / gr) * (countTemp / 2)
        }
        const final = scoreGlobal * 1.0 + scoreTemp * 2.0
        if (final > 0) speRawScores[spe] = final
      }

      const totalRaw = Object.values(speRawScores).reduce((a, b) => a + b, 0)
      const estimatedSpes: SpeScore[] = Object.entries(speRawScores)
        .map(([spe, score]) => {
          const pct = totalRaw > 0 ? Math.round((score / totalRaw) * 100) : 0
          const ratio = totalLocalAll > 0
            ? (localAllCount[spe] / totalLocalAll) / globalRate(spe)
            : 0
          const signal: SpeScore['signal'] = ratio >= 3 ? 'fort' : ratio >= 1.5 ? 'moyen' : 'faible'
          return { spe, pct, signal }
        })
        .filter(s => s.pct >= 5)
        .sort((a, b) => b.pct - a.pct)

      // Jurys plausibles (couples)
      const coupleMap: Record<string, number> = {}
      for (const e of sameComm) {
        const w = getTemporalWeight(e.date_passage, date)
        if (w > 0) {
          const pair = [e.spe1.trim(), e.spe2.trim()].sort().join(' + ')
          coupleMap[pair] = (coupleMap[pair] || 0) + w
        }
      }
      const plausibleJurys = Object.entries(coupleMap)
        .filter(([, c]) => c >= 1)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([pair, count]) => {
          const [s1, s2] = pair.split(' + ')
          return { spe1: s1, spe2: s2, count: Math.round(count * 10) / 10 }
        })

      const totalEleves = Array.from(new Set(
        sameComm.filter(e => getTemporalWeight(e.date_passage, date) > 0).map(e => e.id)
      )).length

      if (totalEleves === 0) continue

      groups.push({
        commission,
        date,
        totalEleves,
        hasRealData: withReal.length >= 2,
        realSpes: Object.entries(realCount)
          .map(([spe, count]) => ({ spe, pct: totalReal > 0 ? Math.round(count / totalReal * 100) : 0 }))
          .sort((a, b) => b.pct - a.pct),
        juryAnnexePct: totalReal > 0 ? Math.round(juryAnnexeCount / totalReal * 100) : 0,
        estimatedSpes,
        plausibleJurys,
      })
    }
  }

  // Grouper par date
  const byDate: Record<string, CommissionDay[]> = {}
  for (const g of groups) {
    if (!byDate[g.date]) byDate[g.date] = []
    byDate[g.date].push(g)
  }

  const days = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, commissions]) => ({
      date,
      commissions: commissions.sort((a, b) => a.commission.localeCompare(b.commission)),
      totalEleves: Array.from(new Set(
        entries.filter(e => getTemporalWeight(e.date_passage, date) > 0 &&
          commissions.some(c => c.commission === e.commission)).map(e => e.id)
      )).length,
    }))

  return (
    <main className="min-h-screen grid-bg flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-lg mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-ink-400 hover:text-ink-100 transition-colors text-sm font-body">
          &larr; Retour
        </Link>
      </div>
      <div className="w-full max-w-lg space-y-4">
        <div data-animate="1">
          <h1 className="font-display font-bold text-3xl text-ink-50">
            Configurations des jurys
          </h1>
          <p className="font-body text-sm text-ink-400 mt-1">
            Basé sur {entries.length} profils · signal bayésien global + temporel
          </p>
        </div>
        <StatsClient days={days} />
      </div>
    </main>
  )
}