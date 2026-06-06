import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const SPECIALITES_VALIDES = new Set([
  'Maths', 'Physique-Chimie', 'SVT', 'SI', 'NSI', 'SES',
  'Histoire-Géographie', 'HGGSP', 'Humanités', 'Langues vivantes',
  'Arts', 'EPS', 'Philosophie', 'Biologie-Écologie', 'LLCE', 'AMC',
])

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)
}

export async function POST(req: NextRequest) {
  try {
    const { id, spe_passee } = await req.json()

    if (!id || !spe_passee) {
      return NextResponse.json({ error: 'Champs manquants.' }, { status: 400 })
    }

    // ── Validation UUID pour éviter les mises à jour arbitraires ───────────
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Identifiant invalide.' }, { status: 400 })
    }

    // ── Validation spé passée (liste fermée) ────────────────────────────────
    if (!SPECIALITES_VALIDES.has(spe_passee.trim())) {
      return NextResponse.json({ error: 'Spécialité invalide.' }, { status: 400 })
    }

    // ── Vérifier que la spe_passee correspond à une spé de l'entrée ─────────
    const { data: entry, error: fetchError } = await supabase
      .from('entries')
      .select('spe1, spe2, spe_passee')
      .eq('id', id)
      .single()

    if (fetchError || !entry) {
      return NextResponse.json({ error: 'Entrée introuvable.' }, { status: 404 })
    }

    // Empêcher la réécriture si déjà renseigné
    if (entry.spe_passee) {
      return NextResponse.json({ error: 'Spécialité déjà renseignée.' }, { status: 409 })
    }

    // La spé passée doit être l'une des deux spés déclarées
    const declared = [entry.spe1.trim(), entry.spe2.trim()]
    if (!declared.includes(spe_passee.trim())) {
      return NextResponse.json(
        { error: 'La spécialité passée doit correspondre à l\'une de vos spécialités déclarées.' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('entries')
      .update({ spe_passee: spe_passee.trim() })
      .eq('id', id)

    if (error) return NextResponse.json({ error: 'Erreur base de données.' }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
