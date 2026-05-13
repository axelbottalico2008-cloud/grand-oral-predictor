import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { computePrediction } from '@/lib/scoring'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Récupère l'entrée ciblée
    const { data: entry, error: entryError } = await supabase
      .from('entries')
      .select('*')
      .eq('id', id)
      .single()

    if (entryError || !entry) {
      return NextResponse.json({ error: 'Résultat introuvable.' }, { status: 404 })
    }

    // Récupère tous les autres profils pour recalculer la prédiction
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

    // Statistiques globales anonymes (bonus)
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
