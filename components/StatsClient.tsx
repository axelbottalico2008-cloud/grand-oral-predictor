'use client'

import { useState } from 'react'

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

type Day = {
  date: string
  commissions: CommissionDay[]
  totalEleves: number
}

export default function StatsClient({ days }: { days: Day[] }) {
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({})
  const [expandedJurys, setExpandedJurys] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState('')

  const toggleDay = (date: string) => setExpandedDays(prev => ({ ...prev, [date]: !prev[date] }))
  const toggleJury = (key: string) => setExpandedJurys(prev => ({ ...prev, [key]: !prev[key] }))

  const filteredDays = days.map(day => ({
    ...day,
    commissions: day.commissions.filter(g => {
      if (search === '') return true
      const s = search.toLowerCase()
      const dateLabel = new Date(day.date).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      }).toLowerCase()
      return (
        g.commission.toLowerCase().includes(s) ||
        day.date.includes(s) ||
        dateLabel.includes(s) ||
        new Date(day.date).toLocaleDateString('fr-FR').includes(s)
      )
    })
  })).filter(day => day.commissions.length > 0)

  const signalColor = (signal: SpeScore['signal']) => {
    if (signal === 'fort') return 'text-accent'
    if (signal === 'moyen') return 'text-yellow-400'
    return 'text-ink-400'
  }

  const signalBg = (signal: SpeScore['signal']) => {
    if (signal === 'fort') return 'bg-accent/5 border-accent/20'
    if (signal === 'moyen') return 'bg-yellow-500/5 border-yellow-500/20'
    return 'bg-surface-high border-surface-border'
  }

  const signalLabel = (signal: SpeScore['signal']) => {
    if (signal === 'fort') return 'Signal fort'
    if (signal === 'moyen') return 'Signal moyen'
    return 'Signal faible'
  }

  return (
    <div className="space-y-3">
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
        <p className="text-center text-ink-500 text-sm py-8">Aucun résultat.</p>
      )}

      {filteredDays.map(day => {
        const isDayOpen = expandedDays[day.date] || search !== ''
        const dateLabel = new Date(day.date).toLocaleDateString('fr-FR', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        })

        return (
          <div key={day.date} className="gop-card p-0 overflow-hidden">
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

            {isDayOpen && (
              <div className="border-t border-surface-border divide-y divide-surface-border">
                {day.commissions.map(group => {
                  const key = `${group.commission}__${group.date}`
                  const isJuryOpen = expandedJurys[key]

                  return (
                    <div key={key} className="px-5 py-4 space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-display font-bold text-sm text-ink-100">
                            Commission {group.commission}
                          </p>
                          <p className="text-xs text-ink-500 font-body mt-0.5">
                            {group.totalEleves} élève{group.totalEleves > 1 ? 's' : ''} dans la fenêtre ±2j
                          </p>
                        </div>
                        {group.hasRealData ? (
                          <span className="text-xs bg-green-500/10 border border-green-500/20 text-green-400 rounded-full px-2.5 py-0.5">
                            ✓ Données réelles
                          </span>
                        ) : (
                          <span className="text-xs bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-full px-2.5 py-0.5">
                            ~ Estimé
                          </span>
                        )}
                      </div>

                      {/* Données réelles */}
                      {group.hasRealData && (
                        <div className="space-y-2">
                          <p className="font-body text-xs text-ink-500 uppercase tracking-widest">
                            Confirmé par les élèves
                          </p>
                          {group.realSpes.map(({ spe, pct }) => (
                            <div key={spe}>
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-body text-sm text-ink-100">{spe}</span>
                                <span className="font-display font-bold text-sm text-accent">{pct}%</span>
                              </div>
                              <div className="bg-surface-high rounded-full h-1.5 overflow-hidden">
                                <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          ))}
                          {group.juryAnnexePct > 0 && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-body text-ink-400 italic">Jury annexe</span>
                              <span className="font-display font-bold text-ink-400">{group.juryAnnexePct}%</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Données estimées */}
                      {!group.hasRealData && group.estimatedSpes.length > 0 && (
                        <div className="space-y-2">
                          <p className="font-body text-xs text-ink-500 uppercase tracking-widest">
                            Spécialités probables ce jour
                          </p>
                          {group.estimatedSpes.slice(0, 4).map(({ spe, pct, signal }) => (
                            <div key={spe} className={`border rounded-xl px-4 py-2.5 flex items-center justify-between ${signalBg(signal)}`}>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-body ${signalColor(signal)}`}>
                                  {signal === 'fort' ? '▲' : signal === 'moyen' ? '◆' : '▸'}
                                </span>
                                <span className={`font-body text-sm ${signal === 'fort' ? 'text-ink-100 font-medium' : 'text-ink-300'}`}>
                                  {spe}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className={`font-display font-bold text-sm ${signalColor(signal)}`}>{pct}%</span>
                                <p className="text-xs text-ink-500">{signalLabel(signal)}</p>
                              </div>
                            </div>
                          ))}
                          <p className="text-xs text-ink-500 italic">
                            ⚠️ Estimation — jury annexe toujours possible
                          </p>
                        </div>
                      )}

                      {!group.hasRealData && group.estimatedSpes.length === 0 && (
                        <p className="text-xs text-ink-500 italic">Pas assez de données pour estimer.</p>
                      )}

                      {/* Jurys plausibles déroulant */}
                      {group.plausibleJurys.length > 0 && (
                        <div>
                          <button
                            onClick={() => toggleJury(key)}
                            className="w-full flex items-center justify-between text-xs text-ink-400 hover:text-ink-200 transition-colors py-1"
                          >
                            <span>{isJuryOpen ? 'Masquer' : 'Voir les couples observés'}</span>
                            <span>{isJuryOpen ? '▲' : '▼'}</span>
                          </button>
                          {isJuryOpen && (
                            <div className="mt-3 pt-3 border-t border-surface-border space-y-2">
                              {group.plausibleJurys.map((jury, i) => (
                                <div key={i} className="flex items-center justify-between bg-surface-high border border-surface-border rounded-xl px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    {i === 0 && <span className="text-accent text-xs">▲</span>}
                                    <span className="font-display font-bold text-sm text-ink-50">{jury.spe1}</span>
                                    <span className="text-ink-500 text-xs">+</span>
                                    <span className="font-display font-bold text-sm text-ink-50">{jury.spe2}</span>
                                  </div>
                                  <span className="text-xs text-ink-400 bg-surface-border rounded-full px-2.5 py-1">
                                    {jury.count} obs.
                                  </span>
                                </div>
                              ))}
                              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
                                <span className="text-yellow-400 shrink-0">⚠️</span>
                                <p className="font-body text-xs text-yellow-300 leading-relaxed">
                                  <span className="font-bold">Jury annexe toujours possible</span> — un examinateur peut être hors spécialité observable.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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