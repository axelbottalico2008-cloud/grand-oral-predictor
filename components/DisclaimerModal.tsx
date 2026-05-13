'use client'

import { useEffect, useState } from 'react'

/**
 * Modal de disclaimer affiché une fois à l'ouverture du site.
 * La réponse est sauvegardée en localStorage pour ne pas re-afficher
 * à chaque navigation (mais réapparaît à chaque nouvelle session).
 */
export default function DisclaimerModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const dismissed = sessionStorage.getItem('gop_disclaimer')
    if (!dismissed) setOpen(true)
  }, [])

  const handleAccept = () => {
    sessionStorage.setItem('gop_disclaimer', '1')
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-ink/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-surface-raised border border-surface-border rounded-2xl p-6 space-y-4 shadow-2xl">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-xl">
          ⚠️
        </div>

        {/* Title */}
        <h2 className="font-display font-bold text-xl text-ink-50">
          Avant de commencer
        </h2>

        {/* Body */}
        <div className="space-y-3 font-body text-sm text-ink-300 leading-relaxed">
          <p>
            <span className="text-ink-100 font-medium">Grand Oral Predictor</span> est
            un outil communautaire et statistique, <span className="text-ink-100">sans aucune valeur officielle</span>.
          </p>
          <p>
            Les estimations sont calculées à partir des données partagées
            anonymement par d&apos;autres élèves. Elles ne reflètent pas
            les décisions réelles des jurys et commissions.
          </p>
          <ul className="space-y-1.5 pl-4 list-disc text-ink-400">
            <li>Les probabilités affichées sont <strong className="text-ink-300">plafonnées à 90 %</strong> intentionnellement.</li>
            <li>Aucun résultat n&apos;est garanti ni certifié.</li>
            <li>Aucune donnée personnelle n&apos;est collectée.</li>
          </ul>
          <p>
            En continuant, tu acceptes d&apos;utiliser cet outil à titre
            purement informatif.
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={handleAccept}
          className="gop-btn font-display font-bold text-ink"
        >
          J&apos;ai compris, continuer →
        </button>
      </div>
    </div>
  )
}
