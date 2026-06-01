-- ============================================================================
--  IMAGE MYSTÈRE — 3e jeu (500 points)
--  Une image cachée par 100 blocs. Chaque bonne réponse au quiz révèle un bloc.
--  À la fin, la famille devine le dessin animé (texte libre), l'admin valide.
--  À exécuter dans Supabase → SQL Editor (après schema.sql).
-- ============================================================================

-- L'image à deviner (une seule active à la fois)
create table if not exists public.mystery_image (
  id         uuid primary key default gen_random_uuid(),
  image_url  text not null,
  answer     text not null default '',   -- réponse de référence (visible admin uniquement via service_role)
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.mystery_image enable row level security;
drop policy if exists "read_mystery_image" on public.mystery_image;
create policy "read_mystery_image" on public.mystery_image for select using (true);

-- La proposition de chaque famille (1 par famille)
create table if not exists public.mystery_guesses (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references public.families(id) on delete cascade unique,
  guess      text not null default '',
  status     submission_status not null default 'pending',
  created_at timestamptz not null default now()
);
alter table public.mystery_guesses enable row level security;
drop policy if exists "read_mystery_guesses" on public.mystery_guesses;
create policy "read_mystery_guesses" on public.mystery_guesses for select using (true);
-- Pas de policy insert/update pour anon : la soumission passe par la RPC ci-dessous
-- (security definer) et la validation par l'admin (service_role). On évite ainsi
-- qu'une famille passe sa propre proposition en "approved".

-- (Temps réel optionnel : à activer une seule fois si souhaité, voir note en bas de fichier)

-- Soumission d'une proposition (toujours en "pending", jamais auto-validée)
create or replace function public.submit_mystery_guess(p_family_id uuid, p_guess text)
returns public.mystery_guesses
language plpgsql security definer as $$
declare v_row public.mystery_guesses;
begin
  insert into public.mystery_guesses (family_id, guess, status)
  values (p_family_id, p_guess, 'pending')
  on conflict (family_id) do update set guess = excluded.guess, status = 'pending', created_at = now()
  returning * into v_row;
  return v_row;
end; $$;

-- ── Vue de classement : on ajoute les 500 points de l'image mystère ──────────
-- DROP obligatoire : on insère une colonne au milieu, ce que CREATE OR REPLACE interdit.
drop view if exists public.family_scores;
create view public.family_scores as
select
  f.id as family_id, f.name, f.avatar, f.color,
  coalesce(ms.pts,0)  as mission_points,
  coalesce(sm.pts,0)  as secret_points,
  coalesce(qz.pts,0)  as quiz_points,
  coalesce(bt.pts,0)  as blind_points,
  coalesce(my.pts,0)  as mystery_points,
  coalesce(ms.pts,0)+coalesce(sm.pts,0)+coalesce(qz.pts,0)+coalesce(bt.pts,0)+coalesce(my.pts,0) as total_points,
  coalesce(ms.cnt,0)  as missions_completed
from public.families f
left join (select family_id, sum(points_awarded) pts, count(*) cnt from public.mission_submissions where status='approved' group by family_id) ms on ms.family_id=f.id
left join (select family_id, sum(points) pts from public.secret_missions where status='approved' group by family_id) sm on sm.family_id=f.id
left join (select family_id, sum(points_awarded) pts from public.quiz_answers group by family_id) qz on qz.family_id=f.id
left join (select family_id, sum(points_awarded) pts from public.blind_answers group by family_id) bt on bt.family_id=f.id
left join (select family_id, 500 as pts from public.mystery_guesses where status='approved') my on my.family_id=f.id;

grant select on public.family_scores to anon, authenticated;
