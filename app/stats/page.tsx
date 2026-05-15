import { supabase } from '@/lib/supabase'
import Link from 'next/link'

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
  const grouped: Record<string, {
    commission: string
    date: string
    spes: Record<string, number>
    total: number
  }> = {}

  for (const entry of entries) {
    const key = `${entry.commission}__${entry.date_passage}`
    if (!grouped[key]) {
      grouped[key] = {
        commission: entry.commission,
        date: entry.date_passage,
        spes: {},
        total: 0,
      }
    }
    grouped[key].total += 1
    grouped[key].spes[entry.spe1] = (grouped[key].spes[entry.spe1] || 0) + 1
    grouped[key].spes[entry.spe2] = (grouped[key].spes[entry.spe2] || 0) + 1
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

      <div className="w-full max-w-lg space-y-6">
        <div data-animate="1">
          <h1 className="font-display font-bold text-3xl text-ink-50">
            Configurations des jurys
          </h1>
          <p className="font-body text-sm text-ink-400 mt-1">
            Répartition probable des spécialités par commission et par date.
            Basé sur {entries.length} profil{entries.length > 1 ? 's' : ''} soumis.
          </p>
        </div>

        {groups.map((group) => {
          const totalSpes = Object.values(group.spes).reduce((a, b) => a + b, 0)
          const sortedSpes = Object.entries(group.spes)
            .sort((a, b) => b[1] - a[1])

          return (
            <div key={`${group.commission}__${group.date}`} className="gop-card space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display font-bold text-lg text-ink-50">
                    Commission {group.commission}
                  </p>
                  <p className="font-body text-xs text-ink-400 mt-0.5">
                    {new Date(group.date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <span className="text-xs font-body text-ink-500 bg-surface-high border border-surface-border rounded-full px-3 py-1 shrink-0">
                  {group.total} élève{group.total > 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-2.5">
                {sortedSpes.map(([spe, count]) => {
                  const pct = Math.round((count / totalSpes) * 100)
                  return (
                    <div key={spe}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-body text-sm text-ink-100">{spe}</span>
                        <span className="font-display font-bold text-sm text-ink-300">{pct}%</span>
                      </div>
                      <div className="bg-surface-high rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              <p className="text-xs text-ink-500 font-body">
                ⚠️ Basé sur les profils soumis, sans valeur officielle.
              </p>
            </div>
          )
        })}
      </div>
    </main>
  )
}