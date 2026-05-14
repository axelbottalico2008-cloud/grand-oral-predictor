import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (id) {
      await supabase.from('entries').delete().eq('id', id)
    }
    const response = NextResponse.json({ ok: true })
    response.cookies.delete('gop_submitted')
    return response
  } catch {
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}