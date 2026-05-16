'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

export default function QRCodePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const url = 'https://grand-oral-predictor.vercel.app'

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
    script.onload = () => {
      const container = document.getElementById('qrcode-container')
      if (container) {
        container.innerHTML = ''
        // @ts-expect-error QRCode is loaded from CDN
        new window.QRCode(container, {
          text: url,
          width: 220,
          height: 220,
          colorDark: '#E8FF4A',
          colorLight: '#0D0D0D',
          correctLevel: 2,
        })
      }
    }
    document.body.appendChild(script)
  }, [])

  return (
    <main className="min-h-screen grid-bg flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-ink-400 hover:text-ink-100 transition-colors text-sm font-body">
            &larr; Retour
          </Link>
        </div>

        <div className="gop-card text-center space-y-6">
          <div>
            <h1 className="font-display font-bold text-2xl text-ink-50">QR Code</h1>
            <p className="font-body text-sm text-ink-400 mt-1">
              Scanne pour accéder au site
            </p>
          </div>

          <div className="flex justify-center">
            <div
              id="qrcode-container"
              className="p-4 bg-ink rounded-2xl border border-surface-border"
            />
          </div>

          <div className="bg-surface-high rounded-xl px-4 py-2.5">
            <p className="font-body text-xs text-ink-400 break-all">{url}</p>
          </div>

          <p className="font-body text-xs text-ink-500">
            Partage ce QR code avec tes camarades pour qu ils soumettent leur profil et améliorer les prédictions !
          </p>
        </div>
      </div>
    </main>
  )
}