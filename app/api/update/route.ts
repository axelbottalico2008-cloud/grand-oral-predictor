import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { id, spe_passee } = await req.json()
    if (!id || !spe_passee) {
      return NextResponse.json({ error: 'Manquant' }, { status: 400 })
    }
    const { error } = await supabase
      .from('entries')
      .update({ spe_passee })
      .eq('id', id)
    if (error) return NextResponse.json({ error: 'DB error' }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}