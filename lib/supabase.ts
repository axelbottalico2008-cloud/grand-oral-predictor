import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Client Supabase partagé (côté browser et serveur léger).
 * Pour les routes API, on pourrait utiliser la service_role key,
 * mais pour un MVP avec RLS désactivé c'est suffisant.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Entry = {
  id: string
  created_at: string
  lycee: string
  classe: string | null
  spe1: string
  spe2: string
  commission: string
  date_passage: string  // format YYYY-MM-DD
  heure_passage: string // format HH:MM
}
