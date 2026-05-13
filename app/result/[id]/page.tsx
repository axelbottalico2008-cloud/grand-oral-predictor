import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { computePrediction, confidenceLabel, confidenceColor } from '@/lib/scoring'
import ShareButton from '@/components/ShareButton'
import RefreshButton from '@/components/RefreshButton'

interface Props {
  params: { id: string }
}

export const revalidate = 30

export default async function ResultPage({ params }: Props) {
  const { id } = params

  // ── Récupération de l'entrée ──────────────────────────────────────────────
  const { data: entry, error } = await supabase
    .from('entries')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !entry) notFound()

  // ── Autres profils pour le calcul ────────────────────────────────────────
  const { data: others } = await supabase
    .from('entries')
    .select('*')
    .neq('id', id)
    .order('created_at', { ascending: false })
    .limit(200)

  const prediction = computePrediction(
    {
      lycee: entry.lycee,
      spe1: entry.spe1,
      spe2: entry.spe2,
      commission: entry.commission,
      heure_passage: entry.heure_passage,
    },
    others || []
  )

  // Stats globales
  const { count: totalEntries } = await supabase
    .from('entries')
    .select('*', { count: 'exact', head: true })

  const hasPrediction = prediction.topSpecialite !== 'Indéterminé'
  const confidenceText = confidenceLabel(prediction.confidence)
  const confidenceClass = confidenceColor(prediction.confidence)

  const shareUrl =
    typeof window === 'undefined'
      ? `https://grand-oral-predictor.vercel.app/result/${id}`
      : `${window.location.origin}/result/${id}`

  return (
    <main className="min-h-screen grid-bg flex flex-col items-center px-4 py-10">
      {/* Back */}
      <div className="w-full max-w-lg mb-8">
        <Link
          href="/form"
          className="inline-flex items-center gap-2 text-ink-400 hover:text-ink-100 transition-colors text-sm font-body"
        >
          ← Nouvelle prédiction
        </Link>
      </div>

      <div className="w-full max-w-lg space-y-5">
        {/* Header badge */}
        <div data-animate="1" className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-body text-ink-400 tracking-wider uppercase">
            Résultat de ton analyse
          </span>
        </div>

        {/* Main prediction card */}
        <div data-animate="2" className="gop-card relative overflow-hidden animate-pulse-glow">
          {/* Glow */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/10 rounded-full blur-2xl pointer-events-none" />

          {hasPrediction ? (
            <>
              <p className="font-body text-sm text-ink-400 mb-2">Spécialité la plus probable</p>
              <h1 className={`font-display font-800 text-4xl sm:text-5xl mb-4 leading-none ${confidenceClass}`}>
                {prediction.topSpecialite}
              </h1>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-surface-high rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-1000"
                    style={{ width: `${prediction.confidence}%` }}
                  />
                </div>
                <span className="font-display font-700 text-2xl text-accent">
                  {prediction.confidence}%
                </span>
              </div>
              <p className="font-body text-sm text-ink-400 mt-2">
                Niveau de confiance :{' '}
                <span className={`font-medium ${confidenceClass}`}>{confidenceText}</span>
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display font-800 text-3xl text-ink-300 mb-2">
                Données insuffisantes
              </h1>
              <p className="font-body text-sm text-ink-400">
                Tu es parmi les premiers à renseigner ton lycée / ta commission.
                Reviens quand plus d&apos;élèves auront partagé leur profil pour
                obtenir une prédiction.
              </p>
            </>
          )}
        </div>

        {/* Breakdown */}
        {prediction.breakdown.length > 1 && (
          <div data-animate="3" className="gop-card space-y-3">
            <h2 className="font-display font-700 text-sm text-ink-300 uppercase tracking-widest mb-4">
              Répartition complète
            </h2>
            {prediction.breakdown.slice(0, 6).map((item, i) => (
              <div key={item.specialite}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-body text-sm text-ink-100">{item.specialite}</span>
                  <span className="font-display font-700 text-sm text-ink-300">
                    {item.pct}%
                  </span>
                </div>
                <div className="bg-surface-high rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      i === 0 ? 'bg-accent' : 'bg-ink-400'
                    }`}
                    style={{
                      width: `${item.pct}%`,
                      transitionDelay: `${i * 100}ms`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Profil info */}
        <div data-animate="4" className="gop-card">
          <h2 className="font-display font-700 text-sm text-ink-300 uppercase tracking-widest mb-4">
            Ton profil soumis
          </h2>
          <dl className="space-y-2.5">
            {[
              { label: 'Lycée', value: entry.lycee },
              { label: 'Classe', value: entry.classe ?? '—' },
              {
                label: 'Spécialités',
                value: `${entry.spe1} · ${entry.spe2}`,
              },
              { label: 'Commission', value: entry.commission },
              {
                label: 'Passage',
                value: `${new Date(entry.date_passage).toLocaleDateString('fr-FR')} à ${entry.heure_passage.slice(0, 5)}`,
              },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-start gap-4">
                <dt className="font-body text-xs text-ink-500 uppercase tracking-wider shrink-0">
                  {row.label}
                </dt>
                <dd className="font-body text-sm text-ink-200 text-right">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Stats anonymes */}
        <div data-animate="5" className="flex gap-3">
          <div className="gop-card flex-1 text-center py-4">
            <p className="font-display font-700 text-2xl text-accent">
              {prediction.totalSimilarProfiles}
            </p>
            <p className="font-body text-xs text-ink-400 mt-0.5">
              profils comparés
            </p>
          </div>
          <div className="gop-card flex-1 text-center py-4">
            <p className="font-display font-700 text-2xl text-ink-100">
              {totalEntries ?? '—'}
            </p>
            <p className="font-body text-xs text-ink-400 mt-0.5">
              entrées totales
            </p>
          </div>
        </div>

	<div data-animate="6">
 	 <RefreshButton />
	</div>

        {/* Share */}
        <div data-animate="6">
          <ShareButton url={`/result/${id}`} />
        </div>

        {/* Disclaimer renforcé */}
        <div data-animate="6" className="bg-surface-raised border border-yellow-500/20 rounded-xl p-4 space-y-1.5">
          <p className="font-display font-bold text-xs text-yellow-400 uppercase tracking-widest">
            ⚠️ Résultat non officiel
          </p>
          <p className="font-body text-xs text-ink-400 leading-relaxed">
            Ces probabilités sont <span className="text-ink-200">plafonnées à 90 %</span> intentionnellement
            et calculées uniquement à partir de données partagées anonymement
            par d&apos;autres élèves. Elles ne reflètent pas les décisions
            réelles des jurys. <span className="text-ink-200">Aucune garantie n&apos;est donnée.</span>
          </p>
        </div>
      </div>
    </main>
  )
}
