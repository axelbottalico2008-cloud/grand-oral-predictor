import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { computePrediction } from '@/lib/scoring'
import { v4 as uuidv4 } from 'uuid'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 180
const COOKIE_NAME = 'gop_submitted'

export async function POST(req: NextRequest) {
  try {
    const existingCookie = req.cookies.get(COOKIE_NAME)
    if (existingCookie?.value) {
      return NextResponse.json(
        {
          error: 'already_submitted',
          id: existingCookie.value,
          message: 'Tu as deja soumis ta prediction.',
        },
        { status: 409 }
      )
    }

    const body = await req.json()
    const { lycee, classe, spe1, spe2, commission, date_passage, heure_passage } = body

    if (!lycee || !spe1 || !spe2 || !commission || !date_passage || !heure_passage) {
      return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 400 })
    }
    if (spe1 === spe2) {
      return NextResponse.json(
        { error: 'Les deux specialites doivent etre differentes.' },
        { status: 400 }
      )
    }

    const id = uuidv4()

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
      return NextResponse.json({ error: 'Erreur base de donnees.' }, { status: 500 })
    }

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

    const prediction = computePrediction(
      { lycee, spe1, spe2, commission, heure_passage },
      entries || []
    )

    const response = NextResponse.json({ id, prediction })
    response.cookies.set(COOKIE_NAME, id, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('[submit] Unexpected error:', err)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}