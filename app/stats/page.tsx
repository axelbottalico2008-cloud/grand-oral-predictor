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

  // Grouper par commission + date
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

  // Calcule les spés communes (>= 80% des élèves) et les spés distinctives
  for (const group of Object.values(grouped)) {
    const threshold = Math.ceil(group.total * 0.8)
    group.commonSpes = Object.entries(group.speCounts)
      .filter(([, count]) => count >= threshold)
      .map(([spe]) => spe)

    // Spés distinctives = celles qui ne sont pas communes à (presque) tout le monde
    const distinctiveEntries = Object.entries(group.speCounts)
      .filter(([spe]) => !group.commonSpes.includes(spe))
      .sort((a, b) => b[1] - a[1])

    // Si tout le monde a les mêmes spés (petit groupe), on garde tout
    if (distinctiveEntries.length === 0) {
      group.uniqueSpes = Object.fromEntries(
        Object.entries(group.speCounts).sort((a, b) => b[1] - a[1])
      )
      group.commonSpes = []
    } else {
      group.uniqueSpes = Object.fromEntries(distinctiveEntries)
    }
  }

  const groups = Object.values(grouped).sort((a, b) => {
    if (a.date < b.date) return -1
    if (a.date > b.date) return 1
    return a.commission.localeCompare(b.commission)
  })

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
            Spécialités les plus probables par commission et par date.
            Basé sur {entries.length} profil{entries.length > 1 ? 's' : ''} soumis.
          </p>
        </div>
        <StatsClient groups={groups} />
      </div>
    </main>
  )
}