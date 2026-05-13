import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="relative min-h-screen grid-bg flex flex-col items-center justify-center px-4 py-16 overflow-hidden">
      {/* Glow background */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full text-center space-y-8">
        {/* Badge */}
        <div data-animate="1" className="inline-flex items-center gap-2 bg-surface-raised border border-surface-border rounded-full px-4 py-1.5">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-body text-ink-300 tracking-wider uppercase">Outil statistique communautaire</span>
        </div>

        {/* Title */}
        <div data-animate="2">
          <h1 className="font-display font-800 text-5xl sm:text-6xl leading-none tracking-tight text-ink-50">
            Grand Oral
            <br />
            <span className="text-accent">Predictor</span>
          </h1>
          <p className="mt-4 font-body text-ink-300 text-base leading-relaxed">
            Tu passes bientôt le Grand Oral ? Renseigne ton profil et découvre
            sur quelle spécialité tu as le plus de chances d&apos;être interrogé,
            selon les données partagées par la communauté.
          </p>
        </div>

        {/* CTA */}
        <div data-animate="3">
          <Link href="/form">
            <button className="gop-btn max-w-xs mx-auto block text-ink font-display font-bold">
              Lancer la prédiction →
            </button>
          </Link>
        </div>

        {/* Features */}
        <div data-animate="4" className="grid grid-cols-3 gap-3 pt-4">
          {[
            { icon: '🔒', label: 'Anonyme', desc: 'Aucun compte requis' },
            { icon: '⚡', label: 'Instantané', desc: 'Résultat immédiat' },
            { icon: '📊', label: 'Statistique', desc: 'Basé sur la communauté' },
          ].map((f) => (
            <div key={f.label} className="gop-card text-center p-4">
              <div className="text-2xl mb-1">{f.icon}</div>
              <div className="font-display text-sm font-700 text-ink-100">{f.label}</div>
              <div className="font-body text-xs text-ink-400 mt-0.5">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p data-animate="5" className="text-xs font-body text-ink-500 leading-relaxed px-4">
          ⚠️ Cet outil est purement indicatif et n&apos;a aucune valeur officielle.
          Les résultats sont calculés à partir de données partagées anonymement
          par d&apos;autres élèves.
        </p>
      </div>
    </main>
  )
}
