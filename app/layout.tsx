import type { Metadata } from 'next'
import './globals.css'
import DisclaimerModal from '@/components/DisclaimerModal'

export const metadata: Metadata = {
  title: 'Grand Oral Predictor',
  description:
    "Outil communautaire d'estimation probabiliste de la spécialité du Grand Oral — sans valeur officielle.",
  openGraph: {
    title: 'Grand Oral Predictor',
    description: 'Quelle spécialité vas-tu passer au Grand Oral ?',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-ink antialiased">
        <DisclaimerModal />
        {children}
      </body>
    </html>
  )
}
