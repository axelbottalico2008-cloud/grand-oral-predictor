import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import StatsClient from '@/components/StatsClient'

export const revalidate = 60

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

  type Group = {
    commission: string
    date: string
    total: number
    speCounts: Record<string, number>
    commonSpes: string[]
    uniqueSpes: Record<string, number>
  }

  const grouped: Record<string, Group> = {}

  for (const entry of entries) {
    const key = `${entry.commission}__${entry.date_passage}`
    if (!grouped[key]) {
      grouped[key] = {
        commission: entry.commission,
        date: entry.date_passage,
        total: 0,
        speCounts: {},
        commonSpes: [],
        uniqueSpes: {},
      }
    }
    grouped[key].total += 1
    grouped[key].speCounts[entry.spe1] = (grouped[key].speCounts[entry.spe1] || 0) + 1
    grouped[key].speCounts[entry.spe2] = (grouped[key].speCounts[entry.spe2] || 0) + 1
  }

  for (const group of Object.values(grouped)) {
    const threshold = Math.ceil(group.total * 0.8)
    group.commonSpes = Object.entries(group.speCounts)
      .filter(([, count]) => count >= threshold)
      .map(([spe]) => spe)

    const distinctiveEntries = Object.entries(group.speCounts)
      .filter(([spe]) => !group.commonSpes.includes(spe))
      .sort((a, b) => b[1] - a[1])

    if (distinctiveEntries.length === 0) {
      group.uniqueSpes = Object.fromEntries(
        Object.entries(group.speCounts).sort((a, b) => b[1] - a[1])
      )
      group.commonSpes = []
    } else {
      group.uniqueSpes = Object.fromEntries(distinctiveEntries)
    }
  }

  // Grouper par date
  const byDate: Record<string, Group[]> = {}
  for (const group of Object.values(grouped)) {
    if (!byDate[group.date]) byDate[group.date] = []
    byDate[group.date].push(group)
  }

  // Trier commissions par date
  const days = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, commissions]) => ({
      date,
      commissions: commissions.sort((a, b) => a.commission.localeCompare(b.commission)),
      totalEleves: commissions.reduce((s, g) => s + g.total, 0),
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
            Clique sur un jour pour voir les commissions.
            Basé sur {entries.length} profil{entries.length > 1 ? 's' : ''} soumis.
          </p>
        </div>
        <StatsClient days={days} />
      </div>
    </main>
  )
}