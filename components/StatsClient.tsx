'use client'

import { useState } from 'react'

type TfidfEntry = {
  spe: string
  localFreq: number
  globalFreq: number
  score: number
}

type CommissionDay = {
  commission: string
  date: string
  totalEleves: number
  hasRealData: boolean
  realSpes: Record<string, number>
  juryAnnexeCount: number
  tfidfScores: TfidfEntry[]
  plausibleJurys: { spe1: string; spe2: string; count: number }[]
}

type Day = {
  date: string
  commissions: CommissionDay[]
  totalEleves: number
}

export default function StatsClient({ days }: { days: Day[] }) {
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({})
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState('')

  const toggleDay = (date: string) => setExpandedDays(prev => ({ ...prev, [date]: !prev[date] }))
  const toggleDetails = (key: string) => setExpandedDetails(prev => ({ ...prev, [key]: !prev[key] }))

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
                  const isOpen = expandedDetails[key]

                  const totalReal = Object.values(group.realSpes).reduce((a, b) => a + b, 0) + group.juryAnnexeCount
                  const sortedReal = Object.entries(group.realSpes).sort((a, b) => b[1] - a[1])

                  // TF-IDF : sépare surreprésentées (score > 1.2) et fréquentes (score <= 1.2)
                  const surrepresented = group.tfidfScores.filter(t => t.score > 1.2).slice(0, 3)
                  const frequent = group.tfidfScores.filter(t => t.score <= 1.2 && t.localFreq > 0.3).slice(0, 2)

                  return (
                    <div key={key} className="px-5 py-4 space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-display font-bold text-sm text-ink-100">
                            Commission {group.commission}
                          </p>
                          <p className="text-xs text-ink-500 font-body mt-0.5">
                            {group.totalEleves} élève{group.totalEleves > 1 ? 's' : ''} · fenêtre ±2j
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
                            Spés confirmées par les élèves
                          </p>
                          {sortedReal.map(([spe, count]) => {
                            const pct = totalReal > 0 ? Math.round((count / totalReal) * 100) : 0
                            return (
                              <div key={spe}>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-body text-sm text-ink-100">{spe}</span>
                                  <span className="font-display font-bold text-sm text-accent">{pct}%</span>
                                </div>
                                <div className="bg-surface-high rounded-full h-1.5 overflow-hidden">
                                  <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            )
                          })}
                          {group.juryAnnexeCount > 0 && (
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-body text-sm text-ink-400 italic">Jury annexe</span>
                                <span className="font-display font-bold text-sm text-ink-400">
                                  {Math.round((group.juryAnnexeCount / totalReal) * 100)}%
                                </span>
                              </div>
                              <div className="bg-surface-high rounded-full h-1.5 overflow-hidden">
                                <div className="h-full bg-ink-400 rounded-full"
                                  style={{ width: `${Math.round((group.juryAnnexeCount / totalReal) * 100)}%` }} />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Données estimées avec TF-IDF */}
                      {!group.hasRealData && (
                        <div className="space-y-3">
                          {/* Spés surreprésentées = signal fort */}
                          {surrepresented.length > 0 && (
                            <div className="space-y-2">
                              <p className="font-body text-xs text-ink-500 uppercase tracking-widest">
                                Signal fort — surreprésentées dans cette commission
                              </p>
                              {surrepresented.map((t) => (
                                <div key={t.spe} className="flex items-center justify-between bg-accent/5 border border-accent/20 rounded-xl px-4 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-accent text-xs">▲</span>
                                    <span className="font-body text-sm text-ink-100 font-medium">{t.spe}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-display font-bold text-sm text-accent">
                                      ×{t.score.toFixed(1)}
                                    </span>
                                    <p className="text-xs text-ink-500">vs moyenne</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Spés fréquentes = bruit probable */}
                          {frequent.length > 0 && (
                            <div className="space-y-2">
                              <p className="font-body text-xs text-ink-500 uppercase tracking-widest">
                                Fréquentes mais peu distinctives
                              </p>
                              {frequent.map((t) => (
                                <div key={t.spe} className="flex items-center justify-between bg-surface-high rounded-xl px-4 py-2.5">
                                  <span className="font-body text-sm text-ink-400">{t.spe}</span>
                                  <span className="text-xs text-ink-500">
                                    ×{t.score.toFixed(1)} vs moyenne
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {surrepresented.length === 0 && frequent.length === 0 && (
                            <p className="text-xs text-ink-500 italic">Pas assez de données distinctives.</p>
                          )}
                        </div>
                      )}

                      {/* Jurys plausibles déroulant */}
                      {group.plausibleJurys.length > 0 && (
                        <div>
                          <button
                            onClick={() => toggleDetails(key)}
                            className="w-full flex items-center justify-between text-xs text-ink-400 hover:text-ink-200 transition-colors py-1"
                          >
                            <span>{isOpen ? 'Masquer' : 'Voir les jurys plausibles'}</span>
                            <span>{isOpen ? '▲' : '▼'}</span>
                          </button>
                          {isOpen && (
                            <div className="mt-3 pt-3 border-t border-surface-border space-y-3">
                              <p className="font-body text-xs text-ink-500 uppercase tracking-widest">
                                Couples observés
                              </p>
                              {group.plausibleJurys.map((jury, i) => (
                                <div key={i} className="flex items-center justify-between bg-surface-high border border-surface-border rounded-xl px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    {i === 0 && <span className="text-accent">▲</span>}
                                    <span className="font-display font-bold text-base text-ink-50">
                                      {jury.spe1}
                                    </span>
                                    <span className="text-ink-500">+</span>
                                    <span className="font-display font-bold text-base text-ink-50">
                                      {jury.spe2}
                                    </span>
                                  </div>
                                  <span className="text-xs text-ink-400 bg-surface-border rounded-full px-2.5 py-1">
                                    {jury.count} obs.
                                  </span>
                                </div>
                              ))}
                              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
                                <span className="text-yellow-400 text-lg shrink-0">⚠️</span>
                                <p className="font-body text-sm text-yellow-300 leading-relaxed">
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