-- ─────────────────────────────────────────────────────────────────────────────
-- Migration : création de la table "entries"
-- À exécuter dans l'éditeur SQL de Supabase (ou via supabase db push).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.entries (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  lycee         TEXT        NOT NULL,
  classe        TEXT,                     -- nullable
  spe1          TEXT        NOT NULL,
  spe2          TEXT        NOT NULL,
  commission    TEXT        NOT NULL,
  date_passage  DATE        NOT NULL,
  heure_passage TIME        NOT NULL
);

-- Index pour accélérer les recherches par commission / lycée
CREATE INDEX IF NOT EXISTS idx_entries_commission ON public.entries (commission);
CREATE INDEX IF NOT EXISTS idx_entries_lycee      ON public.entries (lycee);
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON public.entries (created_at DESC);

-- ─── Politiques RLS (optionnel mais recommandé) ───────────────────────────────
-- Désactivé par défaut pour simplifier le MVP.
-- Si tu veux activer RLS :
--
-- ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
--
-- -- Tout le monde peut insérer (anonyme)
-- CREATE POLICY "insert_anon" ON public.entries
--   FOR INSERT TO anon WITH CHECK (true);
--
-- -- Tout le monde peut lire (pour le calcul de score)
-- CREATE POLICY "select_anon" ON public.entries
--   FOR SELECT TO anon USING (true);
