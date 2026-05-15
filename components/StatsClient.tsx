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

export default function StatsClient({ groups }: { groups: Group[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggle = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const key = `${group.commission}__${group.date}`
        const isExpanded = expanded[key]
        const totalUnique = Object.values(group.uniqueSpes).reduce((a, b) => a + b, 0)
        const sortedUnique = Object.entries(group.uniqueSpes).sort((a, b) => b[1] - a[1])
        const top2 = sortedUnique.slice(0, 2)
        const rest = sortedUnique.slice(2)

        return (
          <div key={key} className="gop-card space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-display font-bold text-lg text-ink-50">
                  Commission {group.commission}
                </p>
                <p className="font-body text-xs text-ink-400 mt-0.5">
                  {new Date(group.date).toLocaleDateString('fr-FR', {
                    weekday: 'long', day: 'numeric',
                    month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
              <span className="text-xs font-body text-ink-500 bg-surface-high border border-surface-border rounded-full px-3 py-1 shrink-0">
                {group.total} élève{group.total > 1 ? 's' : ''}
              </span>
            </div>

            {/* Spés communes */}
            {group.commonSpes.length > 0 && (
              <div className="bg-accent/5 border border-accent/20 rounded-xl px-4 py-2.5 flex items-center gap-2">
                <span className="text-accent text-xs">★</span>
                <p className="font-body text-xs text-ink-300">
                  Spé commune à (presque) tous :{' '}
                  <span className="text-accent font-medium">
                    {group.commonSpes.join(', ')}
                  </span>
                </p>
              </div>
            )}

            {/* Top 2 spés distinctives */}
            <div className="space-y-2.5">
              <p className="font-body text-xs text-ink-500 uppercase tracking-widest">
                Spécialités les + probables
              </p>
              {top2.map(([spe, count], i) => {
                const pct = totalUnique > 0 ? Math.round((count / totalUnique) * 100) : 0
                return (
                  <div key={spe}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
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

            {/* Bouton déroulant si ya plus de 2 spés */}
            {rest.length > 0 && (
              <div>
                <button
                  onClick={() => toggle(key)}
                  className="w-full flex items-center justify-between text-xs text-ink-400 hover:text-ink-200 transition-colors py-1"
                >
                  <span>{isExpanded ? 'Masquer' : `Voir ${rest.length} autre${rest.length > 1 ? 's' : ''} spécialité${rest.length > 1 ? 's' : ''}`}</span>
                  <span>{isExpanded ? '▲' : '▼'}</span>
                </button>

                {isExpanded && (
                  <div className="space-y-2.5 mt-2 pt-2 border-t border-surface-border">
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

            <p className="text-xs text-ink-500 font-body">
              ⚠️ Sans valeur officielle — basé sur les profils soumis.
            </p>
          </div>
        )
      })}
    </div>
  )
}