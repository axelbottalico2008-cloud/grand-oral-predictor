'use client'

import { useState } from 'react'

type Group = {
  commission: string
  date: string
  total: number
  speCounts: Record<string, number>
  commonSpes: string[]
  uniqueSpes: Record<string, number>
}

type Day = {
  date: string
  commissions: Group[]
  totalEleves: number
}

export default function StatsClient({ days }: { days: Day[] }) {
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({})
  const [expandedSpes, setExpandedSpes] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState('')

  const toggleDay = (date: string) => {
    setExpandedDays(prev => ({ ...prev, [date]: !prev[date] }))
  }

  const toggleSpes = (key: string) => {
    setExpandedSpes(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const filteredDays = days.map(day => ({
    ...day,
    commissions: day.commissions.filter(g =>
      search === '' ||
      g.commission.toLowerCase().includes(search.toLowerCase()) ||
      day.date.includes(search)
    )
  })).filter(day => day.commissions.length > 0)

  return (
    <div className="space-y-3">
      {/* Barre de recherche */}
      <div className="relative">
        <input
          type="text"
          placeholder="Rechercher une commission ou une date..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="gop-input pl-9"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 text-sm">🔍</span>
      </div>

      {filteredDays.length === 0 && (
        <p className="text-center text-ink-500 text-sm py-8">Aucun résultat pour cette recherche.</p>
      )}

      {filteredDays.map(day => {
        const isDayOpen = expandedDays[day.date] || search !== ''
        const dateLabel = new Date(day.date).toLocaleDateString('fr-FR', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        })

        return (
          <div key={day.date} className="gop-card p-0 overflow-hidden">
            {/* Header jour */}
            <button
              onClick={() => toggleDay(day.date)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-high transition-colors"
            >
              <div className="text-left">
                <p className="font-display font-bold text-base text-ink-50 capitalize">{dateLabel}</p>
                <p className="font-body text-xs text-ink-400 mt-0.5">
                  {day.commissions.length} commission{day.commissions.length > 1 ? 's' : ''} · {day.totalEleves} élève{day.totalEleves > 1 ? 's' : ''}
                </p>
              </div>
              <span className="text-ink-400 text-sm ml-4">{isDayOpen ? '▲' : '▼'}</span>
            </button>

            {/* Commissions du jour */}
            {isDayOpen && (
              <div className="border-t border-surface-border divide-y divide-surface-border">
                {day.commissions.map(group => {
                  const key = `${group.commission}__${group.date}`
                  const isSpesOpen = expandedSpes[key]
                  const totalUnique = Object.values(group.uniqueSpes).reduce((a, b) => a + b, 0)
                  const sortedUnique = Object.entries(group.uniqueSpes).sort((a, b) => b[1] - a[1])
                  const top2 = sortedUnique.slice(0, 2)
                  const rest = sortedUnique.slice(2)

                  return (
                    <div key={key} className="px-5 py-4 space-y-3">
                      {/* Header commission */}
                      <div className="flex items-center justify-between">
                        <p className="font-display font-bold text-sm text-ink-100">
                          Commission {group.commission}
                        </p>
                        <span className="text-xs text-ink-500 bg-surface-high border border-surface-border rounded-full px-2.5 py-0.5">
                          {group.total} élève{group.total > 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Spé commune */}
                      {group.commonSpes.length > 0 && (
                        <div className="bg-accent/5 border border-accent/20 rounded-lg px-3 py-2 flex items-center gap-2">
                          <span className="text-accent text-xs">★</span>
                          <p className="font-body text-xs text-ink-300">
                            Spé commune :{' '}
                            <span className="text-accent font-medium">{group.commonSpes.join(', ')}</span>
                          </p>
                        </div>
                      )}

                      {/* Top 2 */}
                      <div className="space-y-2">
                        <p className="font-body text-xs text-ink-500 uppercase tracking-widest">
                          Spés les + probables
                        </p>
                        {top2.map(([spe, count], i) => {
                          const pct = totalUnique > 0 ? Math.round((count / totalUnique) * 100) : 0
                          return (
                            <div key={spe}>
                              <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-1.5">
                                  {i === 0 && <span className="text-accent text-xs">▲</span>}
                                  <span className="font-body text-sm text-ink-100">{spe}</span>
                                </div>
                                <span className="font-display font-bold text-sm text-accent">{pct}%</span>
                              </div>
                              <div className="bg-surface-high rounded-full h-1.5 overflow-hidden">
                                <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Déroulant autres spés */}
                      {rest.length > 0 && (
                        <div>
                          <button
                            onClick={() => toggleSpes(key)}
                            className="w-full flex items-center justify-between text-xs text-ink-400 hover:text-ink-200 transition-colors py-1"
                          >
                            <span>{isSpesOpen ? 'Masquer' : `Voir ${rest.length} autre${rest.length > 1 ? 's' : ''} spécialité${rest.length > 1 ? 's' : ''}`}</span>
                            <span>{isSpesOpen ? '▲' : '▼'}</span>
                          </button>
                          {isSpesOpen && (
                            <div className="space-y-2 mt-2 pt-2 border-t border-surface-border">
                              {rest.map(([spe, count]) => {
                                const pct = totalUnique > 0 ? Math.round((count / totalUnique) * 100) : 0
                                return (
                                  <div key={spe}>
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-body text-sm text-ink-300">{spe}</span>
                                      <span className="font-display font-bold text-sm text-ink-400">{pct}%</span>
                                    </div>
                                    <div className="bg-surface-high rounded-full h-1.5 overflow-hidden">
                                      <div className="h-full bg-ink-400 rounded-full" style={{ width: `${pct}%` }} />
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-ink-500 font-body">⚠️ Sans valeur officielle.</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}