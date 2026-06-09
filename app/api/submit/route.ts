import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { computePrediction } from '@/lib/scoring'
import { v4 as uuidv4 } from 'uuid'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 180
const COOKIE_NAME = 'gop_submitted'

// Spécialités autorisées (liste fermée — évite les injections de valeurs arbitraires)
const SPECIALITES_VALIDES = new Set([
  'Maths', 'Physique-Chimie', 'SVT', 'SI', 'NSI', 'SES',
  'Histoire-Géographie', 'HGGSP', 'Humanités', 'Langues vivantes',
  'Arts', 'EPS', 'Philosophie', 'Biologie-Écologie', 'LLCE', 'AMC',
])

const MAX_LEN = 100  // longueur max pour les champs texte libres

function sanitize(str: string): string {
  return str.trim().slice(0, MAX_LEN)
}

function isValidDate(str: string): boolean {
  const d = new Date(str)
  return !isNaN(d.getTime())
}

function isValidTime(str: string): boolean {
  return /^\d{2}:\d{2}(:\d{2})?$/.test(str)
}

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)
}

export async function POST(req: NextRequest) {
  try {
    const existingCookie = req.cookies.get(COOKIE_NAME)
    if (existingCookie?.value && isValidUUID(existingCookie.value)) {
      return NextResponse.json(
        {
          error: 'already_submitted',
          id: existingCookie.value,
          message: 'Tu as déjà soumis ta prédiction.',
        },
        { status: 409 }
      )
    }

    const body = await req.json()
    const { lycee, classe, spe1, spe2, commission, date_passage, heure_passage } = body

    // ── Validation des champs obligatoires ──────────────────────────────────
    if (!lycee || !classe || !spe1 || !spe2 || !commission || !date_passage || !heure_passage) {
      return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 400 })
    }

    if (spe1 === spe2) {
      return NextResponse.json(
        { error: 'Les deux spécialités doivent être différentes.' },
        { status: 400 }
      )
    }

    // ── Validation des spécialités (liste fermée) ───────────────────────────
    if (!SPECIALITES_VALIDES.has(spe1) || !SPECIALITES_VALIDES.has(spe2)) {
      return NextResponse.json({ error: 'Spécialité invalide.' }, { status: 400 })
    }

    // ── Validation format date et heure ────────────────────────────────────
    if (!isValidDate(date_passage)) {
      return NextResponse.json({ error: 'Date de passage invalide.' }, { status: 400 })
    }
    if (!isValidTime(heure_passage)) {
      return NextResponse.json({ error: 'Heure de passage invalide.' }, { status: 400 })
    }

    // ── Sanitisation des champs texte libres ────────────────────────────────
    const cleanLycee      = sanitize(lycee)
    const cleanClasse     = sanitize(classe)
    const cleanCommission = sanitize(commission)

    const id = uuidv4()

    const { error: insertError } = await supabase.from('entries').insert([
      {
        id,
        lycee: cleanLycee,
        classe: cleanClasse,
        spe1: spe1.trim(),
        spe2: spe2.trim(),
        commission: cleanCommission,
        date_passage,
        heure_passage,
      },
    ])

    if (insertError) {
      console.error('[submit] Supabase insert error:', insertError)
      return NextResponse.json({ error: 'Erreur base de données.' }, { status: 500 })
    }

    const { data: entries, error: fetchError } = await supabase
      .from('entries')
      .select('*')
      .neq('id', id)
      .order('created_at', { ascending: false })
      .limit(500)

    if (fetchError) {
      console.error('[submit] Supabase fetch error:', fetchError)
      return NextResponse.json({ id, prediction: null })
    }

    const prediction = computePrediction(
      {
        lycee: cleanLycee,
        classe: cleanClasse,
        spe1: spe1.trim(),
        spe2: spe2.trim(),
        commission: cleanCommission,
        heure_passage,
        date_passage,
      },
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
