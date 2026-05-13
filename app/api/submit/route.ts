import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { computePrediction } from '@/lib/scoring'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { lycee, classe, spe1, spe2, commission, date_passage, heure_passage } = body

    // ── Validation basique ──────────────────────────────────────────────────
    if (!lycee || !spe1 || !spe2 || !commission || !date_passage || !heure_passage) {
      return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 400 })
    }
    if (spe1 === spe2) {
      return NextResponse.json(
        { error: 'Les deux spécialités doivent être différentes.' },
        { status: 400 }
      )
    }

    // ── Génération de l'ID résultat ─────────────────────────────────────────
    const id = uuidv4()

    // ── Insertion dans Supabase ─────────────────────────────────────────────
    const { error: insertError } = await supabase.from('entries').insert([
      {
        id,
        lycee: lycee.trim(),
        classe: classe?.trim() || null,
        spe1: spe1.trim(),
        spe2: spe2.trim(),
        commission: commission.trim(),
        date_passage,
        heure_passage,
      },
    ])

    if (insertError) {
      console.error('[submit] Supabase insert error:', insertError)
      return NextResponse.json({ error: 'Erreur base de données.' }, { status: 500 })
    }

    // ── Récupération des profils similaires (hors entrée courante) ──────────
    const { data: entries, error: fetchError } = await supabase
      .from('entries')
      .select('*')
      .neq('id', id)
      .order('created_at', { ascending: false })
      .limit(200)

    if (fetchError) {
      console.error('[submit] Supabase fetch error:', fetchError)
      return NextResponse.json({ id, prediction: null })
    }

    // ── Calcul du score ─────────────────────────────────────────────────────
    const prediction = computePrediction(
      { lycee, spe1, spe2, commission, heure_passage },
      entries || []
    )

    return NextResponse.json({ id, prediction })
  } catch (err) {
    console.error('[submit] Unexpected error:', err)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
