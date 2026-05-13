import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen grid-bg flex flex-col items-center justify-center px-4 text-center">
      <div className="space-y-4 max-w-sm">
        <p className="font-display font-800 text-6xl text-accent">404</p>
        <h1 className="font-display font-700 text-2xl text-ink-50">
          Résultat introuvable
        </h1>
        <p className="font-body text-ink-400 text-sm">
          Ce lien de résultat n&apos;existe pas ou a expiré.
        </p>
        <Link href="/form">
          <button className="gop-btn mt-4 max-w-xs mx-auto font-display font-bold text-ink">
            Nouvelle prédiction →
          </button>
        </Link>
      </div>
    </main>
  )
}
