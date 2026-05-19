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

  // Toutes les dates uniques triées
  const allDates = Array.from(new Set(entries.map(e => e.date_passage))).sort()

  // Toutes les commissions uniques
  const allCommissions = Array.from(new Set(entries.map(e => e.commission))).sort()

  type CommissionDay = {
    commission: string
    date: string
    totalEleves: number
    hasRealData: boolean
    // Spés passées réelles (spe_passee renseignée)
    realSpes: Record<string, number>
    // Jury annexe count
    juryAnnexeCount: number
    // Spés déclarées pondérées (sans spe_passee)
    declaredSpes: Record<string, number>
    // Jurys plausibles (couples)
    plausibleJurys: { spe1: string; spe2: string; count: number }[]
  }

  const groups: Record<string, CommissionDay> = {}

  for (const date of allDates) {
    for (const commission of allCommissions) {
      // Entrées de cette commission dans la fenêtre temporelle autour de cette date
      const relevant = entries.filter(e =>
        e.commission.trim().toLowerCase() === commission.trim().toLowerCase() &&
        getTemporalWeight(e.date_passage, date) > 0
      )

      if (relevant.length === 0) continue

      const key = `${commission}__${date}`
      const withReal = relevant.filter(e => e.spe_passee)
      const withoutReal = relevant.filter(e => !e.spe_passee)

      const realSpes: Record<string, number> = {}
      let juryAnnexeCount = 0
      const declaredSpes: Record<string, number> = {}

      // Données réelles
      for (const e of withReal) {
        const w = getTemporalWeight(e.date_passage, date)
        const spe = e.spe_passee!.trim()
        if (spe === 'Jury annexe') {
          juryAnnexeCount += w
        } else {
          realSpes[spe] = (realSpes[spe] || 0) + w
        }
      }

      // Données déclarées (sans spe_passee) — pondérées temporellement
      for (const e of withoutReal) {
        const w = getTemporalWeight(e.date_passage, date)
        declaredSpes[e.spe1] = (declaredSpes[e.spe1] || 0) + w
        declaredSpes[e.spe2] = (declaredSpes[e.spe2] || 0) + w
      }

      // Jurys plausibles : couples de spés co-occurentes
      const coupleMap: Record<string, number> = {}
      for (const e of relevant) {
        const w = getTemporalWeight(e.date_passage, date)
        const pair = [e.spe1, e.spe2].sort().join(' + ')
        coupleMap[pair] = (coupleMap[pair] || 0) + w
      }
      const plausibleJurys = Object.entries(coupleMap)
        .filter(([, count]) => count >= 1)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([pair, count]) => {
          const [s1, s2] = pair.split(' + ')
          return { spe1: s1, spe2: s2, count: Math.round(count * 10) / 10 }
        })

      groups[key] = {
        commission,
        date,
        totalEleves: relevant.length,
        hasRealData: withReal.length >= 2,
        realSpes,
        juryAnnexeCount: Math.round(juryAnnexeCount * 10) / 10,
        declaredSpes,
        plausibleJurys,
      }
    }
  }

  // Grouper par date
  const byDate: Record<string, CommissionDay[]> = {}
  for (const group of Object.values(groups)) {
    if (!byDate[group.date]) byDate[group.date] = []
    byDate[group.date].push(group)
  }

  const days = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, commissions]) => ({
      date,
      commissions: commissions.sort((a, b) => a.commission.localeCompare(b.commission)),
      totalEleves: Array.from(new Set(
        entries.filter(e => e.date_passage === date).map(e => e.id)
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
            Basé sur {entries.length} profil{entries.length > 1 ? 's' : ''} · fenêtre temporelle ±2 jours
          </p>
        </div>
        <StatsClient days={days} />
      </div>
    </main>
  )
}