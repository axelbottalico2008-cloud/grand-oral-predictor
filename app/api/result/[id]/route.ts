import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { computePrediction } from '@/lib/scoring'

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // ── Validation UUID ──────────────────────────────────────────────────────
    if (!id || !isValidUUID(id)) {
      return NextResponse.json({ error: 'Identifiant invalide.' }, { status: 400 })
    }

    const { data: entry, error: entryError } = await supabase
      .from('entries')
      .select('*')
      .eq('id', id)
      .single()

    if (entryError || !entry) {
      return NextResponse.json({ error: 'Résultat introuvable.' }, { status: 404 })
    }

    const { data: others } = await supabase
      .from('entries')
      .select('*')
      .neq('id', id)
      .order('created_at', { ascending: false })
      .limit(500)

    const prediction = computePrediction(
      {
        lycee: entry.lycee,
        classe: entry.classe ?? '',
        spe1: entry.spe1,
        spe2: entry.spe2,
        commission: entry.commission,
        heure_passage: entry.heure_passage,
        date_passage: entry.date_passage,
      },
      others || []
    )

    const { count: totalEntries } = await supabase
      .from('entries')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      entry,
      prediction,
      stats: { totalEntries: totalEntries ?? 0 },
    })
  } catch (err) {
    console.error('[result] Unexpected error:', err)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
